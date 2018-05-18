var util = require('./util')

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
      var rules = compiler.options.module.rules
      rules && rules.forEach(function (rule) {
        updateRule(rule, dependencies)
        if (rule.oneOf) {
          if (!Array.isArray(rule.oneOf)) {
            rule.oneOf = [rule.oneOf]
          }
          rule.oneOf.forEach(function (rule) {
            updateRule(rule, dependencies)
          })
        }
      })
    }
    callback()
  })
}

function updateRule(rule, dependencies) {
  if (rule.include) {
    if (!Array.isArray(rule.include)) {
      rule.include = [rule.include]
    }
    rule.include = rule.include.concat(dependencies)
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
