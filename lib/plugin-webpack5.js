var RuleSetCompiler = require('webpack/lib/rules/RuleSetCompiler')
var BasicEffectRulePlugin = require('webpack/lib/rules/BasicEffectRulePlugin')
var BasicMatcherRulePlugin = require('webpack/lib/rules/BasicMatcherRulePlugin')
var DescriptionDataMatcherRulePlugin = require('webpack/lib/rules/DescriptionDataMatcherRulePlugin')
var UseEffectRulePlugin = require('webpack/lib/rules/UseEffectRulePlugin')
var path = require('path')
var mm = require('micromatch')

var defCompileDependenciesKey = 'compileDependencies'
new RuleSetCompiler([
  new BasicMatcherRulePlugin('test', 'resource'),
  new BasicMatcherRulePlugin('mimetype'),
  new BasicMatcherRulePlugin('dependency'),
  new BasicMatcherRulePlugin('include', 'resource'),
  new BasicMatcherRulePlugin('exclude', 'resource', true),
  new BasicMatcherRulePlugin('conditions'),
  new BasicMatcherRulePlugin('resource'),
  new BasicMatcherRulePlugin('resourceQuery'),
  new BasicMatcherRulePlugin('resourceFragment'),
  new BasicMatcherRulePlugin('realResource'),
  new BasicMatcherRulePlugin('issuer'),
  new BasicMatcherRulePlugin('compiler'),
  new DescriptionDataMatcherRulePlugin(),
  new BasicEffectRulePlugin('type'),
  new BasicEffectRulePlugin('sideEffects'),
  new BasicEffectRulePlugin('parser'),
  new BasicEffectRulePlugin('resolve'),
  new BasicEffectRulePlugin('generator'),
  new UseEffectRulePlugin()
])

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
          postCompile = isPathMatch(result.path, that.compilePaths)
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

    nmf.resolverFactory.hooks.resolver.for('normal').tap('PostCompilePlugin', function(resolver) {
      resolver.hooks.result.tapAsync('PostCompilePlugin', function (result, resolveContext, cb) {
        resolveResultGetter(result, cb)
      })
    })
  }

  if (useHooks) {
    compiler.hooks.normalModuleFactory.tap('PostCompilePlugin', nmfGetter)
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
    updateRuleSetExec(compiler, that.pathsResult, entryPath)
    callback()
  }

  if (useHooks) {
    compiler.hooks.beforeRun.tapAsync('PostCompilePlugin', run)
    compiler.hooks.watchRun.tapAsync('PostCompilePlugin', run)
  }
}

function updateRuleSetExec(compiler, pathsResult, entryPath) {
  var ruleSetExec = function(data) {
    var ruleSet = data.ruleSet
    var _ruleSetExec = ruleSet.exec
    var effects = []

    ruleSet.exec = function (data) {
      effects = _ruleSetExec.call(this, data)

      // post compile true
      if (pathsResult[data.resource]) {
        effects = _ruleSetExec.call(this, Object.assign(data, {
          resource: modifyPath(data.resource, entryPath)
        }))
      }
      return effects
    }
  }
  if (compiler.hooks) {
    compiler.hooks.normalModuleFactory.tap('PostCompilePlugin', ruleSetExec)
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

function isPathMatch(resultPath, includePath) {
  for (var i = 0; i < includePath.length; i++) {
    if (mm.contains(resultPath, includePath[i].replace(/\\/g, '/'))) {
      return true
    }
  }
  return false
}
