#!/usr/bin/env node
'use strict'
var browserify = require('browserify');
var SpawnStream = require('spawn-stream');
var collapse = require('bundle-collapser/plugin');
var exec = require('child_process').exec;
var path = require('path');
var async = require('async');
var devnull = require('dev-null');
var prettyBytes = require('pretty-bytes');
var zlib = require('zlib');
var envify = require('envify/custom');
var resolveFrom = require('resolve-from')
var through = require('through')
var parseArgs = require('minimist')

var BUILTINS = require('browserify/lib/builtins')
var MODULE_CACHE_PATH = __dirname + '/.cached_modules'
var UGLIFY_BINARY = require.resolve('uglify-js/bin/uglifyjs');

var argv = parseArgs(process.argv.slice(2), {
  alias: {
    h: 'help',
    g: 'gzip-level'
  }
})

var gzipLevel = argv['gzip-level']

var pkgs = argv._.filter(function(arg) {
  return arg.substring(0, 1) != '-'
})

var uglifyArgs = getUglifyArgs()

function getUglifyArgs() {
  var argv2 = process.argv.slice(2)
  var subIdx = argv2.indexOf('--')
  if (subIdx === -1) {
    return []
  }
  return argv2.slice(subIdx + 1)
}

log()
log('Calculating size of %s', pkgs.join(', '))
if (uglifyArgs.length > 0) {
  log('Using uglify arguments: %s', uglifyArgs.join(' '))
}
log()

function log(args) {
  console.log.apply(console, arguments)
}

function help() {
  return fs.readFileSync(__dirname + '/usage.txt', 'utf-8')
}

function splitPkg(pkg) {
  return pkg.split('@')
}

function installPackages(pkgs, cb) {
  var toInstall = pkgs.map(function(pkg) {
    var splitted = splitPkg(pkg)
    if (isBuiltin(splitted[0])) {
      return null
    }
    if (isRelative(splitted[0])) {
      return null
    }
    return splitted[0] + '@' + (splitted[1] || 'latest')
  }).filter(Boolean)

  if (toInstall.length == 0) {
    return cb(null, [])
  }

  exec('npm install --json --prefix ' + MODULE_CACHE_PATH + ' ' + toInstall.join(' '), function(err, stdout) {
    if (err) {
      return cb(err)
    }
    cb(null, JSON.parse(stdout))
  })
}

function getBytes(cb) {
  var length = 0
  return through(function (chunk) {
    length += chunk.length
  }, function end() {
    this.queue(null)
    cb(length)
  })
}

function isBuiltin(pkgName) {
  return BUILTINS.hasOwnProperty(pkgName)
}
function isPackage(pkgName) {
  return !isRelative(pkgName)
}
function isRelative(pkgName) {
  return pkgName[0] == '/' || pkgName[0] == '.'
}
function resolvePackage(module) {
  var pkgName = splitPkg(module)[0]
  if (isBuiltin(pkgName)) {
    return null
  }
  return resolveFrom(MODULE_CACHE_PATH, pkgName)
}

function resolveBuiltin(module) {
  var pkgName = splitPkg(module)[0]

  if (!isBuiltin(pkgName)) {
    return null
  }
  return module
}

function resolveFile(module) {
  return require.resolve(path.join(process.cwd(), module))
}

function getType(module) {
  return isRelative(module) ? 'module' : isBuiltin(module) ? 'builtin' : 'package'
}

installPackages(pkgs, function (err, packages) {
  if (err) {
    throw err
  }

  var resolvedPkgs = pkgs.filter(isPackage).map(resolvePackage)
  var resolvedFiles = pkgs.filter(isRelative).map(resolveFile)
  var resolvedBuiltins = pkgs.filter(isBuiltin).map(resolveBuiltin)


  log('Weighing modules: %s', pkgs.length ? '' : '0')

  resolvedFiles.forEach(function(file) {
    log('  [module]  %s', file)
  })
  resolvedBuiltins.forEach(function(builtin) {
    log('  [builtin] %s', builtin)
  })
  packages.forEach(function(pkg) {
    log('  [package] %s@%s', pkg.name, pkg.version)
  })

  log()


  var b = browserify(resolvedPkgs.concat(resolvedFiles))
    .transform(envify({NODE_ENV: 'production'}))

  resolvedBuiltins.forEach(function(builtin) {
    b.require(builtin)
  })

  var bstream = b.bundle()

  var uglifiedStr = bstream.pipe(uglify())
  var gzippedStream = bstream.pipe(zlib.createGzip({level: gzipLevel}))
  var uglifiedGzippedStream = uglifiedStr.pipe(zlib.createGzip({level: gzipLevel}))

  bstream.pipe(getBytes(function (bytes) {
    log("Total weight, uncompressed: ~%s", prettyBytes(bytes))
  }))

  uglifiedStr.pipe(getBytes(function (bytes) {
    log("Total weight, uglified: %s", prettyBytes(bytes))
  }))

  uglifiedGzippedStream.pipe(getBytes(function (bytes) {
    log("Total weight, uglified + gzipped (level: %s) ~%s:", gzipLevel == undefined ? 'default' : gzipLevel, prettyBytes(bytes))
    log()
    log("Note: these numbers are approximate.")
  }))

  bstream.on('error', function (e) {
    throw e
  })

  bstream.pipe(devnull())
  uglifiedStr.pipe(devnull())
  gzippedStream.pipe(devnull())
})

function uglify() {
  return SpawnStream(UGLIFY_BINARY, uglifyArgs || [
      '--compress',
      '--mangle'
    ]);
}
