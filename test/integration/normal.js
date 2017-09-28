var path = require('path')
var webpack = require('webpack')
var webpackConfig = require('../cases/normal/webpack.config')
var expect = require('chai').expect

describe('normal case', function () {
  it('webpack options should be correct', function (done) {
    webpack(webpackConfig, function (err, stats) {
      var compiler = stats.compilation.compiler
      var options = compiler.options
      var rule = options.module.rules[0]
      expect(rule.include.length).to.equal(3)
      expect(rule.include[0]).to.equal(path.resolve(__dirname, '../cases/normal'))
      expect(rule.include[1]).to.equal(path.resolve(__dirname, '../cases/normal/node_modules/a'))
      expect(rule.include[2]).to.equal(path.resolve(__dirname, '../cases/normal/node_modules/b'))
      var ret = require('../cases/normal/app.js')
      expect(ret.a).to.equal('a')
      expect(ret.b).to.equal('b')
      done()
    })
  })
})
