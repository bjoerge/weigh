var prepareEntries = require('../prepareEntries')
var MultiStream = require('multistream')
var fs = require('fs')

module.exports = function bundle (modules, options) {
  var entries = prepareEntries(modules, options)

  console.log('!!!!', entries)

  if (entries.builtins.length) {
    console.log('Skipping %d buitin modules', entries.builtins.length)
  }

  var files = entries.packages.concat(entries.local)

  if (files.length === 0) {
    throw new Error('Nothing to bundle')
  }

  return MultiStream(files.map(function file (file) {
    return fs.createReadStream(file)
  }))
}
