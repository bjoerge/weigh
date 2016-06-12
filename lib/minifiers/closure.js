var tempfile = require('tempfile')
var fs = require('fs')
var through2 = require('through2')

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

module.exports = function minify (args) {
  var ClosureCompiler = require('google-closure-compiler').compiler

  var source = ''
  return through2(
    function collect (buf, enc, cb) {
      source += buf
      cb()
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
