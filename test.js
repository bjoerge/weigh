/* globals it describe */

var expect = require('expect')
var exec = require('child_process').exec

function matchOutput (options) {
  var nl = '\n'
  return new RegExp(
    nl +
    'Calculating size of ' + options.packages.join(', ') +
    nl +
    nl +
    'Weighing modules: ' +
    nl +
    options.packages.slice()
      .sort()
      .map(function (pkgName) {
        return '  \\[package\\] ' + pkgName + '@\\d+.\\d+.\\d+'
      }).join(nl) +
    nl +
    nl +
    'Uncompressed: ~(.+)' +
    nl +
    'Uglified: (.+)' +
    nl +
    'Uglified \\+ gzipped \\(level: ' + (options.gzipLevel || 'default') + '\\): ~(.+)' +
    nl +
    nl +
    'Note: these numbers are approximate.' +
    nl
    , 'm')
}

var expectations = [
  ['react', matchOutput({packages: ['react']})],
  ['lodash --gzip-level 9', matchOutput({packages: ['lodash'], gzipLevel: 9})],
  ['lodash react history', matchOutput({packages: ['history', 'lodash', 'react'], gzipLevel: 9})]
]

expectations.forEach(function (expectation) {
  var args = expectation[0]
  var expected = expectation[1]

  describe('> weigh ' + args, function () {
    it('works', function (done) {
      exec(require.resolve('./index.js') + ' ' + args, function (error, stdout, stderr) {
        expect(error).toNotExist('Expected no error, instead got ' + error)
        expect(stderr).toNotExist('Expected empty stderr')
        expect(stdout).toMatch(expected)
        done()
      })
    })
  })
})
