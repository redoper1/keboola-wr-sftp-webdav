const _ = require('lodash')
const path = require('path')
const nconf = require('nconf')
const moment = require('moment')
const isThere = require('is-there')
const constants = require('../constants')

/**
 * This function reads the specified configuration file.
 * If no file is specified, the program terminates.
 */
export function getConfig(configPath) {
  const config = nconf.env()
  if (isThere(configPath)) {
    config.file(configPath)
    return config
  } else {
    console.error('No configuration specified!')
    process.exit(1)
  }
}

/**
 * This function check the input configuration specified in KBC.
 * Check whether the required fields are provided.
 * Prepare simple output that is going to be used in later phases.
 */
export function parseConfiguration(configObject, dataDirectory) {
  return new Promise((resolve, reject) => {
    const inputFiles = configObject.get('storage:input:tables')
    if (_.isUndefined(inputFiles) || _.isEmpty(inputFiles)) {
      reject('No KBC Bucket/Table selected!')
    }
    const username = configObject.get('parameters:username')
    const password = configObject.get('parameters:#password')
    if (_.isUndefined(username) || _.isUndefined(password)) {
      reject('Missing credentials! Either username or password is not specified!')
    }

    const protocol = (configObject.get('parameters:protocol') || constants.DEFAULT_PROTOCOL).toLowerCase()
    if (_.isUndefined(protocol)) {
      reject('Protocol is not defined!')
    }

    if (!protocol.match(/(sftp|webdav)/)) {
      reject('Protocol is specified incorrectly! Only values sftp or webdav are allowed!')
    }

    const hostname = configObject.get('parameters:hostname')
    if (_.isUndefined(hostname)) {
      reject('Hostname is not defined!')
    }

    const { host, port } = getHostAndPort(hostname, protocol)

    const remotePath = sanitizeRemotePath(configObject.get('parameters:remote_path'))

    const appendDatetime = !_.isUndefined(configObject.get('parameters:append_datetime'))
      ? configObject.get('parameters:append_datetime')
      : constants.DEFAULT_DATETIME_APPEND

    const dateTimeSuffix = moment().format(constants.DEFAULT_DATE_FORMAT)

    const tableExportDirectory = path.join(dataDirectory, 'in', 'tables')

    const files = generateArrayOfFileNames(inputFiles, tableExportDirectory, remotePath, appendDatetime, dateTimeSuffix)

    const trustUnsecureCertificate = !_.isUndefined(configObject.get('parameters:trust_unsecure_certificate'))
      ? configObject.get('parameters:trust_unsecure_certificate')
      : constants.DEFAULT_CERTIFICATE_TRUST

    resolve({
      host,
      port,
      files,
      username,
      password,
      protocol,
      hostname,
      trustUnsecureCertificate,
      retries: constants.DEFAULT_RETRIES,
      timeout: constants.DEFAULT_TIMEOUT
    })
  })
}

/**
 * This function checks whether the remote path contains a / at the beginning of the string
 * And if not, just add it.
 */
function sanitizeRemotePath(remotePath = constants.DEFAULT_OUTPUT_DIR) {
  if (!remotePath) {
    return constants.DEFAULT_OUTPUT_DIR
  } else {
    return remotePath.match(/^[^\/]/)
      ? path.join('/', remotePath)
      : remotePath
  }
}

/**
 * This function prepares the array of object containing file names, source and destinations.
 */
function generateArrayOfFileNames(inputFiles, tableExportDirectory, remotePath, appendDatetime, dateTimeSuffix) {
  return inputFiles.map(file => {
    return {
      name: _.last(file.destination.split('/')),
      source: getSource(tableExportDirectory, file),
      destination: getDestination(remotePath, file, appendDatetime, dateTimeSuffix)
    }
  })
}

/**
 * This function parse the hostname and get host and port.
 */
function getHostAndPort(hostname, protocol) {
  try {
    const split = hostname.split(':')
    if (_.size(split) === 1) {
      return { host: _.first(split), port: getDefaultPort(protocol) }
    } else {
      return { host: _.first(split), port: parseInt(_.last(split)) }
    }
  } catch (error) {
    return { host: '', port: -1 }
  }
}

/**
 * This function gets default ports.
 */
function getDefaultPort(protocol) {
  if (protocol === constants.SFTP_PROTOCOL) {
    return constants.DEFAULT_SFTP_PORT
  } else if (protocol === constants.WEBDAV_PROTOCOL) {
    return constants.DEFAULT_WEBDAV_PORT
  }
}

/**
 * This function generates a source path.
 */
function getSource(tableExportDirectory, file) {
  return path.join(tableExportDirectory, file.destination)
}

/**
 * This function generates a destination path.
 */
function getDestination(remotePath, file, appendDatetime, dateTimeSuffix) {
  if (!appendDatetime) {
    return path.join(remotePath, file.destination)
  } else {
    const destinationFile = path.parse(file.destination)
    if (!destinationFile.ext) {
      return path.join(remotePath,`${destinationFile.base}_${dateTimeSuffix}`)
    } else {
      return path.join(remotePath,`${destinationFile.name}_${dateTimeSuffix}${destinationFile.ext}`)
    }
  }
}