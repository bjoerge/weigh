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
    --bundler -b        Which bundler to use. Can be one of
                          • `browserify` (default)
                          • `concat`
    --minifier, -m      Specify which JavaScript minifier to use. Can be either
                          • `uglify` for UglifyJS (default)
                          • `closure` for Closure Compiler
                          • `babili` for Babili
    --verbose, -v       Do a little more logging along the way
    --gzip-level, -g    Gzip compression level
    --no-minify         Don't minify
    --no-gzip           Don't gzip
    --uncompressed, -u  Shorthand for --no-minify --no-gzip
    --env               The value of process.env.NODE_ENV inside the bundle.
                        Defaults to `production`
    --output -o         Output compiled bundle to stdout. This will neither
                        minify, gzip, nor show any progress, but just output
                        the generated bundle. If browserify used for bundling,
                        `fullpaths: true` will be passed as an option to
                        browserify, so that e.g. `discify` can be used for
                        further inspection
    --version           Show version

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

Note: By default `weigh` uses browserify under the hood to bundle the module, and adds envify as a global transform, with `NODE_ENV` set to `production`

This means weigh will report the size of a production build for modules that does code branching based on `process.env.NODE_ENV`

For example compare:

```
$ weigh redux
Approximate weight of redux:
  Uncompressed: 28.5 kB
  Minified (uglify): 7.82 kB
  Minified and gzipped (level: default): 2.73 kB
```

...with:

```
$ weigh redux --development
Approximate weight of redux:
  Uncompressed: 28.5 kB
  Minified (uglify): 9.23 kB
  Minified and gzipped (level: default): 3.36 kB
```

## Inspecting compiled bundle
You can output the compiled bundle for further inspection using `--output` (or `-o`)
command line option. This will just pipe generated the bundle to stdout, which also enables further bundle size breakdown e.g. using [hughsk/disc](https://github.com/hughsk/disc).

For example:

```
weigh --output rxjs | discify --open
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

# License

MIT
