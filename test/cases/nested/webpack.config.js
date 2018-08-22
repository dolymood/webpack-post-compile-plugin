var path = require('path')
var PostCompilePlugin = require('../../../lib/index')

module.exports = {
  context: __dirname,
  mode: 'production',
  entry: {
    app: path.resolve(__dirname, './src1/index')
  },
  output: {
    path: path.resolve(__dirname, './'),
    library: 'normal',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [path.resolve(__dirname, './src1')]
      },
      {
        test: /\.css$/,
        loader: 'raw-loader'
      }
    ]
  },
  plugins: [
    new PostCompilePlugin()
  ]
}
