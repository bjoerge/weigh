# Weigh [![Build Status](https://travis-ci.org/bjoerge/weigh.svg)](https://travis-ci.org/bjoerge/weigh)

A command line tool to check the approximate weight (in bytes) of any npm module that works in the browser

## Install

```
npm i -g weigh
```

## Usage

```
Usage: weigh [@scope/]module[@version][/package/relative/module.js] [@scope/]module[@version][/package/relative/module.js ...]

  Options:
    --help, -h          Show this usage information
    --minifier, -m      Specify which JavaScript minifier to use. Can be either `uglify` for UglifyJS (default) or
                        `closure` for Closure Compiler.
    --verbose, -v       Do a little more logging along the way
    --clean             Remove local node_modules cache before installing
    --gzip-level, -g    Gzip compression level
    --no-minify         Don't minify
    --no-gzip           Don't gzip
    --uncompressed, -u  Shorthand for --no-minify --no-gzip
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
  Minified (uglify): 51.61 kB
  Minified and gzipped (level: default): ~18.82 kB
```

Note: `weigh` uses browserify under the hood to bundle the module, and adds envify as a global
transform, so its possible to weight a production build of modules that does code branching based on
`process.env.NODE_ENV`.

For example compare:

```
$ weigh react
Uncompressed: 666.1 kB
Minified (uglify): 212.63 kB
Minified and gzipped (level: default): 58.13 kB
```

...with:

```
$ NODE_ENV=production weigh react
Uncompressed: 657.2 kB
Minified (uglify): 158.36 kB
Minified and gzipped (level: default): 42.7 kB
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
- Allow outputting the built bundle for piping to e.g. [hughsk/disc](https://github.com/hughsk/disc)

# License

MIT
