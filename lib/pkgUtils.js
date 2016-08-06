var BUILTINS = require('browserify/lib/builtins')

function isBuiltin (pkg) {
  return !pkg.scope && !pkg.version && !pkg.file && BUILTINS.hasOwnProperty(pkg.name)
}

function isPackage (pkg) {
  return !isBuiltin(pkg) && !isLocal(pkg)
}

function isLocal (pkg) {
  return !pkg.scope && !pkg.name && !pkg.version && pkg.file
}

module.exports = {
  isBuiltin: isBuiltin,
  isPackage: isPackage,
  isLocal: isLocal
}
