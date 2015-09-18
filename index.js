#!/usr/bin/env node
'use strict'
var browserify = require('browserify');
var SpawnStream = require('spawn-stream');
var collapse = require('bundle-collapser/plugin');
var exec = require('child_process').exec;
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
var splittedArgs = splitArgv()

var pkgs = splittedArgs[0]

var uglifyArgs = splittedArgs[1] || []

function splitArgv() {
  var argv2 = process.argv.slice(2)
  var subIdx = argv2.indexOf('--')
  if (subIdx === -1) {
    return [argv2]
  }
  return [argv2.slice(0, subIdx), argv2.slice(subIdx + 1)]
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
function resolveModule(module) {
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

installPackages(pkgs, function (err, packages) {
  if (err) {
    throw err
  }

  var resolved = pkgs.map(resolveModule).filter(Boolean)
  var builtins = pkgs.map(resolveBuiltin).filter(Boolean)

  var b = browserify(resolved)
    .transform(envify({NODE_ENV: 'production'}))

  builtins.forEach(function(builtin) {
    b.require(builtin)
  })

  var bstream = b.bundle()

  var uglifiedStr = bstream.pipe(uglify())
  var gzippedStream = bstream.pipe(zlib.createGzip({level: gzipLevel}))
  var uglifiedGzippedStream = uglifiedStr.pipe(zlib.createGzip({level: gzipLevel}))

  log('Installed packages: %s', packages.length ? '' : '0')
  packages.forEach(function(pkg) {
    log('  %s@%s', pkg.name, pkg.version)
  })

  log()

  bstream.pipe(getBytes(function (bytes) {
    log("Total weight, uncompressed: ~%s", prettyBytes(bytes))
  }))

  uglifiedStr.pipe(getBytes(function (bytes) {
    log("Total weight, uglified: %s", prettyBytes(bytes))
  }))

  uglifiedGzippedStream.pipe(getBytes(function (bytes) {
    log("Total weight, gzipped (level: %s) + uglified: ~%s", gzipLevel == undefined ? 'default' : gzipLevel, prettyBytes(bytes))
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
  return SpawnStream(UGLIFY_BINARY, uglifyArgs);
}
