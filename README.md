# Weigh

Command line tool to check the weight (in bytes) of any browserifiable module

## Example:
```
$ weigh react ./index.js fs crypto
```
Outputs:
```
Calculating size of react, ./index.js, fs, crypto

Weighing modules:
  [module]  /Users/bjoerge/code/_/weigh/index.js
  [builtin] fs
  [builtin] crypto
  [package] react@0.13.3

Total weight, uncompressed: ~2.6 MB
Total weight, uglified: 1.44 MB
Total weight, uglified+ gzipped (level: default): ~348.31 kB

Note: these numbers are approximate.
```

## Install

```
npm i -g weigh
````


```
Usage: weigh module[@version]

  Options:

    --gzip-level, -g       Gzip compression level


  The special option -- can be used to pass on the arguments after the -- to uglify-js, e.g.

    weigh request -- --mangle --screw-ie-8 --comments
```
