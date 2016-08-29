var through2 = require('through2')

var babel = require('babel-core')

module.exports = function minify (args) {
  var source = ''
  return through2(
    function collect (buf, enc, cb) {
      source += buf
      cb()
    },
    function end () {
      try {
        var babilified = babel.transform(source, {
          presets: ['babili']
        })
        this.push(babilified.code)
      } catch (error) {
        this.emit('error', error)
      }
      this.push(null)
    })
}
