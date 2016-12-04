'use strict'

const path = require('path')
const nconf = require('nconf')
const isThere = require('is-there')

module.exports = function(dataDir) {
  const configJson = 'config.json'
  const configPath = path.join(dataDir, configJson)
  let config = nconf.env()

  if (isThere(configPath)) {
    config.file(configPath)
  } else {
    console.error('No config specified!')
    process.exit(1)
  }

  return config
}
