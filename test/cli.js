/* globals it describe */

var expect = require('expect')
var exec = require('child_process').exec

var BINARY = require.resolve('../bin/cli.js')

describe('error handling', function () {
  it('fails if bundle entry is not resolved', function (done) {
    exec(BINARY + ' ./doesnotexists.js --__keepcache', function (error, stdout, stderr) {
      expect(error).toExist()
      expect(stdout).toNotExist()
      expect(stderr).toInclude("Error: Cannot find module './doesnotexists.js'")
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
  it('builds with --output flag', function (done) {
    exec(BINARY + ' ./test/fixtures/hello.js --output --no-gzip', function (error, stdout, stderr) {
      expect(error).toNotExist()
      expect(stderr).toNotExist()
      expect(stdout).toExist()
      expect(stdout).toInclude('hello world')
      done()
    })
  })
  it('builds with --env production by default', function (done) {
    exec(BINARY + ' ./test/fixtures/env.js --output --no-gzip --no-minify', function (error, stdout, stderr) {
      expect(error).toNotExist()
      expect(stderr).toNotExist()
      expect(stdout).toExist()
      expect(stdout).toInclude('if ("production" === "production") {console.log("production")}')
      done()
    })
  })
  it('builds another value for --env', function (done) {
    exec(BINARY + ' ./test/fixtures/env.js --env=development --output --no-gzip --no-minify', function (error, stdout, stderr) {
      expect(error).toNotExist()
      expect(stderr).toNotExist()
      expect(stdout).toExist()
      expect(stdout).toInclude('if ("development" === "production") {console.log("development")}')
      done()
    })
  })
})
