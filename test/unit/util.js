var path = require('path')
var expect = require('chai').expect
var util = require('../../lib/util')

describe('util', function () {
  it('#getPkg()', function () {
    var pkg = util.getPkg(path.resolve(__dirname, '../cases/normal'))
    expect(pkg.name).to.equal('normal')
    pkg = util.getPkg(path.resolve(__dirname, '../cases'))
    expect(pkg).to.be.null
    pkg = util.getPkg(path.resolve(__dirname, '../cases/normal'), 'a')
    expect(pkg.name).to.equal('a')
  })
  it('#collectDependencies()', function () {
    var names = ['a', 'b']
    var dependencies = []
    var context = path.resolve(__dirname, '../cases/normal')
    var key = 'compileDependencies'
    util.collectDependencies('a', dependencies, context, key)
    expect(dependencies[0]).to.equal(path.resolve(__dirname, '../cases/normal/node_modules/a'))
    dependencies = []
    util.collectDependencies(['b'], dependencies, context, key)
    expect(dependencies[0]).to.equal(path.resolve(__dirname, '../cases/normal/node_modules/a'))
    expect(dependencies[1]).to.equal(path.resolve(__dirname, '../cases/normal/node_modules/b'))
    dependencies = []
    util.collectDependencies(['c'], dependencies, context, key, true)
    expect(dependencies.length).to.equal(0)
    dependencies = []
    util.collectDependencies([''], dependencies, context, key)
    expect(dependencies.length).to.equal(0)
    dependencies = []
    context = path.resolve(__dirname, '../cases/nested')
    key = 'myCompileDependencies'
    util.collectDependencies(['a', 'b'], dependencies, context, key)
    expect(dependencies.length).to.equal(4)
    expect(dependencies[0]).to.equal(path.resolve(__dirname, '../cases/nested/node_modules/a'))
    expect(dependencies[1]).to.equal(path.resolve(__dirname, '../cases/nested/node_modules/b/node_modules/a'))
    expect(dependencies[2]).to.equal(path.resolve(__dirname, '../cases/nested/node_modules/b/node_modules/@dd/a'))
    expect(dependencies[3]).to.equal(path.resolve(__dirname, '../cases/nested/node_modules/b'))
  })
})
