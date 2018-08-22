var path = require('path')
var webpack = require('webpack')
var webpackConfig = require('../cases/normal/webpack.config')
var expect = require('chai').expect

describe('normal case', function () {
  it('webpack options should be correct', function (done) {
    webpack(webpackConfig, function (err, stats) {
      var ret = require('../cases/normal/app.js')
      expect(ret.a).to.equal('a')
      expect(ret.b).to.equal('b')
      done()
    })
  })
})
