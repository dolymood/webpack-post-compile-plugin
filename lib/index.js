var RuleSet = require('webpack/lib/RuleSet')
var path = require('path')
var mm = require('micromatch')

var defCompileDependenciesKey = 'compileDependencies'

function PostCompilePlugin (options) {
  if (!options) {
    options = {}
  }
  this.key = options.dependenciesKey || defCompileDependenciesKey
  this.initDependencies = options.compileDependencies || []
  this.handledCompilePkgs = {}
  this.pathsResult = {}
  this.sourceDir = options.sourceDir || 'src'
}

PostCompilePlugin.prototype.apply = function (compiler) {
  var that = this
  var called = false
  var useHooks = compiler.hooks

  var nmfGetter = function (nmf) {
    var normalResolver = useHooks ? nmf.getResolver('normal') : nmf.resolvers.normal
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
        var usePostCompile = moduleUsePostCompile(
          result.relativePath,
          postCompile
        )
        if (usePostCompile && result.path.match(/node_modules/)) {
          that.pathsResult[result.path] = true
        }
      }
      cb(null, result)
    }
    if (normalResolver.hooks) {
      normalResolver.hooks.result.tapAsync('PostCompilePlugin', function (result, resolveContext, cb) {
        resolveResultGetter(result, cb)
      })
    } else {
      normalResolver.plugin('result', resolveResultGetter)
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

    var rawRules = compiler.options.module.rules
    var ruleSet = new RuleSet(rawRules)
    var rules = ruleSet.rules
    rules && rules.forEach(function (rule, i) {
      updateRule(rule, that.pathsResult, entryPath)
      if (rule.oneOf) {
        if (!Array.isArray(rule.oneOf)) {
          rule.oneOf = [rule.oneOf]
        }
        rule.oneOf.forEach(function (rule, i) {
          updateRule(rule, that.pathsResult, entryPath)
        })
      }
    })
    compiler.options.module.rules = rules
    callback()
  }
  if (useHooks) {
    compiler.hooks.beforeRun.tapAsync('PostCompilePlugin', run)
    compiler.hooks.watchRun.tapAsync('PostCompilePlugin', run)
  } else {
    compiler.plugin(['before-run', 'watch-run'], run)
  }
}

function updateRule(rule, pathsResult, entryPath) {
  if (rule.enforce === 'pre') {
    return
  }
  if (rule.resource) {
    var _resource = rule.resource
    rule.resource = function (resource) {
      // check origional
      var ret = _resource.call(this, resource)
      if (ret) {
        return ret
      }
      // check dependencies
      ret = pathsResult[resource]
      if (ret) {
        // post compile true
        ret = _resource.call(this, modifyPath(resource, entryPath))
      }
      return !!ret
    }
  }
}

function modifyPath(p, entryPath) {
  var basename = path.basename(p)
  return path.join(entryPath, basename)
}

module.exports = PostCompilePlugin

function moduleUsePostCompile(moduleName, flagValue) {
  switch (typeof flagValue) {
    case 'undefined':
      return false
    case 'boolean':
      return flagValue
    case 'string':
      if (process.platform === 'win32') {
        flagValue = flagValue.replace(/\\/g, '/')
      }
      return mm.isMatch(moduleName, flagValue, {
        matchBase: true
      })
    case 'object':
      return flagValue.some(glob =>
        moduleUsePostCompile(moduleName, glob)
      )
  }
}
