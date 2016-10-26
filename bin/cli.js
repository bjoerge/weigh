#!/usr/bin/env node
'use strict'
var path = require('path')
var uniq = require('uniq')
var updateNotifier = require('update-notifier')
var fs = require('fs')
var parseArgs = require('minimist')
var rimraf = require('rimraf')
var humanize = require('humanize-list')

var selfPkg = require('../package')

var createLogger = require('../lib/createLogger')
var parsePackage = require('../lib/parsePackage')
var weigh = require('../lib/weigh')

var SUPPORTED_MINIFIERS = ['closure', 'uglify', 'babili']
var SUPPORTED_BUNDLERS = ['browserify', 'concat']
var MODULE_CACHE_PATH = path.join(__dirname, '..', '.cached_modules')

updateNotifier({pkg: selfPkg}).notify({defer: false})

var logger = createLogger()

function help () {
  return fs.readFileSync(path.join(__dirname, '/usage.txt'), 'utf-8')
}

var argv = parseArgs(process.argv.slice(2), {
  string: [
    'minifier',
    'gzip-level',
    'env'
  ],
  boolean: [
    'version',
    'help',
    'minify',
    'gzip',
    'uncompressed',
    'verbose',
    'output',
    '__keepcache' // for tests only
  ],
  alias: {
    h: 'help',
    g: 'gzip-level',
    m: 'minifier',
    b: 'bundler',
    u: 'uncompressed',
    o: 'output',
    v: 'verbose'
  },
  default: {
    minifier: 'uglify',
    bundler: 'browserify',
    env: 'production',
    output: false,
    gzip: true,
    minify: true,
    __keepcache: false
  },
  unknown: function (arg) {
    if (arg[0] === '-') {
      console.error('Error: Unknown command line option: `%s`. ', arg)
      logger.log()
      logger.log(help())
      process.exit(1)
    }
  }
})

if (argv.help) {
  logger.log(help())
  process.exit(0)
}

if (argv.version) {
  logger.log(selfPkg.version)
  process.exit(0)
}

var gzipLevel = argv['gzip-level']
var shouldMinify = !argv.uncompressed && argv.minify
var shouldGzip = !argv.uncompressed && argv.gzip

if (shouldMinify && SUPPORTED_MINIFIERS.indexOf(argv.minifier) === -1) {
  console.error('Unknown --minifier option: `%s`. Supported minifiers are: %s', argv.minifier, SUPPORTED_MINIFIERS.join(', '))
  process.exit(1)
}
if (SUPPORTED_BUNDLERS.indexOf(argv.bundler) === -1) {
  console.error('Unknown --bundler option: `%s`. Supported bundlers are: %s', argv.bundler, SUPPORTED_BUNDLERS.join(', '))
  process.exit(1)
}

function resolveMinifier (name) {
  return {name: name, minify: require('../lib/minifiers/' + name)}
}

function resolveBundler (name) {
  return {name: name, bundle: require('../lib/bundlers/' + name)}
}

var minifier = shouldMinify && resolveMinifier(argv.minifier)
var bundler = resolveBundler(argv.bundler)

var packages = argv._
  .filter(function (arg) {
    return arg.substring(0, 1) !== '-'
  })
  .map(parsePackage)

if (packages.length === 0) {
  logger.log('Error: No packages specified.')
  logger.log()
  logger.log(help())
  process.exit(0)
}

if (!argv.__keepcache) { // (used by tests only)
  rimraf.sync(MODULE_CACHE_PATH)
  handleProgress({level: 'verbose', args: ['Local node_modules cache cleared.']})
}

var progress = weigh(packages, {
  gzipLevel: gzipLevel,
  minifier: minifier,
  bundler: bundler,
  output: argv.output,
  env: argv.env,
  shouldGzip: shouldGzip,
  prefix: MODULE_CACHE_PATH
})

progress.on('data', handleProgress)
progress.on('error', function (error) {
  console.log(error.stack)
  process.exit(1)
})

function handleProgress (progressEvent) {
  if (argv.output) {
    return
  }
  if (progressEvent.level === 'verbose') {
    if (argv.verbose) {
      logger.log.apply(logger, progressEvent.args)
    }
  } else if (progressEvent.level === 'info') {
    logger.stopSpinner()
    logger.log.apply(logger, progressEvent.args)
  } else if (progressEvent.level === 'progress') {
    logger.progress.apply(logger, progressEvent.args)
  } else if (progressEvent.level === 'missingPeerDeps') {
    var missingPeers = progressEvent.args[0].peerDeps
    var message = ['Warning: Found missing peer dependencies while downloading packages:']

    missingPeers.map(function (missing) {
      message.push('  ' + missing.requires + ', required by ' + missing.requiredBy)
    })

    var requiredBys = missingPeers.map(function (missing) {
      return missing.requiredBy
    })

    message.push('')
    message.push(
      'This means that ' + humanize(requiredBys) + ' will going to need additional modules to work. ' +
      'Peer dependencies are not installed by weigh.'
    )
    message.push('')
    message.push(
      'If you want to check the weight with these peer dependencies included, just add ' +
      'them to the weigh command like this:'
    )

    var suggestedArgs = []
      .concat(process.argv.slice(2).sort())
      .concat(uniq(missingPeers.map(function (missing) {
        return parsePackage(missing.requires).name
      })))

    message.push('weigh ' + suggestedArgs.join(' ') + '\n')

    logger.log(message.join('\n'))
  }
}
