## 5.0.0
- Support using [Butternut](https://github.com/Rich-Harris/butternut) as minifier.
- The --output flag will now write the _final_ result to stdout. This means that it by default will output the gzipped bundle to stdout by default.

## 4.2.0
- [deps] Replace the harmony branch of UglifyJS with the uglify-es package

## 4.1.0
- [deps] Now using the harmony branch of UglifyJS. Should be able to parse and compress a lot more modules.
- [deps] Update babel-preset-babili to `0.0.11` and google closure compiler to `20170124.0.0`

## 4.0.0
- Added `--env` flag with `production` as default value.
- Added `--output` flag that will output the compiled bundle.
- `[deps]` Updated babel-preset-babili to `0.0.5`
- `[deps]` Updated Google Closure Compiler to `20161024.0.0`

## 3.5.0
- Babili support! Weigh using babili as minifier with `-m babili`
- More bundlers with `-b` flag:
   weigh now supports specifying a bundler other than browserify with the `-b` flag.

   So far there are two supported bundlers:
  - **`browserify`** (default)
  - **`concat`** Just concat the modules. Will use node's module resolution on the modules given as arguments, but will not do any fancy recursive AST traversal to include any imported dependencies.

## 3.4.0
- Drop Node 0.12 support

## 3.3.3
- Internal refactor. No API changes.
- Fix a bug that caused local files not to be included in bundle 

## 3.3.0
- Add update-notifier and notify about updates
- Minor formatting

## 3.2.0
- Improved warning when missing peer deps
- Made removing local node_modules cache folder default behavior and removed --clean option

## 3.1.0
- Add --version flag and show help when no packages are specified

## 3.0.0

:sparkles: Closure compiler support! You can now minify using closure compiler by passing option `--minifier closure`

* Removed the possibility to pass subargs to UglifyJS. As a consequence, this is no longer possible: `weigh request -- --mangle --screw-ie-8 --comments`
* Better error reporting when weighing a package with peer dependencies
* New options:
    - `--minifier, -m` Specify which JavaScript minifier to use. Can be either `uglify` for UglifyJS (default) or `closure` for Closure Compiler.
    - `--clean` Remove local node_modules cache before installing
    - `--no-minify` Don't minify
    - `--no-gzip` Don't gzip
    - `--uncompressed, -u`  Shorthand for --no-minify --no-gzip
* Updated dependencies:
  - browserify: 13.0.0
  - uglify-js: 2.6.2
  - ++

## 2.0.0
* TESTS OMG!
* Envify is now passed as a global transform so it will respect process.env.NODE_ENV
* Added --verbose flag
* Use `npm ls --json` to get the list of installed modules instead of undocumented/unsupported `npm install --json ...`
* Misc. output improvements
* Improved support for different package formats (e.g. you can now do `weigh @myorg/mypkg@2.1.4/foo/bar.js`)
* Misc code cleanup

## 1.1.3
* Pass --silent option to 'npm install' in order to prevent non-parseable stdout
* Fix a few lint errors
* Prettify eslint output

## 1.1.2
* Strip out non-JSON lines from npm stdout (Justin Deal)

## 1.1.1
* Map flat package object to an array for backwards compatability with npm 2.x (Craig Bilner)

## 1.1.0

* Supports package-relative module names, e.g. `weigh lodash/collection/map`

## 1.0.0 -> 1.0.5
* Misc readme and minor formatting fixes

## 1.0.0
* First release
