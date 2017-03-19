import _ from 'lodash'
import path from 'path'
import curl from 'curlrequest'
import SftpClient from 'ssh2-sftp-client'
import command from './lib/helpers/cliHelper'
import * as constants from './lib/constants'
import * as keboolaHelper from './lib/helpers/keboolaHelper'
import * as remoteConnectionHelper from './lib/helpers/remoteConnectionHelper'

/**
 * This is the main part of the program
 */
(async() => {
  try {
    const dataDir = command.data
    // Read the input configuration.
    const {
      host,
      port,
      files,
      retries,
      timeout,
      username,
      password,
      protocol,
      trustUnsecureCertificate
    } = await keboolaHelper
      .parseConfiguration(keboolaHelper.getConfig(path.join(dataDir, constants.CONFIG_FILE)), dataDir)
    if (protocol === constants.SFTP_PROTOCOL) {
      const sftp = new SftpClient()
      await sftp.connect({ host, port, username, password })
      await remoteConnectionHelper.uploadFilesToSftp(sftp, files)
      sftp.end()
    } else if (protocol === constants.WEBDAV_PROTOCOL) {
      const options = { user: `${username}:${password}`, insecure: trustUnsecureCertificate, retries, timeout }
      await remoteConnectionHelper.uploadFilesToWebDAV(curl, files, options, host, port)
    } else {
      throw constants.ERROR_UNKNOWN_PROTOCOL
    }
    console.log(`${_.size(files)} file(s) uploaded successfully!`)
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
})()