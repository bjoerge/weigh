# Weigh [![Build Status](https://travis-ci.org/bjoerge/weigh.svg)](https://travis-ci.org/bjoerge/weigh)

A command line tool to check the approximate weight (in bytes) of any npm module that works in the browser

## Install

```
npm i -g weigh
```

## Usage

```
Usage: weigh [@scope/]module[@version][/module.js] [@scope/]module[@version][/module.js ...]

  Options:
    --help                 Show this usage information
    --gzip-level, -g       Gzip compression level
    --verbose, -v          Do a little more logging along the way

  The special option -- can be used to pass on the arguments after the -- to uglify-js, e.g.

    weigh request -- --mangle --screw-ie-8 --comments
```

## Example:
```
$ weigh lodash
```
Outputs:
```
Downloading lodash, this may take a little while…
Downloaded 1 package(s)

Weighing lodash…

Approximate weight of lodash:
  Uncompressed: ~412.11 kB
  Uglified: 51.61 kB
  Uglified + gzipped (level: default): ~18.82 kB
```

Note: `weigh` uses browserify under the hood to bundle the module, and adds envify as a global
transform, so its possible to weight a production build of modules that does code branching based on
`process.env.NODE_ENV`.

For example compare:

```
$ weigh react
Uncompressed: 666.1 kB
Uglified: 212.63 kB
Uglified + gzipped (level: default): 58.13 kB
```

...with:

```
$ NODE_ENV=production weigh react
Uncompressed: 657.2 kB
Uglified: 158.36 kB
Uglified + gzipped (level: default): 42.7 kB
```

### Some more examples of supported module formats

- `weigh lodash`
- `weigh lodash/collection/map`
- `weigh lodash@latest/collection/map`
- `weigh @myorg/mypkg`
- `weigh @myorg/mypkg@latest`
- `weigh @myorg/mypkg/foo/bar.js`
- `weigh @myorg/mypkg@latest/foo/bar.js`
- `weigh @myorg/mypkg@2.1.4/foo/bar.js`
- `weigh ./path/to/foo/bar.js`
- `weigh /absolute/path/to/foo/bar.js`
- `weigh .` (module in cwd)

## Todo (maybe?)
- Allow outputting the built bundle for piping to e.g. [hughsk/disc](discify)

# License

MIT
