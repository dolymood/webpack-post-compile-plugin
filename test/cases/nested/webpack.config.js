var path = require('path')
var PostCompilePlugin = require('../../../lib/index')

module.exports = {
  context: __dirname,
  entry: {
    app: path.resolve(__dirname, './src/index')
  },
  output: {
    path: path.resolve(__dirname, './'),
    library: 'normal',
    libraryTarget: 'umd'
    // globalObject: 'this' // webpack5
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [path.resolve(__dirname, './src')]
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
        include: [path.resolve(__dirname, './')]
      }
    ]
  },
  plugins: [
    new PostCompilePlugin()
  ]
}
