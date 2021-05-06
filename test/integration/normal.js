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
      if (webpack.version && webpack.version[0] <= 4) {
        expect(rule.resource(path.resolve(__dirname, '../cases/normal/index.js')))
          .to.be.false
        expect(rule.resource(path.resolve(__dirname, '../cases/normal/src/index.js')))
          .to.be.true
        expect(rule.resource(path.resolve(__dirname, '../cases/normal/node_modules/a/index.js')))
          .to.be.true
        expect(rule.resource(path.resolve(__dirname, '../cases/normal/node_modules/b/index.js')))
          .to.be.true
        expect(rule.resource(path.resolve(__dirname, '../cases/normal/node_modules/m/index.js')))
          .to.be.false
        expect(rule.resource(path.resolve(__dirname, '../cases/normal/node_modules/@d/d/index.js')))
          .to.be.true
      }
      var ret = require('../cases/normal/app.js')
      expect(ret.a).to.equal('a')
      expect(ret.b).to.equal('b')
      expect(ret.d).to.equal('d')
      done()
    })
  })
})