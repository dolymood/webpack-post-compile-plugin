var util = require('./util')
var path = require('path')

module.exports = function createPostCompilePlugin (updateRules) {
  var defCompileDependenciesKey = 'compileDependencies'

  function PostCompilePlugin (options) {
    if (!options) {
      options = {}
    }
    this.key = options.dependenciesKey || defCompileDependenciesKey
    this.initDependencies = options.compileDependencies || []
    this.compilePaths = options.compilePaths || []
    this.handledCompilePkgs = {}
    this.pathsResult = {}
    this.sourceDir = options.sourceDir || 'src'
  }

  PostCompilePlugin.prototype.apply = function (compiler) {
    var that = this
    var called = false
    var useHooks = compiler.hooks

    var nmfGetter = function (nmf) {
      var resolveResultGetter = function (result, cb) {
        if (
          result &&
          result.descriptionFileData &&
          result.relativePath
        ) {
          // handle compileDependencies
          var key = result.descriptionFileData.name + result.descriptionFileData.version
          if (!that.handledCompilePkgs[key]) {
            that.handledCompilePkgs[key] = true
            var compileDependencies = result.descriptionFileData[that.key]
            if (compileDependencies) {
              compileDependencies.forEach(function (dep) {
                if (that.initDependencies.indexOf(dep) === -1) {
                  that.initDependencies.push(dep)
                }
              })
            }
          }

          var postCompile = result.descriptionFileData.postCompile
          if (!postCompile) {
            postCompile = that.initDependencies.indexOf(result.descriptionFileData.name) >= 0
          }
          if (!postCompile) {
            postCompile = util.isPathMatch(result.path, that.compilePaths)
          }
          var usePostCompile = util.moduleUsePostCompile(
            result.relativePath,
            postCompile
          )
          if (usePostCompile && result.path.match(/node_modules/)) {
            that.pathsResult[result.path] = true
          }
        }
        cb(null, result)
      }
      var normalResolverGetter = function (normalResolver) {
        if (normalResolver.hooks) {
          normalResolver.hooks.result.tapAsync('PostCompilePlugin', function (result, resolveContext, cb) {
            resolveResultGetter(result, cb)
          })
        } else {
          normalResolver.plugin('result', resolveResultGetter)
        }
      }

      if (useHooks) {
        nmf.resolverFactory.hooks.resolver.for('normal').tap('PostCompilePlugin', normalResolverGetter)
        // normalResolverGetter(nmf.getResolver('normal'))
      } else {
        normalResolverGetter(nmf.resolvers.normal)
      }
    }

    if (useHooks) {
      compiler.hooks.normalModuleFactory.tap('PostCompilePlugin', nmfGetter)
    } else {
      compiler.plugin('normal-module-factory', nmfGetter)
    }

    var run = function (compiler, callback) {
      if (called) return callback()
      called = true
      /* istanbul ignore if */
      if (compiler.compiler) {
        // fix https://github.com/webpack/webpack/pull/5739
        compiler = compiler.compiler
      }
      var entryPath = path.resolve(compiler.options.context, that.sourceDir)

      updateRules(compiler, that.pathsResult, entryPath, callback)
    }
    if (useHooks) {
      compiler.hooks.beforeRun.tapAsync('PostCompilePlugin', run)
      compiler.hooks.watchRun.tapAsync('PostCompilePlugin', run)
    } else {
      compiler.plugin(['before-run', 'watch-run'], run)
    }
  }

  return PostCompilePlugin
}
