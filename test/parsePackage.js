/* globals it describe */
var expect = require('expect')
var parsePackage = require('../lib/parsePackage')

const expectations = [
  ['@myorg/mypkg@latest/foo/bar.js', {
    scope: '@myorg',
    name: 'mypkg',
    version: 'latest',
    file: '/foo/bar.js',
    raw: '@myorg/mypkg@latest/foo/bar.js'
  }],
  ['@myorg/mypkg@latest', {
    scope: '@myorg',
    name: 'mypkg',
    version: 'latest',
    file: null,
    raw: '@myorg/mypkg@latest'
  }],
  ['@myorg/mypkg', {
    scope: '@myorg',
    name: 'mypkg',
    version: null,
    file: null,
    raw: '@myorg/mypkg'
  }],
  ['lodash', {
    scope: null,
    name: 'lodash',
    version: null,
    file: null,
    raw: 'lodash'
  }],
  ['lodash/foo/bar.js', {
    scope: null,
    name: 'lodash',
    version: null,
    file: '/foo/bar.js',
    raw: 'lodash/foo/bar.js'
  }],
  ['lodash@latest/foo/bar.js', {
    scope: null,
    name: 'lodash',
    version: 'latest',
    file: '/foo/bar.js',
    raw: 'lodash@latest/foo/bar.js'
  }],
  ['@myorg/mypkg/foo/bar.js', {
    scope: '@myorg',
    name: 'mypkg',
    version: null,
    file: '/foo/bar.js',
    raw: '@myorg/mypkg/foo/bar.js'
  }],
  ['@myorg/mypkg@2.1.4/foo/bar.js', {
    scope: '@myorg',
    name: 'mypkg',
    version: '2.1.4',
    file: '/foo/bar.js',
    raw: '@myorg/mypkg@2.1.4/foo/bar.js'
  }],
  ['./path/to/foo/bar.js', {
    scope: null,
    name: null,
    version: null,
    file: './path/to/foo/bar.js',
    raw: './path/to/foo/bar.js'
  }],
  ['/absolute/path/to/foo/bar.js', {
    scope: null,
    name: null,
    version: null,
    file: '/absolute/path/to/foo/bar.js',
    raw: '/absolute/path/to/foo/bar.js'
  }],
  ['.', {
    scope: null,
    name: null,
    version: null,
    file: '.',
    raw: '.'
  }]
]

describe('parse', function () {
  expectations.forEach(function (expectation) {
    var input = expectation[0]
    var output = expectation[1]
    it('Parses ' + input + ' correctly', function () {
      expect(parsePackage(input)).toEqual(output)
    })
  })

  it('throws an error if pattern is invalid', function () {
    expect(function () { console.log(parsePackage('@/@/@')) }).toThrow()
  })
})
