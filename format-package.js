
module.exports = function formatPkg (installable) {
  return function (pkg) {
    return [
      (pkg.scope && pkg.scope + '/'),
      pkg.name,
      installable && pkg.version && '@' + pkg.version,
      !installable && pkg.file
    ].filter(Boolean).join('')
  }
}
