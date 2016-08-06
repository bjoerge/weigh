var browserify = require('browserify')
var envify = require('envify')
var path = require('path')
var browserResolve = require('browser-resolve')
var resolveFrom = require('resolve-from')
var pkgUtils = require('../lib/pkgUtils')
var formatPackage = require('../lib/formatPackage')

module.exports = function bundle (packages, options) {
  options = options || {}

  var builtins = packages.filter(pkgUtils.isBuiltin)

  var regular = packages
    .filter(pkgUtils.isPackage)
    .map(formatPackage())
    .map(function (pkg) {
      return browserResolve.sync(pkg, {filename: path.join(options.prefix, 'index.js')})
    })

  var local = packages
    .filter(pkgUtils.isLocal)
    .map(function (pkg) {
      var resolved = resolveFrom(process.cwd(), pkg.file)
      if (!resolved) {
        throw new Error('File not found: ' + pkg.file)
      }
      return resolved
    })
    .filter(Boolean)

  var entries = regular.concat(local)

  if (entries.length === 0 && builtins.length === 0) {
    throw new Error('Nothing to bundle')
  }

  var b = browserify(entries, {
    extensions: ['.js', '.json'],
    ignoreMissing: true
  })
    .transform(envify, {global: true})

  builtins.forEach(function (builtin) {
    b.require(builtin.name)
  })

  return b.bundle()
}
