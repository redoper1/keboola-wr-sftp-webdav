// A SFTP/WebDAV writer for KBC
'use strict';

const RemoteStorageWriter = require('./lib/remoteConnectionHelper')

RemoteStorageWriter.parseConfiguration()
  .then(RemoteStorageWriter.prepareArrayOfPromises)
  .then(RemoteStorageWriter.processArrayOfPromises)
  .then((message) => {
    console.log(message)
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })