var util = require('./util')
var RuleSet = require('webpack/lib/RuleSet')
var path = require('path')

var defCompileDependenciesKey = 'compileDependencies'

function PostCompilePlugin (options) {
  if (!options) {
    options = {}
  }
  this.key = options.dependenciesKey || defCompileDependenciesKey
  this.initDependencies = options.compileDependencies || null
  this.sourceDir = options.sourceDir || 'src'
}

PostCompilePlugin.prototype.apply = function (compiler) {
  var that = this
  var called = false

  var run = function (compiler, callback) {
    if (called) return callback()
    called = true
    /* istanbul ignore if */
    if (compiler.compiler) {
      // fix https://github.com/webpack/webpack/pull/5739
      compiler = compiler.compiler
    }
    const entryPath = path.resolve(compiler.options.context, that.sourceDir)

    var dependencies = that._collectCompileDependencies(compiler)
    if (dependencies.length) {
      var rawRules = compiler.options.module.rules
      var ruleSet = new RuleSet(rawRules)
      var rules = ruleSet.rules
      rules && rules.forEach(function (rule, i) {
        updateRule(rule, dependencies, entryPath)
        if (rule.oneOf) {
          if (!Array.isArray(rule.oneOf)) {
            rule.oneOf = [rule.oneOf]
          }
          rule.oneOf.forEach(function (rule, i) {
            updateRule(rule, dependencies, entryPath)
          })
        }
      })
      compiler.options.module.rules = rules
    }
    callback()
  }
  if (compiler.hooks) {
    compiler.hooks.beforeRun.tapAsync('PostCompilePlugin', run)
    compiler.hooks.watchRun.tapAsync('PostCompilePlugin', run)
  } else {
    compiler.plugin(['before-run', 'watch-run'], run)
  }
}

function updateRule(rule, dependencies, entryPath) {
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
      ret = dependencies.some(function (dep) {
        return resource.indexOf(dep) === 0
      })
      if (ret) {
        // post compile true
        ret = _resource.call(this, modifyPath(resource, entryPath))
      }
      return ret
    }
  }
}

function modifyPath(p, entryPath) {
  const basename = path.basename(p)
  return path.join(entryPath, basename)
}

PostCompilePlugin.prototype._collectCompileDependencies = function (compiler) {
  var dependencies = []
  var context = compiler.options.context
  var initDependencies = this.initDependencies
  var usedAll = false
  if (!initDependencies) {
    // get app initDependencies
    var appPkg = util.getPkg(context)
    if (!appPkg) {
      return dependencies
    }
    initDependencies = appPkg[this.key]
    if (!initDependencies) {
      initDependencies = Object.keys(appPkg.dependencies || {})
      usedAll = true
    }
  }
  // collect dependencies in node_modules
  util.collectDependencies(initDependencies || [], dependencies, context, this.key, usedAll)
  return dependencies
}

module.exports = PostCompilePlugin
