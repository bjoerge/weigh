var browserify = require('browserify')
var envify = require('envify/custom')
var prepareEntries = require('../prepareEntries')

module.exports = function bundle (modules, options) {
  var entries = prepareEntries(modules, options)

  var entryFiles = entries.packages.concat(entries.local)

  if (entryFiles.length === 0 && entries.builtins.length === 0) {
    throw new Error('Nothing to bundle')
  }

  var b = browserify(entryFiles, {
    extensions: ['.js', '.json'],
    ignoreMissing: true
  })
    .transform(envify({
      NODE_ENV: options.env
    }), {global: true})

  entries.builtins.forEach(function (builtin) {
    b.require(builtin.name)
  })

  return b.bundle()
}
