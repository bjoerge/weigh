var slice = Array.prototype.slice
function createLogEntry (level) {
  const restArgs = slice.call(arguments, 1)
  return {
    level: level,
    args: restArgs
  }
}

function info () {
  return createLogEntry.apply(null, ['info'].concat(slice.call(arguments)))
}

function verbose () {
  return createLogEntry.apply(null, ['verbose'].concat(slice.call(arguments)))
}

function progress () {
  return createLogEntry.apply(null, ['progress'].concat(slice.call(arguments)))
}

function missingPeerDeps (deps) {
  return createLogEntry('missingPeerDeps', {peerDeps: deps})
}

module.exports = {
  info: info,
  verbose: verbose,
  progress: progress,
  missingPeerDeps: missingPeerDeps
}
