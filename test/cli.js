/* globals it describe */

var expect = require('expect')
var exec = require('child_process').exec

function createOutputRegex () {
  return new RegExp(
    'Weighing (.+)…\n' +
    '\n' +
    'Approximate weight of (.+):\n' +
    '  Uncompressed: (.+)\n' +
    '  Uglified: (.+)\n' +
    '  Uglified \\+ gzipped \\(level: (.+)\\): (.+)'
  )
}

var expectations = [
  ['Single package', 'lodash'],
  ['Multiple packages', 'lodash react history'],
  ['Specifying gzip level', 'lodash', 9],
  ['Builtins', 'url'],
  ['Local file', '../parse-package.js'],
  ['Package relative module', 'lodash/collection/map'],
  ['Scoped package', '@bjoerge/npm-private-test'],
  ['Scoped package with version specifier', '@bjoerge/npm-private-test@latest'],
  ['Scoped package with version specifier *and* relative path', '@bjoerge/npm-private-test@0.0.2/some/thing.js'],
  [
    'Combination of regular package, local file, builtin, and package relative module',
    'async ../parse-package.js path lodash/collection/shuffle'
  ]
]

expectations.forEach(function (expectation) {
  var desc = expectation[0]
  var args = expectation[1]

  var gzipLevel = expectation[2]

  var cmd = args + (gzipLevel ? ' --gzip-level ' + gzipLevel : '')

  var expectedOutput = createOutputRegex()

  describe(desc, function () {
    this.timeout(1000 * 60 * 10)
    this.slow(1000 * 60 * 10)
    it('weigh ' + cmd, function (done) {
      exec(require.resolve('../bin/cli.js') + ' ' + cmd, function (error, stdout, stderr) {
        expect(error).toNotExist('Expected no error, instead got ' + error)
        expect(stderr).toNotExist('Expected empty stderr')
        expect(stdout).toMatch(expectedOutput)
        done()
      })
    })
  })
})
