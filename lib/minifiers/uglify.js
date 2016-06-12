var through2 = require('through2')
var uglify = require('uglify-js')

module.exports = function minify (args) {
  var source = ''
  return through2(
    function collect (buf, enc, cb) {
      source += buf
      cb()
    },
    function end () {
      try {
        var uglified = uglify.minify(String(source), {fromString: true})
        this.push(uglified.code)
      } catch (error) {
        this.emit('error', error)
      }
      this.push(null)
    })
}
