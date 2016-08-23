# semver-resolve
The semantic version resolver.

## Usage

```javascript
var semverResolve = require("semver-resolve");

// babel-core peerDependencies from babel-loader and vue-loader
var babelCoreRange = semverResolve(["^6.0.0", "^6.8.0"]);
console.log(babelCoreRange); // ">=6.8.0 <7.0.0"

// webpack peerDependencies from babel-loader, webpack-dev-server and extract-text-webpack-plugin
var webpackRange = semverResolve(["1 || ^2.1.0-beta", ">=1.3.0 <3", "^1.9.11"]);
console.log(webpackRange); // ">=1.9.11 <2.0.0"
```
