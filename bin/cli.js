#!/usr/bin/env node
'use strict'
var browserify = require('browserify')
var SpawnStream = require('spawn-stream')
var exec = require('child_process').exec
var path = require('path')
var devnull = require('dev-null')
var prettyBytes = require('pretty-bytes')
var zlib = require('zlib')
var humanize = require('humanize-list')
var envify = require('envify')
var fs = require('fs')
var resolveFrom = require('resolve-from')
var through = require('through')
var parseArgs = require('minimist')
var xtend = require('xtend')

var parsePackage = require('../parse-package')
var formatPackage = require('../format-package')

var BUILTINS = require('browserify/lib/builtins')
var MODULE_CACHE_PATH = path.join(__dirname, '..', '.cached_modules')

var UGLIFY_BINARY = require.resolve('uglify-js/bin/uglifyjs')

var argv = parseArgs(process.argv.slice(2), {
  alias: {
    h: 'help',
    g: 'gzip-level',
    v: 'verbose'
  }
})

if (argv.help) {
  console.log(help())
  process.exit(0)
}

var gzipLevel = argv['gzip-level']

var packages = argv._
  .filter(function (arg) {
    return arg.substring(0, 1) !== '-'
  })
  .map(parsePackage)

function getSubargs () {
  var argv2 = process.argv.slice(2)
  var subIdx = argv2.indexOf('--')
  if (subIdx === -1) {
    return []
  }
  return argv2.slice(subIdx + 1)
}

function log (args) {
  console.log.apply(console, arguments)
}

function verbose (args) {
  if (argv.verbose) {
    console.log.apply(console, arguments)
  }
}

function help () {
  return fs.readFileSync(__dirname + '/usage.txt', 'utf-8')
}

function installPackages (pkgs, cb) {
  var needsInstall = pkgs.filter(function (pkg) {
    return !(isLocal(pkg) || isBuiltin(pkg))
  })

  if (needsInstall.length === 0) {
    return cb(null, [])
  }

  var installArgs = needsInstall.map(formatPackage(true)).join(' ')

  log('Downloading %s, this may take a little while…', humanize(needsInstall.map(formatPackage(true))))

  var installCmd = 'npm install --prefix ' + MODULE_CACHE_PATH + ' ' + installArgs
  verbose('> %s', installCmd)
  exec(installCmd, function (err) {
    if (err) {
      return cb(err)
    }

    var lsCmd = 'npm ls --json --prefix ' + MODULE_CACHE_PATH + ' ' + installArgs
    verbose('> %s', lsCmd)
    exec(lsCmd, function (err, stdout) {
      if (err) {
        return cb(err)
      }
      cb(null, packagesToArray(JSON.parse(stdout).dependencies))
    })
  })

  function packagesToArray (dependencies) {
    return Object.keys(dependencies)
      .map(function (pkgName) {
        return xtend(dependencies[pkgName], {
          name: pkgName
        })
      })
  }
}

function getBytes (cb) {
  var length = 0
  return through(function (chunk) {
    length += chunk.length
  }, function end () {
    this.queue(null)
    cb(length)
  })
}

log()

installPackages(packages, function (err, installedPackages) {
  if (err) {
    throw err
  }

  if (installedPackages.length > 0) {
    log('Downloaded %s package(s)', installedPackages.length)
    log()
  }

  log('Weighing %s…', humanize(packages.map(formatPackage())))
  log()

  var builtins = packages.filter(isBuiltin)

  var regular = packages.filter(isPackage).map(formatPackage())
    .map(function (pkg) {
      return resolveFrom(MODULE_CACHE_PATH, pkg)
    })

  var local = regular.filter(isLocal).map(function (pkg) {
    require.resolve(pkg.file)
  })

  var b = browserify(regular.concat(local))
    .transform(envify, {global: true})

  builtins.forEach(function (builtin) {
    b.require(builtin.name)
  })

  var bstream = b.bundle()

  var uglifiedStr = bstream.pipe(uglify(getSubargs()))
  var gzippedStream = bstream.pipe(zlib.createGzip({level: gzipLevel}))
  var uglifiedGzippedStream = uglifiedStr.pipe(zlib.createGzip({level: gzipLevel}))

  bstream.pipe(getBytes(function (bytes) {
    log('Approximate weight of %s:', humanize(packages.map(formatPackage())))
    log('  Uncompressed: %s', prettyBytes(bytes))
  }))

  uglifiedStr.pipe(getBytes(function (bytes) {
    log('  Uglified: %s', prettyBytes(bytes))
  }))

  uglifiedGzippedStream.pipe(getBytes(function (bytes) {
    log('  Uglified + gzipped (level: %s): %s', gzipLevel || 'default', prettyBytes(bytes))
    log()
  }))

  bstream.on('error', function (e) {
    throw e
  })

  bstream.pipe(devnull())
  uglifiedStr.pipe(devnull())
  gzippedStream.pipe(devnull())
})

function isBuiltin (pkg) {
  return !pkg.scope && !pkg.version && !pkg.file && BUILTINS.hasOwnProperty(pkg.name)
}

function isPackage (pkg) {
  return !isBuiltin(pkg) && !isLocal(pkg)
}

function isLocal (pkg) {
  return !pkg.scope && !pkg.name && !pkg.version && pkg.file
}

function uglify (args) {
  return SpawnStream(UGLIFY_BINARY, args.length ? args : [
    '--compress',
    '--mangle'
  ])
}
