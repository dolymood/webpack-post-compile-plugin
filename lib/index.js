var util = require('./util')
var RuleSet = require('webpack/lib/RuleSet')

var defCompileDependenciesKey = 'compileDependencies'

function PostCompilePlugin (options) {
  if (!options) {
    options = {}
  }
  this.key = options.dependenciesKey || defCompileDependenciesKey
  this.initDependencies = options.compileDependencies || null
}

PostCompilePlugin.prototype.apply = function (compiler) {
  var that = this
  var called = false
  compiler.plugin(['before-run', 'watch-run'], function (compiler, callback) {
    if (called) return callback()
    called = true
    /* istanbul ignore if */
    if (compiler.compiler) {
      // fix https://github.com/webpack/webpack/pull/5739
      compiler = compiler.compiler
    }
    var dependencies = that._collectCompileDependencies(compiler)
    if (dependencies.length) {
      var rawRules = compiler.options.module.rules
      var ruleSet = new RuleSet(rawRules)
      var rules = ruleSet.rules
      rules && rules.forEach(function (rule, i) {
        var _rule = rawRules[i]
        updateRule(rule, dependencies, _rule)
        if (rule.oneOf) {
          if (!Array.isArray(rule.oneOf)) {
            rule.oneOf = [rule.oneOf]
          }
          rule.oneOf.forEach(function (rule, i) {
            updateRule(rule, dependencies, _rule.oneOf[i])
          })
        }
      })
      compiler.options.module.rules = rules
    }
    callback()
  })
}

function updateRule(rule, dependencies, rowRule) {
  if (rule.enforce === 'pre') {
    return
  }
  var test = rowRule.test
  if (test && !Array.isArray(test)) {
    test = [test]
  }
  if (rule.resource) {
    var _resource = rule.resource
    rule.resource = function (resource) {
      var ret
      // check test
      if (test) {
        ret = test.some(function (condition) {
          return condition.test(resource)
        })
      }
      if (ret === false) {
        // test false
        return ret
      }
      ret = _resource.call(this, resource)
      if (ret === false) {
        // check dependencies
        ret = dependencies.some(function (dep) {
          return resource.indexOf(dep) === 0
        })
      }
      return ret
    }
  }
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
  util.collectDependencies(initDependencies, dependencies, context, this.key, usedAll)
  return dependencies
}

module.exports = PostCompilePlugin
