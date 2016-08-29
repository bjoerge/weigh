var BUILTINS = require('browserify/lib/builtins')
var groupBy = require('array-groupby')

function isBuiltin (pkg) {
  return !pkg.scope && !pkg.version && !pkg.file && BUILTINS.hasOwnProperty(pkg.name)
}

function isPackage (pkg) {
  return !isBuiltin(pkg) && !isLocal(pkg)
}

function isLocal (pkg) {
  return !pkg.scope && !pkg.name && !pkg.version && pkg.file
}

var groups = {
  builtins: isBuiltin,
  packages: isPackage,
  local: isLocal
}
var groupNames = Object.keys(groups)

module.exports = {
  isBuiltin: isBuiltin,
  isPackage: isPackage,
  isLocal: isLocal,
  group: groupBy(function (module) {
    return groupNames.find(function (groupName) {
      return groups[groupName](module)
    })
  })
}
