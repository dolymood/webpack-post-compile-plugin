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
    libraryTarget: 'umd',
    globalObject: 'this' // webpack5
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: path.resolve(__dirname, './node_modules/pre-loader'),
        include: [path.resolve(__dirname, './src')]
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [path.resolve(__dirname, './src')]
      }
    ]
  },
  plugins: [
    new PostCompilePlugin({
      compilePaths: [
        'node_modules/@d'
      ]
    })
  ]
}
