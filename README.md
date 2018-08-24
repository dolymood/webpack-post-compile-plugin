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
        // eg: {"compileDependencies": ["cube-ui"]} // package.json
        // the current rule's loader will process node_modules/cube-ui/**/*.js too
      }
      // ...
    ]
  },
  plugins: [
    new PostCompilePlugin()
  ]
}
```

#### Config

And if you can control all the packages which you want to post compile, you can just add `postCompile: true` to the **packages** `package.json`:

```js
{
  "name": "your-one-pkg",
  // ...
  "postCompile": true
  // ...
}
```

Or you can add `compileDependencies` to your application `package.json`:

```js
{
  "name": "your-application",
  // ...
  "compileDependencies": ["xx-pkg"]
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
