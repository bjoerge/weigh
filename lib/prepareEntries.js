var path = require('path')
var browserResolve = require('browser-resolve')
var resolveFrom = require('resolve-from')
var pkgUtils = require('../lib/pkgUtils')
var formatPackage = require('../lib/formatPackage')

module.exports = function prepareEntries (modules, options) {
  options = options || {}
  var grouped = pkgUtils.group(modules)

  return {
    builtins: grouped.builtins || [],
    packages: (grouped.packages || [])
      .map(formatPackage())
      .map(function (pkg) {
        return browserResolve.sync(pkg, {filename: path.join(options.prefix, 'index.js')})
      }),

    local: (grouped.local || [])
      .filter(pkgUtils.isLocal)
      .filter(formatPackage())
      .map(function (pkg) {
        var resolved = resolveFrom(process.cwd(), pkg.file)
        if (!resolved) {
          throw new Error('File not found: ' + pkg.file)
        }
        return resolved
      })
      .filter(Boolean)
  }
}
