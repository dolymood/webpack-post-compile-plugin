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
      expect(compiler.options.module.rules[0].include[1]).to.equal(a)
      expect(compiler.options.module.rules[0].include[2]).to.equal(b)
      expect(compiler.options.module.rules[1].include.length).to.equal(3)
      expect(compiler.options.module.rules[1].include[0]).to.equal('yy')
      expect(compiler.options.module.rules[2].include).to.be.undefined
      expect(compiler.options.module.rules[3].oneOf[0].include[1]).to.equal(a)
      expect(compiler.options.module.rules[3].oneOf[0].include[2]).to.equal(b)
      expect(compiler.options.module.rules[3].oneOf[1].include).to.be.undefined
    })
  })
})
