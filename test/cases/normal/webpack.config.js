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
    // globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [path.resolve(__dirname, './src')]
      }
    ]
  },
  plugins: [
    new PostCompilePlugin({
      compilePath: [
        'node_modules/@d'
      ]
    })
  ]
}
