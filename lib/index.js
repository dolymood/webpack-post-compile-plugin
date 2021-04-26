const webpack = require('webpack')
let PostCompilePlugin = null

if (webpack.version && webpack.version[0] > 4) {
  // webpack5 and upper
  PostCompilePlugin = require('./plugin-webpack5')
} else {
  // webpack4 and lower
  PostCompilePlugin = require('./plugin-webpack4')
}

module.exports = PostCompilePlugin
