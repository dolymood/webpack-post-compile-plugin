var util = require('./util')
var createPostCompilePlugin = require('./plugin')

const PostCompilePlugin = createPostCompilePlugin(updateRules)

function updateRules(compiler, pathsResult, entryPath, callback) {
  var ruleSetExec = function(data) {
    var ruleSet = data.ruleSet
    var _ruleSetExec = ruleSet.exec
    var effects = []

    ruleSet.exec = function (data) {
      effects = _ruleSetExec.call(this, data)

      // post compile true
      if (pathsResult[data.resource]) {
        effects = _ruleSetExec.call(this, Object.assign(data, {
          resource: util.modifyPath(data.resource, entryPath)
        })).filter(function(r) {
          return r.type !== 'use-pre'
        })
      }
      return effects
    }
  }
  if (compiler.hooks) {
    compiler.hooks.normalModuleFactory.tap('PostCompilePlugin', ruleSetExec)
  }
  callback()
}

module.exports = PostCompilePlugin
