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
