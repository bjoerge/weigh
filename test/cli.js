/* globals it describe */

var expect = require('expect')
var exec = require('child_process').exec

var BINARY = require.resolve('../bin/cli.js')

describe('error handling', function () {
  it('fails if bundle entry is not resolved', function (done) {
    exec(BINARY + ' ./doesnotexists.js --__keepcache', function (error, stdout, stderr) {
      expect(error).toExist()
      expect(stdout).toNotExist()
      expect(stderr).toInclude('File not found: ./doesnotexists.js')
      done()
    })
  })

  it('fails if a module that does not exist are included in bundle', function (done) {
    exec(BINARY + ' @bjoerge/doesnotexist --__keepcache', function (error, stdout, stderr) {
      expect(error).toExist()
      expect(stdout).toNotExist()
      expect(stderr).toInclude("'@bjoerge/doesnotexist' is not in the npm registry")
      done()
    })
  })
})

describe('bundling local files', function () {
  it('actually includes the file in the bundle', function (done) {
    exec(BINARY + ' ./doesnotexists.js --__keepcache', function (error, stdout, stderr) {
      expect(error).toExist()
      expect(stdout).toNotExist()
      expect(stderr).toInclude('File not found: ./doesnotexists.js')
      done()
    })
  })
})

describe('bundling local files', function () {
  it('actually includes the file in the bundle', function (done) {
    exec(BINARY + ' ./test/fixtures/content.js --__keepcache', function (error, stdout, stderr) {
      expect(error).toNotExist()
      expect(stderr).toNotExist()
      expect(stdout).toExist()
      var sizeMatch = stdout.match(/Uncompressed: (.+) (.+)/)
      var size = parseFloat(sizeMatch[1])
      var unit = sizeMatch[2]
      expect(unit).toBe('kB', "Expected unit of bundle size to be in 'kB', instead got %s", unit)
      expect(size).toBeGreaterThanOrEqualTo(1.3, 'Expected bundle size to be greater than the content of the bundled file')
      done()
    })
  })
})
