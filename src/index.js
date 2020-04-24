const _ = require('lodash');
const path = require('path');
const curl = require('curlrequest');
const SftpClient = require('ssh2-sftp-client');
const command = require('./lib/helpers/cliHelper');
const constants = require('./lib/constants');
const keboolaHelper = require('./lib/helpers/keboolaHelper');
const remoteConnectionHelper = require('./lib/helpers/remoteConnectionHelper');
const fs = require('fs');

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
      trustUnsecureCertificate,
      sshPrivateKey
    } = await keboolaHelper.parseConfiguration(
      keboolaHelper.getConfig(path.join(dataDir, constants.CONFIG_FILE)),
      dataDir
    );

    var debug = msg => {
      console.error(msg);
    };

    if (protocol === constants.SFTP_PROTOCOL) {
      const sftp = new SftpClient();
      if (sshPrivateKey.enabled == true) { // Use user private SSH key based authentification
        var privateKey = null;
        var passphrase = null;
        var tempPrivateKey = typeof(sshPrivateKey['#key']) !== 'undefined' ? sshPrivateKey['#key'] : (typeof (sshPrivateKey.key) !== 'undefined' ? sshPrivateKey.key : null);
        if (sshPrivateKey.input_type == "string") {
          privateKey = tempPrivateKey;
        } else if (sshPrivateKey.input_type == "path") {
          if (!tempPrivateKey.startsWith('http')) {
            //privateKey = fs.readFileSync(path.join(tempPrivateKey, ''));
            privateKey = fs.readFileSync(path.join(tempPrivateKey, ''), {'encoding':'utf8'});
          } else {
            //privateKey = fs.readFileSync(tempPrivateKey);
            privateKey = fs.readFileSync(tempPrivateKey, {'encoding':'utf8'});
          }
        }
        if (privateKey == null || privateKey == '' || privateKey == 'PRIVATE_SSH_KEY') {
          console.error(`[SFTP]: It looks like the private SSH key was not loaded properly.`);
          process.exit(1);
        }
        if (sshPrivateKey['#passphrase'] !== '') {
          passphrase = sshPrivateKey['#passphrase'];
          await sftp.connect({ host, port, username, privateKey, passphrase });
        } else {
          await sftp.connect({ host, port, username, privateKey });
        }
      } else { // Use user password based authentification
        await sftp.connect({ host, port, username, password });
      }
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
