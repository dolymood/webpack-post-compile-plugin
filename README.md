# webpack-post-compile-plugin [![Build Status](https://travis-ci.org/dolymood/webpack-post-compile-plugin.svg?branch=master)](https://travis-ci.org/dolymood/webpack-post-compile-plugin?branch=master) [![codecov.io](http://codecov.io/github/dolymood/webpack-post-compile-plugin/coverage.svg?branch=master)](http://codecov.io/github/dolymood/webpack-post-compile-plugin?branch=master)

A webpack post compile plugin. It is used to include post compile modules in node_modules.

### Install

```shell
npm i webpack-post-compile-plugin --save-dev
```

### Usage

```js
import PostCompilePlugin from 'webpack-post-compile-plugin'
var path = require('path')

module.exports = {
  // ...
  module: {
    rules: [
      // ...
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [path.resolve(__dirname, './')]
        // this plugin will be include the post compile node modules path
        // eg: {"compileDependencies": ["a"]} // package.json
        // the current rule's include will be like: 
        // `[path.resolve(__dirname, './'), path.resolve(process.cwd(), 'node_modules/a')]`
      }
      // ...
    ]
  },
  plugins: [
    new PostCompilePlugin()
  ]
}
```

#### Options

```js
new PostCompilePlugin({
  dependenciesKey: 'myCompileDependencies',
  compileDependencies: ['a', 'b']
})
```

* `dependenciesKey {String}` default `'compileDependencies'`, dependencies key in `package.json`, it is used to find and include post compile node modules.

* `compileDependencies {Array}` default `undefined`, application init post compile node modules, if it is `undefined` then the plugin will get `dependenciesKey` value or `dependencies` keys value in `package.json` as the init application's post complie node modules.
