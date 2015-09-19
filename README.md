# Weigh

Command line tool to check the weight (in bytes) of any browserifiable module

## Example:
```
$ weigh react
```
Outputs:
```
Calculating size of react

Uncompressed: ~615.67 kB
Uglified: 143.45 kB
Uglified + gzipped (level: default): ~39.26 kB

Note: these numbers are approximate.
```

## Install

```
npm i -g weigh
````


```
Usage: weigh module[@version] [module[@version] ...]

  Options:

    --gzip-level, -g       Gzip compression level


  The special option -- can be used to pass on the arguments after the -- to uglify-js, e.g.

    weigh request -- --mangle --screw-ie-8 --comments
```
