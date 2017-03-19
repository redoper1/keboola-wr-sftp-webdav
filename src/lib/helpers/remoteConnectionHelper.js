import fs from 'fs'
import Promise from 'bluebird'
/**
 * This function generates an array of file uploads to SFTP.
 */
export function uploadFilesToSftp(sftp, files = []) {
  return Promise.each(files, file => {
    console.log(`[SFTP]: Uploading ${file.name} to ${file.destination}`)
    return uploadFileToSftp(sftp, file)
  })
}

/**
 * This function generates an array of file uploads to WebDAV.
 */
export function uploadFilesToWebDAV(curl, files = [], options, host, port) {
  return Promise.each(files, file => {
    const params = Object.assign({}, options, {
      'url': `https://${host}:${port}${file.destination}`,
      'upload-file': file.source
    })
    console.log(`[WebDAV]: Uploading ${file.name} to ${file.destination}`)
    return uploadFileToWebDAV(curl, file, params)
  })
}

/**
 * This function triggers the actual upload to SFTP.
 */
export function uploadFileToSftp(sftp, { source, destination }) {
  return sftp.put(fs.createReadStream(source), destination)
}

/**
 * This function triggers the actual upload to WebDAV.
 */
export function uploadFileToWebDAV(curl, { source, destination }, params) {
  return new Promise((resolve, reject) => {
    curl.request(params, error => {
      if (error) {
        reject(error)
      } else {
        resolve(`${source} uploaded to ${destination} successfully!`)
      }
    })
  })
}