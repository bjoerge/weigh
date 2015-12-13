var PKG_PATTERN = /^(@[^@/]+)?\/?([^/@]+)?@?([^/@]+)?(\/[^@]+)?/
var FILE_PATTERN = /^(\.|\/)/

function parsePackage (pkgStr) {
  if (FILE_PATTERN.test(pkgStr)) {
    return {
      scope: null,
      name: null,
      version: null,
      file: pkgStr,
      raw: pkgStr
    }
  }

  var match = PKG_PATTERN.exec(pkgStr)

  var scope = match[1] || null
  var name = match[2] || null
  var version = match[3] || null
  var file = match[4] || null

  if (!match || !(scope || name || version || file)) {
    throw new Error('Invalid package pattern ' + pkgStr)
  }

  return {
    name: name,
    scope: scope,
    version: version,
    file: file,
    raw: pkgStr
  }
}

module.exports = parsePackage
