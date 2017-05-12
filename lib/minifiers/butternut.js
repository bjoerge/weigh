var butternut = require('butternut')
var through2 = require('through2')

module.exports = function minify () {
  var source = ''
  return through2(
    function collect (buf, enc, cb) {
      source += buf
      cb()
    },
    function end () {
      try {
        var result = butternut.squash(source, {sourceMap: false})
        this.push(result.code)
      } catch (error) {
        this.emit('error', error)
      }
      this.push(null)
    })
}
