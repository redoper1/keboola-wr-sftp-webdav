const fs = require('fs');
const zlib = require('zlib');
const Promise = require('bluebird');

/**
 * This function generates an array of file uploads to SFTP.
 */
function uploadFilesToSftp(
  sftp,
  files = [],
  gzip = false,
  hasFileStorageSource = false
) {
  return Promise.each(files, file => {
    console.log(
      `[SFTP]: Uploading ${file.name} to ${file.destination}${
        gzip ? '.gz' : ''
      }`
    );
    return hasFileStorageSource
      ? uploadFileFromFileStorageToSftp(sftp, file, gzip)
      : uploadFileToSftp(sftp, file, gzip);
  });
}

/**
 * This function triggers the actual upload to SFTP.
 */
function uploadFileToSftp(sftp, { source, destination }, gzip) {
  if (!gzip) {
    return sftp.put(fs.createReadStream(source), `${destination}`);
  } else {
    return sftp.put(
      fs.createReadStream(source).pipe(zlib.createGzip()),
      `${destination}.gz`
    );
  }
}

/**
 * This function triggers the actual upload to SFTP. Contains an experimatal feature.
 */
function uploadFileFromFileStorageToSftp(
  sftp,
  { source, destination, hasCompressedSource },
  gzip
) {
  if (!gzip) {
    return hasCompressedSource
      ? sftp.put(
          fs.createReadStream(source).pipe(zlib.createGunzip()),
          `${destination}`
        )
      : sftp.put(fs.createReadStream(source), `${destination}`);
  } else {
    return hasCompressedSource
      ? sftp.put(
          fs
            .createReadStream(source)
            .pipe(zlib.createGunzip())
            .pipe(zlib.createGzip()),
          `${destination}.gz`
        )
      : sftp.put(
          fs.createReadStream(source).pipe(zlib.createGzip()),
          `${destination}.gz`
        );
  }
}

/**
 * This function generates an array of file uploads to WebDAV.
 */
function uploadFilesToWebDAV(curl, files = [], options, host, port) {
  return Promise.each(files, file => {
    const params = Object.assign({}, options, {
      url: `https://${host}:${port}${file.destination}`,
      'upload-file': file.source
    });
    console.log(`[WebDAV]: Uploading ${file.name} to ${file.destination}`);
    return uploadFileToWebDAV(curl, file, params);
  });
}

/**
 * This function triggers the actual upload to WebDAV.
 */
function uploadFileToWebDAV(curl, { source, destination }, params) {
  return new Promise((resolve, reject) => {
    curl.request(params, error => {
      if (error) {
        reject(error);
      } else {
        resolve(`${source} uploaded to ${destination} successfully!`);
      }
    });
  });
}

module.exports = {
  uploadFilesToSftp,
  uploadFilesToWebDAV,
  uploadFileToSftp,
  uploadFileToWebDAV
};
