var webpack = require('webpack')
// var webpackConfig = require('./test/cases/normal/webpack.config')
var webpackConfig = require('./test/cases/nested/webpack.config')

webpack(webpackConfig, function (err, stats) {
  console.log(err, stats)
})
