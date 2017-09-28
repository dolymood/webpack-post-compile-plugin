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
  compiler.plugin('before-run', function (compiler, callback) {
    var dependencies = that._collectCompileDependencies(compiler)
    if (dependencies.length) {
      var rules = compiler.options.module.rules
      rules && rules.forEach(function (rule) {
        if (rule.include) {
          rule.include = rule.include.concat(dependencies)
        }
      })
    }
    callback()
  })
}

PostCompilePlugin.prototype._collectCompileDependencies = function (compiler) {
  var dependencies = []
  var context = compiler.options.context
  var initDependencies = this.initDependencies
  if (!initDependencies) {
    var pkg = util.getPkg(context)
    if (pkg) {
      initDependencies = pkg[this.key]
    }
  }
  // collect dependencies in node_modules
  util.collectDependencies(initDependencies, dependencies, context, this.key)
  return dependencies
}

module.exports = PostCompilePlugin
