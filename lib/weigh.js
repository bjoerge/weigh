#!/usr/bin/env node
'use strict'
var devnull = require('dev-null')
var prettyBytes = require('pretty-bytes')
var zlib = require('zlib')
var humanize = require('humanize-list')
var through2 = require('through2')
var installPackages = require('../lib/installPackages')
var formatPackage = require('../lib/formatPackage')
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
  var progress = through2.obj()
  var installProgress = installPackages(packages, {prefix: options.prefix}, function (err, installedPackages) {
    if (err) {
      throw err
    }

    if (installedPackages.length > 0) {
      progress.push(event.progress('Downloaded %s package(s)', installedPackages.length))
    }

    progress.push(event.progress('Weighing %s…', humanize(packages.map(formatPackage()))))

    progress.push(event.progress('Bundling…'))

    var bundleStream = options.bundler.bundle(packages, {env: options.env, prefix: options.prefix})

    bundleStream.pipe(getBytes(function (bytes) {
      progress.push(event.info('Approximate weight of %s:', humanize(packages.map(formatPackage()))))
      progress.push(event.info('  Uncompressed: %s', prettyBytes(bytes)))
      minifiedStream && progress.push(event.progress('Minifying…'))
    }))

    var minifiedStream = options.minifier && bundleStream.pipe(options.minifier.minify())
    var gzipStream = options.shouldGzip && (options.minifier ? minifiedStream : bundleStream).pipe(zlib.createGzip({level: options.gzipLevel}))

    minifiedStream && minifiedStream.pipe(getBytes(function (bytes) {
      progress.push(event.info('  Minified (' + options.minifier.name + '): %s', prettyBytes(bytes)))
      gzipStream && progress.push(event.progress('Compressing…'))
    }))

    gzipStream && gzipStream.pipe(getBytes(function (bytes) {
      progress.push(
        event.info(
          '  %s (level: %s): %s',
          options.minifier ? 'Minified and gzipped' : 'Gzipped, not minified',
          options.gzipLevel || 'default',
          prettyBytes(bytes)
        ))
    }))

    function throwError (error) {
      throw error
    }

    var last = gzipStream || minifiedStream || bundleStream
    last.once('end', function () {
      progress.end()
    })

    ;[bundleStream, minifiedStream, gzipStream].filter(Boolean).forEach(function (stream) {
      stream.on('error', throwError)
      stream.pipe(devnull())
    })
  })
  return merge([installProgress, progress].filter(Boolean))
}
