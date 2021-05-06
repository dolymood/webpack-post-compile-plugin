var path = require('path')
var webpack = require('webpack')
var webpackConfig = require('../cases/nested/webpack.config')
var expect = require('chai').expect

describe('nested case', function () {
  it('webpack options should be correct', function (done) {
    webpack(webpackConfig, function (err, stats) {
      var compiler = stats.compilation.compiler
      var options = compiler.options
      var rule = options.module.rules[0]
      if (webpack.version && webpack.version[0] <= 4) {
        expect(rule.resource(path.resolve(__dirname, '../cases/nested/index.js')))
          .to.be.false
        expect(rule.resource(path.resolve(__dirname, '../cases/nested/src/index.js')))
          .to.be.true
        expect(rule.resource(path.resolve(__dirname, '../cases/nested/node_modules/a/index.js')))
          .to.be.true
        expect(rule.resource(path.resolve(__dirname, '../cases/nested/node_modules/b/node_modules/a/index.js')))
          .to.be.true
        expect(rule.resource(path.resolve(__dirname, '../cases/nested/node_modules/b/node_modules/@dd/a/index.js')))
          .to.be.true
        expect(rule.resource(path.resolve(__dirname, '../cases/nested/node_modules/b/index.js')))
          .to.be.true
        expect(rule.resource(path.resolve(__dirname, '../cases/nested/node_modules/cc/index.js')))
          .to.be.false
      }
     
      var ret = require('../cases/nested/app.js')
      expect(ret.a).to.equal('nested a')
      expect(ret.b).to.equal('nested b, nested inner a, @dd nested inner a')
      expect(ret.c).to.equal('cc')
      expect(ret.pkg.name).to.equal('nested')
      done()
    })
  })
})
