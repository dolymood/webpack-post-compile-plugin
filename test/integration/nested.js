var path = require('path')
var webpack = require('webpack')
var webpackConfig = require('../cases/nested/webpack.config')
var expect = require('chai').expect

describe('nested case', function () {
  it('webpack options should be correct', function (done) {
    webpack(webpackConfig, function (err, stats) {
      var ret = require('../cases/nested/app.js')
      expect(ret.a).to.equal('nested a')
      expect(ret.b).to.equal('nested b, nested inner a, @dd nested inner A')
      expect(ret.pkg.name).to.equal('nested')
      expect(ret.css).to.equal('body {line-height:1;}')
      done()
    })
  })
})
