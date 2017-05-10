var through2 = require('through2')
var uglify = require('uglify-es')

module.exports = function minify (args) {
  var source = ''
  return through2(
    function collect (buf, enc, cb) {
      source += buf
      cb()
    },
    function end () {
      try {
        var result = uglify.minify(String(source))
        if (result.error) {
          this.emit('error', result.error)
          return
        }
        this.push(result.code)
      } catch (error) {
        this.emit('error', error)
      }
      this.push(null)
    })
}
