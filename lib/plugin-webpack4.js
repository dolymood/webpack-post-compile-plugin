var RuleSet = require('webpack/lib/RuleSet')
var util = require('./util')
var createPostCompilePlugin = require('./plugin')

const PostCompilePlugin = createPostCompilePlugin(updateRules)

function updateRules (compiler, pathsResult, entryPath, callback) {
  var rawRules = compiler.options.module.rules
  var ruleSet = new RuleSet(rawRules)
  var rules = ruleSet.rules
  rules && rules.forEach(function (rule, i) {
    updateRule(rule, pathsResult, entryPath)
    if (rule.oneOf) {
      if (!Array.isArray(rule.oneOf)) {
        rule.oneOf = [rule.oneOf]
      }
      rule.oneOf.forEach(function (rule, i) {
        updateRule(rule, pathsResult, entryPath)
      })
    }
  })
  compiler.options.module.rules = rules
  callback()
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
        ret = _resource.call(this, util.modifyPath(resource, entryPath))
      }
      return !!ret
    }
  }
}

module.exports = PostCompilePlugin
