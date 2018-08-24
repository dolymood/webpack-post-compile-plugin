var path = require('path')
var expect = require('chai').expect
var PostCompilePlugin = require('../../lib/index')
var RuleSet = require('webpack/lib/RuleSet')

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
    var src = path.resolve(__dirname, '../cases/normal/src')
    var compiler = {
      _plugins: [],
      options: {
        context: context,
        module: {
          rules: [
            {
              include: [src]
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
                  include: [src]
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
        .to.be.false
      expect(compiler.options.module.rules[1].resource(bMain))
        .to.be.false
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
  it('should work when have config - vue-cli@3.x', function () {
    var context = path.resolve(__dirname, '../cases/normal')
    const options = {
      context: context,
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: [path.resolve(__dirname, '../cases/normal/node_modules')],
            use: [
              {
                loader: 'a-loader',
                options: {
                  a: 'a'
                }
              }
            ]
          },
          {
            test: /\.js$/,
            use: [
              {
                loader: 'b-loader',
                options: {
                  b: 'b'
                }
              }
            ]
          },
          {
            test: /\.css$/,
            exclude: [path.resolve(__dirname, '../cases/normal/node_modules')],
            oneOf: [
              {
                resourceQuery: /c1/,
                use: [
                  {
                    loader: 'c-loader',
                    options: {
                      c: 'c'
                    }
                  }
                ]
              },
              {
                resourceQuery: /c2/,
                use: [
                  {
                    loader: 'c2-loader',
                    options: {
                      c: 'c2'
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    }
    var p = new PostCompilePlugin()
    const ruleSet = new RuleSet(options.module.rules)
    options.module.rules = ruleSet.rules
    var context = path.resolve(__dirname, '../cases/normal')
    var compiler = {
      _plugins: [],
      options: options,
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
      const cssMain = path.resolve(__dirname, '../cases/normal/node_modules/a/index.css')
      const cssMain2 = path.resolve(__dirname, '../cases/normal/node_modules/b/index.css')

      expect(compiler.options.module.rules[0].resource(aMain))
        .to.be.true
      expect(compiler.options.module.rules[0].resource(bMain))
        .to.be.true
      expect(compiler.options.module.rules[0].resource(dMain))
        .to.be.false
      expect(compiler.options.module.rules[0].resource(cssMain))
        .to.be.false
      expect(compiler.options.module.rules[0].resource(cssMain2))
        .to.be.false

      expect(compiler.options.module.rules[1].resource(aMain))
        .to.be.true
      expect(compiler.options.module.rules[1].resource(bMain))
        .to.be.true
      expect(compiler.options.module.rules[1].resource(dMain))
        .to.be.true
      expect(compiler.options.module.rules[1].resource(cssMain))
        .to.be.false
      expect(compiler.options.module.rules[1].resource(cssMain2))
        .to.be.false

      expect(compiler.options.module.rules[2].resource(aMain))
        .to.be.false
      expect(compiler.options.module.rules[2].resource(bMain))
        .to.be.false
      expect(compiler.options.module.rules[2].resource(dMain))
        .to.be.false
      expect(compiler.options.module.rules[2].resource(cssMain))
        .to.be.true
      expect(compiler.options.module.rules[2].resource(cssMain2))
        .to.be.true
    })
  })
})
