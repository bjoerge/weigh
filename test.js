var test = require('tap').test
var exec = require('child_process').exec

var labels = {
  prelude: function (modules) {
    return 'Calculating size of ' + modules
  },
  weighHeader: 'Weighing modules: ',
  postlude: 'Note: these numbers are approximate.',
  matchPackage: function matchPackage (pkgName) {
    return new RegExp('  \\[package\\] ' + pkgName + '@\\d+.\\d+.\\d+')
  },
  matchSummary: function matchSummary (gzipLevel) {
    return [
      /Uncompressed: ~(.+)/,
      /Uglified: (.+)/,
      new RegExp('Uglified \\+ gzipped \\(level: ' + gzipLevel + '\\): ~(.+)')
    ]
  }
}

var expectations = [
  ['react', [
    '',
    labels.prelude('react'),
    '',
    labels.weighHeader,
    labels.matchPackage('react'),
    '',
    labels.matchSummary('default'),
    '',
    labels.postlude
  ]],
  ['lodash -g 9', [
    '',
    labels.prelude('lodash'),
    '',
    labels.weighHeader,
    labels.matchPackage('lodash'),
    '',
    labels.matchSummary('9'),
    '',
    labels.postlude
  ]],
  ['lodash react history', [
    '',
    labels.prelude('lodash, react, history'),
    '',
    labels.weighHeader,

    // note: these are sorted alphabetically when returned from npm ls
    labels.matchPackage('history'),
    labels.matchPackage('lodash'),
    labels.matchPackage('react'),
    '',
    labels.matchSummary('default'),
    '',
    labels.postlude
  ]]
]

expectations.forEach(function (expectation) {
  var args = expectation[0]
  var expectedLines = flatten(expectation[1])

  test('weigh ' + args, function (t) {
    exec(require.resolve('./index.js') + ' ' + args, function (error, stdout, stderr) {
      t.notOk(error, 'Expected no error, instead got ' + error)
      t.notOk(stderr, 'Expected empty stderr')
      var stdoutLines = stdout.split('\n')
      expectedLines.forEach(function (expectedLine, i) {
        var stdoutLine = stdoutLines[i]
        if (expectedLine instanceof RegExp) {
          return t.match(stdoutLine, expectedLine)
        }
        t.equal(expectedLine, stdoutLine)
      })
      t.end()
    })
  })
})

function flatten (arr) {
  return arr.reduce(function (flattened, item) {
    return flattened.concat(item)
  }, [])
}
