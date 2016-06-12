#!/usr/bin/env node
'use strict'
var browserify = require('browserify')
var path = require('path')
var devnull = require('dev-null')
var prettyBytes = require('pretty-bytes')
var zlib = require('zlib')
var humanize = require('humanize-list')
var envify = require('envify')
var browserResolve = require('browser-resolve')
var through2 = require('through2')
var installPackages = require('../lib/installPackages')
var formatPackage = require('../lib/formatPackage')
var pkgUtils = require('../lib/pkgUtils')
var event = require('./events')
var merge = require('merge2')

function getBytes (cb) {
  var length = 0
  return through2(function (chunk, enc, cb) {
    length += chunk.length
    cb()
  }, function end () {
    this.push(null)
    cb(length)
  })
}

module.exports = function weigh (packages, options) {
  options = options || {}
  const progress = through2.obj()
  const installProgress = installPackages(packages, {prefix: options.prefix}, function (err, installedPackages) {
    if (err) {
      throw err
    }

    if (installedPackages.length > 0) {
      progress.push(event.progress('Downloaded %s package(s)', installedPackages.length))
    }

    progress.push(event.progress('Weighing %s…', humanize(packages.map(formatPackage()))))

    var builtins = packages.filter(pkgUtils.isBuiltin)

    var regular = packages.filter(pkgUtils.isPackage).map(formatPackage())
      .map(function (pkg) {
        return browserResolve.sync(pkg, {filename: path.join(options.prefix, 'index.js')})
      })

    var local = regular.filter(pkgUtils.isLocal).map(function (pkg) {
      require.resolve(pkg.file)
    })

    var entries = regular.concat(local)

    var b = browserify(entries, {
      extensions: ['.js', '.json'],
      ignoreMissing: true
    })
      .transform(envify, {global: true})

    builtins.forEach(function (builtin) {
      b.require(builtin.name)
    })

    var bstream = b.bundle()

    progress.push(event.progress('Bundling…'))

    bstream.pipe(getBytes(function (bytes) {
      progress.push(event.info('Approximate weight of %s:', humanize(packages.map(formatPackage()))))
      progress.push(event.info('  Uncompressed: %s', prettyBytes(bytes)))
      minifiedStream && progress.push(event.progress('Minifying…'))
    }))

    var minifiedStream = options.minifier && bstream.pipe(options.minifier())
    var gzipStream = options.shouldGzip && (options.minifier ? minifiedStream : bstream).pipe(zlib.createGzip({level: options.gzipLevel}))

    minifiedStream && minifiedStream.pipe(getBytes(function (bytes) {
      progress.push(event.info('  Minified (' + options.minifier.name + '): %s', prettyBytes(bytes)))
      gzipStream && progress.push(event.progress('Compressing…'))
    }))

    gzipStream && gzipStream.pipe(getBytes(function (bytes) {
      progress.push(event.info('  %s (level: %s): %s', options.shouldMinify ? 'Minified and gzipped' : 'Gzipped, not minified', options.gzipLevel || 'default', prettyBytes(bytes)))
    }))

    function throwError (error) {
      throw error
    }

    var last = gzipStream || minifiedStream || bstream
    last.once('end', function () {
      progress.end()
    })

    ;[bstream, minifiedStream, gzipStream].filter(Boolean).forEach(function (stream) {
      stream.on('error', throwError)
      stream.pipe(devnull())
    })
  })
  return merge([installProgress, progress])
}
