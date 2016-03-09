#!/usr/bin/env node
'use strict'
var browserify = require('browserify')
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
var rimraf = require('rimraf')
var tempfile = require('tempfile')

var parsePackage = require('../parse-package')
var formatPackage = require('../format-package')

var BUILTINS = require('browserify/lib/builtins')
var SUPPORTED_MINIFIERS = ['closure', 'uglify']
var MODULE_CACHE_PATH = path.join(__dirname, '..', '.cached_modules')

var uglify = require('uglify-js')

var argv = parseArgs(process.argv.slice(2), {
  string: [
    'minifier',
    'gzip-level'
  ],
  boolean: [
    'version',
    'help',
    'minify',
    'gzip',
    'uncompressed',
    'clear',
    'verbose'
  ],
  alias: {
    h: 'help',
    g: 'gzip-level',
    m: 'minifier',
    u: 'uncompressed',
    clean: 'clear',
    v: 'verbose'
  },
  default: {
    minifier: 'uglify',
    gzip: true,
    minify: true
  },
  unknown: function (arg) {
    if (arg[0] === '-') {
      console.error('Error: Unknown command line option: `%s`. ', arg)
      log()
      log(help())
      process.exit(1)
    }
  }
})

if (argv.help) {
  log(help())
  process.exit(0)
}

if (argv.version) {
  log(require('../package').version)
  process.exit(0)
}

if (argv.clean) {
  rimraf.sync(MODULE_CACHE_PATH)
  log('Local node_modules cache cleared.')
}

var gzipLevel = argv['gzip-level']
var shouldMinify = !argv.uncompressed && argv.minify
var shouldGzip = !argv.uncompressed && argv.gzip

if (shouldMinify && SUPPORTED_MINIFIERS.indexOf(argv.minifier) === -1) {
  console.error('Unknown --minifier option: `%s`. Supported minifiers are: %s', argv.minifier, SUPPORTED_MINIFIERS.join(', '))
  process.exit(1)
}

var packages = argv._
  .filter(function (arg) {
    return arg.substring(0, 1) !== '-'
  })
  .map(parsePackage)

if (packages.length === 0) {
  log('Error: No packages specified.')
  log(help())
  process.exit(0)
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
  return fs.readFileSync(path.join(__dirname, '/usage.txt'), 'utf-8')
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
      var result
      try {
        result = JSON.parse(stdout)
      } catch (error) {
        // ignore
      }
      if (err) {
        // Check if there are missing peer deps
        if (result) {
          var missingPeers = flatten(Object.keys(result.dependencies)
            .map(function (depName) {
              var dep = result.dependencies[depName]
              if (dep.peerMissing && dep.required) {
                return dep.required.peerMissing
              }
            })
            .filter(Boolean))
          var message = ['Found missing peer dependencies while installing packages:']
          missingPeers.map(function (missing) {
            message.push('\t ' + missing.requires + ', required by ' + missing.requiredBy)
          })
          message.push('You can try weighing with ' + humanize(missingPeers.map(function (dep) {
            return dep.requires
          })))

          cb(new Error(message.join('\n')))
        } else {
          return cb(err)
        }
      }
      cb(null, packagesToArray(result.dependencies))
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

  var entries = regular.concat(local)

  var b = browserify(entries, {
    extensions: ['.js', '.json']
  })
    .transform(envify, {global: true})

  builtins.forEach(function (builtin) {
    b.require(builtin.name)
  })

  var bstream = b.bundle()

  bstream.pipe(getBytes(function (bytes) {
    log('Approximate weight of %s:', humanize(packages.map(formatPackage())))
    log('  Uncompressed: %s', prettyBytes(bytes))
  }))

  var minifiedStream = shouldMinify && bstream.pipe(argv.minifier === 'closure' ? closureCompiler() : uglifyStream())
  var gzipStream = shouldGzip && (shouldMinify ? minifiedStream : bstream).pipe(zlib.createGzip({level: gzipLevel}))

  minifiedStream && minifiedStream.pipe(getBytes(function (bytes) {
    log('  Minified (' + argv.minifier + '): %s', prettyBytes(bytes))
  }))

  gzipStream && gzipStream.pipe(getBytes(function (bytes) {
    log('  %s (level: %s): %s', shouldMinify ? 'Minified and gzipped' : 'Gzipped, not minified', gzipLevel || 'default', prettyBytes(bytes))
  }))

  function throwError (error) {
    throw error
  }

  [bstream, minifiedStream, gzipStream].filter(Boolean).forEach(function (stream) {
    stream.on('error', throwError)
    stream.pipe(devnull())
  })
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

function uglifyStream (args) {
  var source = ''
  return through(
    function collect (buf) {
      source += buf
    },
    function end () {
      try {
        var uglified = uglify.minify(String(source), {fromString: true})
        this.queue(uglified.code)
      } catch (error) {
        this.emit('error', error)
      }
      this.queue(null)
    })
}

function closureCompiler (args) {
  var ClosureCompiler = require('google-closure-compiler').compiler

  var source = ''
  return through(
    function collect (buf) {
      source += buf
    },

    function end () {
      tryCatch(compile.bind(null, source, function (error, source) {
        if (error) {
          this.emit('error', error)
        } else {
          this.queue(source)
        }
        this.queue(null)
      }.bind(this)))
    })

  function compile (sourceStr, callback) {
    var file = tempfile('.js')
    fs.writeFileSync(file, sourceStr)

    var closureCompiler = new ClosureCompiler({
      js: file,
      compilation_level: 'ADVANCED'
    })

    closureCompiler.run(function (exitCode, stdOut, stdErr) {
      try {
        fs.unlinkSync(file)
      } catch (e) {
        // ignore
      }
      if (exitCode !== 0) {
        callback(new Error('Closure compiler: ' + stdErr))
      } else {
        callback(null, stdOut)
      }
    })
  }
}

function tryCatch (fn, callback) {
  var res
  try {
    res = fn(function (error, res) {
      process.nextTick(function () {
        if (error) {
          callback(error)
          return
        }
        callback(null, res)
      })
    })
  } catch (error) {
    process.nextTick(function () {
      callback(error)
    })
    return
  }
  fn(null, res)
}

function flatten (arr) {
  return arr.reduce(function (flattened, arr) {
    return flattened.concat(arr)
  }, [])
}
