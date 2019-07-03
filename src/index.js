const _ = require('lodash');
const path = require('path');
const curl = require('curlrequest');
const SftpClient = require('ssh2-sftp-client');
const command = require('./lib/helpers/cliHelper');
const constants = require('./lib/constants');
const keboolaHelper = require('./lib/helpers/keboolaHelper');
const remoteConnectionHelper = require('./lib/helpers/remoteConnectionHelper');

/**
 * This is the main part of the program
 */
async function main() {
  try {
    const dataDir = command.data;
    // Read the input configuration.
    const {
      host,
      port,
      gzip,
      files,
      retries,
      timeout,
      username,
      password,
      protocol,
      remotePath,
      appendDatetime,
      dateTimeSuffix,
      trustUnsecureCertificate
    } = await keboolaHelper.parseConfiguration(
      keboolaHelper.getConfig(path.join(dataDir, constants.CONFIG_FILE)),
      dataDir
    );

    if (protocol === constants.SFTP_PROTOCOL) {
      const sftp = new SftpClient();
      await sftp.connect({ host, port, username, password });
      await remoteConnectionHelper.uploadFilesToSftp(sftp, files, gzip, false);
      // Let's upload files from storage - an experimental feature
      const storageFiles = await keboolaHelper.scanDirectory(
        path.join(dataDir, 'in', 'files'),
        remotePath,
        appendDatetime,
        dateTimeSuffix
      );
      if (storageFiles.length > 0) {
        console.log(
          '[INFO]: Storage files found in the input directory, going to upload them into the remote directory'
        );

        await remoteConnectionHelper.uploadFilesToSftp(
          sftp,
          storageFiles,
          gzip,
          true
        );
      }
      sftp.end();
    } else if (protocol === constants.WEBDAV_PROTOCOL) {
      const options = {
        user: `${username}:${password}`,
        insecure: trustUnsecureCertificate,
        retries,
        timeout
      };
      await remoteConnectionHelper.uploadFilesToWebDAV(
        curl,
        files,
        options,
        host,
        port
      );
    } else {
      throw constants.ERROR_UNKNOWN_PROTOCOL;
    }
    console.log(`Upload process completed`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
