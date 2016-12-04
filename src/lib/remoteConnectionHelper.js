'use strict'

const _ = require('lodash')
const Q = require('q')
const fs = require('fs')
const path = require('path')
const moment = require('moment')
const sftpClient = require('sftpjs')
const curl = require('curlrequest')
const parseString = require('xml2js').parseString

const command = require('./commandHelper')
const dataDir = path.join(command.data)
const config = require('./configHelper')(dataDir)

let RemoteConnectionHelper = {}

RemoteConnectionHelper.parseConfiguration = function() {
  const deferred = Q.defer()
  // Read input files
  const inputFiles = config.get('storage:input:tables')
  if (_.isUndefined(inputFiles) || _.isEmpty(inputFiles)) {
    deferred.reject('No KBC Bucket/Table selected!')
  }

  // Read credentials from config
  const hostname = config.get('parameters:hostname')
  const username = config.get('parameters:username')
  const password = config.get('parameters:#password')
  if (_.isUndefined(hostname) || _.isUndefined(username) || _.isUndefined(password)) {
    deferred.reject('Missing credentials! Neither hostname, username, nor password specified!')
  }

  // Read other parameters from config
  const remotePath = config.get('parameters:remote_path') || '/'
  const protocol = config.get('parameters:protocol') || 'sftp'
  const appendDatetime = config.get('parameters:append_datetime') || false
  const trustUnsecureCertificate = config.get('parameters:trust_unsecure_certificate') || false

  deferred.resolve({
    hostname: hostname,
    username: username,
    password: password,
    remotePath: remotePath,
    protocol: protocol,
    appendDatetime: appendDatetime,
    inputFiles: inputFiles,
    trustUnsecureCertificate: trustUnsecureCertificate
  })

  return deferred.promise
}

RemoteConnectionHelper.prepareArrayOfPromises = function(configObject) {
  let promises = []

  _.forEach(configObject.inputFiles, (inputFile) => {
    promises.push(
      ((inputObject) => {
        return () => {
          const deferred = Q.defer()

          if (_.isUndefined(inputObject.destination)) {
            deferred.reject('Invalid input mapping!')
          } else {
            const localPath = path.join(dataDir, 'in', 'tables', inputObject.destination)
            const dateTimeSuffix = moment().format('YYYY-MM-DD_HH:mm:ss')
            const destinationFile = RemoteConnectionHelper.getDestinationFile(configObject.appendDatetime, inputObject.source, inputObject.destination, dateTimeSuffix)
            const destinationPath = path.join('/', configObject.remotePath, destinationFile)

            // We have to distinguish between SFTP and WebDAV process.
            if (configObject.protocol.toLowerCase() === 'sftp') {
              const sftp = sftpClient()

              sftp.on('ready', () => {
                sftp.put(localPath, destinationPath, (error, result) => {
                  if (error) {
                    deferred.reject(error)
                  }

                  sftp.end()
                  deferred.resolve(`${destinationPath} uploaded successfully!`)
                })
              }).connect({
                host: configObject.hostname,
                user: configObject.username,
                password: configObject.password
              })
            } else if (configObject.protocol.toLowerCase() === 'webdav') {
              const webdavUrl = `https://${configObject.hostname}${destinationPath}`
              const webdavUser = `${configObject.username}:${configObject.password}`

              let options = {}
              options['url'] = webdavUrl
              options['user'] = webdavUser
              options['upload-file'] = localPath

              if (configObject.trustUnsecureCertificate) {
                options['insecure'] = true
              }

              curl.request(options, function(error, stdout) {
                if (error) {
                  deferred.reject(error)
                } else {
                  deferred.resolve(`${destinationPath} uploaded successfully!`)
                }
              })
            } else {
              deferred.reject('Protocol defined in parameters:protocol attribute is not supported!')
            }
          }

          return deferred.promise
        }
      })(inputFile)
    )
  })


  return promises
}

RemoteConnectionHelper.getDestinationFile = function(appendDatetime, sourceName, destinationName, dateTimeSuffix) {
  if (!appendDatetime) {
    return destinationName
  } else if (sourceName === destinationName) {
    return `${destinationName}_${dateTimeSuffix}`
  } else {
    return `${path.parse(destinationName).name}_${dateTimeSuffix}${path.parse(destinationName).ext}`
  }
}

RemoteConnectionHelper.processArrayOfPromises = function(arrayOfPromises) {
  const results = arrayOfPromises.map(function(promise){
    return promise()
  })

  return Q.all(results)
}


module.exports = RemoteConnectionHelper