var path = require('path')
var expect = require('chai').expect
var PostCompilePlugin = require('../../lib/index')

describe('PostCompilePlugin', function () {
  it('new', function () {
    var p = new PostCompilePlugin()
    expect(p.key).to.equal('compileDependencies')
    expect(p.initDependencies).to.be.null
    p = new PostCompilePlugin({
      dependenciesKey: 'myCompileDependencies',
      compileDependencies: ['a', 'b']
    })
    expect(p.key).to.equal('myCompileDependencies')
    expect(p.initDependencies.length).to.equal(2)
    expect(p.initDependencies[1]).to.equal('b')
  })
  it('#apply()', function () {
    var p = new PostCompilePlugin()
    var context = path.resolve(__dirname, '../cases/normal')
    var compiler = {
      _plugins: [],
      options: {
        context: context,
        module: {
          rules: [
            {
              include: ['xx']
            },
            {
              include: 'yy'
            },
            {
              xx: 'xx'
            },
            {
              oneOf: [
                {
                  include: ['xxx']
                },
                {
                  xx: 'xx'
                }
              ]
            }
          ]
        }
      },
      plugin: function (name, fn) {
        if (Array.isArray(name)) {
          return name.forEach(function (n) {
            compiler._plugins.push({
              name: n,
              cb: fn
            })
          })
        }
        compiler._plugins.push({
          name: name,
          cb: fn
        })
      }
    }
    p.apply(compiler)
    compiler._plugins[0].cb(compiler, function () {
      const a = path.resolve(__dirname, '../cases/normal/node_modules/a')
      const b = path.resolve(__dirname, '../cases/normal/node_modules/b')
      const aMain = path.resolve(__dirname, '../cases/normal/node_modules/a/index.js')
      const bMain = path.resolve(__dirname, '../cases/normal/node_modules/b/index.js')
      const dMain = path.join(__dirname, '../cases/normal/node_modules/dd/index.js')

      expect(compiler.options.module.rules[0].resource(aMain))
        .to.be.true
      expect(compiler.options.module.rules[0].resource(bMain))
        .to.be.true
      expect(compiler.options.module.rules[0].resource(dMain))
        .to.be.false
      expect(compiler.options.module.rules[1].resource(aMain))
        .to.be.true
      expect(compiler.options.module.rules[1].resource(bMain))
        .to.be.true
      expect(compiler.options.module.rules[1].resource(dMain))
        .to.be.false
      expect(compiler.options.module.rules[2].resource)
        .to.be.undefined
      expect(compiler.options.module.rules[3].oneOf[0].resource(aMain))
        .to.be.true
      expect(compiler.options.module.rules[3].oneOf[0].resource(bMain))
        .to.be.true
      expect(compiler.options.module.rules[3].oneOf[0].resource(dMain))
        .to.be.false
      expect(compiler.options.module.rules[3].oneOf[1].resource)
        .to.be.undefined
    })
  })
})
