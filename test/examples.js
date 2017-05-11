/* globals it describe */

var expect = require('expect')
var exec = require('child_process').exec

var BINARY = require.resolve('../bin/cli.js')

function createOutputRegex (minifier) {
  return new RegExp(
    'Approximate weight of (.+):\n' +
    '  Uncompressed: (.+)\n' +
    '  Minified \\(' + minifier + '\\): (.+)\n' +
    '  Minified and gzipped \\(level: (.+)\\): (.+)'
  )
}

var expectations = [
  ['Single package', 'lodash'],
  ['Multiple packages', 'lodash react history'],
  ['Specifying gzip level', 'lodash', 9],
  ['Builtins', 'url'],
  ['Local file', './lib/parsePackage.js'],
  ['Package relative module', 'lodash/map'],
  ['Scoped package', '@bjoerge/npm-private-test'],
  ['Scoped package with version specifier', '@bjoerge/npm-private-test@latest'],
  ['Scoped package with version specifier *and* relative path', '@bjoerge/npm-private-test@0.0.2/some/thing.js'],
  [
    'Combination of regular package, local file, builtin, and package relative module',
    'async ./lib/parsePackage.js path lodash/shuffle'
  ]
]

function createCmd (args, options) {
  return args + ' ' + options
      .filter(Boolean)
      .map(function (opt) {
        return '--' + opt[0] + ' ' + opt[1]
      })
      .join(' ')
}

const BUNDLERS = ['browserify', 'concat']
const MINIFIERS = ['butternut', 'uglify', 'closure', 'babili']

BUNDLERS.forEach(function (bundler) {
  describe('Using ' + bundler + ' as bundler', function () {
    MINIFIERS.forEach(function (minifier) {
      describe('Using ' + minifier + ' as minifier', function () {
        expectations.forEach(function (expectation) {
          var desc = expectation[0]
          var args = expectation[1]

          if (bundler === 'concat' && args === 'url') {
            return
          }
          // Remove when https://github.com/facebook/react/issues/7551 is fixed and released
          if (minifier === 'closure' && args.includes('react')) {
            return
          }
          // ---------

          var gzipLevel = expectation[2]

          var cmd = createCmd(args, [
            ['bundler', bundler],
            gzipLevel && ['gzip-level', gzipLevel],
            ['minifier', minifier]
          ])

          var expectedOutput = createOutputRegex(minifier)

          describe(desc, function () {
            this.timeout(1000 * 60 * 10)
            this.slow(1000 * 60 * 10)
            it('weigh ' + cmd, function (done) {
              exec(BINARY + ' ' + cmd + ' --__keepcache', function (error, stdout, stderr) {
                expect(error).toNotExist('Expected no error, instead got ' + error)
                console.log(stderr)
                expect(stderr).toNotExist('Expected empty stderr')
                expect(stdout).toMatch(expectedOutput)
                done()
              })
            })
          })
        })
      })
    })
  })
})
