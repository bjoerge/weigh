var xtend = require('xtend')
var exec = require('child_process').exec
var humanize = require('humanize-list')
var formatPackage = require('./formatPackage')
var pkgUtils = require('./pkgUtils')
var through2 = require('through2')
var event = require('./events')

function flatten (arr) {
  return arr.reduce(function (flattened, arr) {
    return flattened.concat(arr)
  }, [])
}

module.exports = function installPackages (pkgs, opts, cb) {
  opts = opts || {}
  var logStream = through2.obj()

  var needsInstall = pkgs.filter(function (pkg) {
    return !(pkgUtils.isLocal(pkg) || pkgUtils.isBuiltin(pkg))
  })

  if (needsInstall.length === 0) {
    return cb(null, [])
  }

  var installArgs = needsInstall.map(formatPackage(true)).join(' ')

  logStream.push(event.progress('Downloading %s, this may take a little while…', humanize(needsInstall.map(formatPackage(true)))))

  var installCmd = 'npm install --prefix ' + opts.prefix + ' ' + installArgs
  logStream.push(event.verbose('> %s', installCmd))
  exec(installCmd, function (err) {
    if (err) {
      return cb(err)
    }

    var lsCmd = 'npm ls --json --prefix ' + opts.prefix
    logStream.push(event.verbose('> %s', lsCmd))
    exec(lsCmd, function (err, stdout) {
      var result
      try {
        result = JSON.parse(stdout)
      } catch (error) {
        // ignore
      }
      if (err) {
        // Check if there are missing peer deps
        if (!result || !result.dependencies) {
          cb(err)
          return
        }
        var missingPeerDeps = flatten(Object.keys(result.dependencies)
          .map(function (depName) {
            var dep = result.dependencies[depName]
            if (dep.peerMissing && dep.required) {
              return dep.required.peerMissing
            }
          })
          .filter(Boolean))

        logStream.push(event.missingPeerDeps(missingPeerDeps))
      }
      cb(null, packagesToArray(result.dependencies))
    })
  })

  return logStream
}

function packagesToArray (dependencies) {
  return Object.keys(dependencies)
    .map(function (pkgName) {
      return xtend(dependencies[pkgName], {
        name: pkgName
      })
    })
}
