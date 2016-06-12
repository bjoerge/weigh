var format = require('util').format
var ora = require('ora')

module.exports = function createLogger () {
  var spinning = false
  var spinner = ora()
  return {
    progress: progress,
    log: log,
    stopSpinner: stopSpinner
  }
  function log () {
    if (spinning) {
      spinner.stop()
    }
    console.log(format.apply(null, arguments))
    if (spinning) {
      spinner.start()
    }
  }

  function progress () {
    if (!spinning) {
      startSpinner()
    }
    spinner.text = format.apply(null, arguments)
  }

  function startSpinner () {
    spinner.start()
    spinning = true
  }

  function stopSpinner () {
    spinner.clear()
    spinner.stop()
    spinning = false
  }
}
