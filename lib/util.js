var path = require('path')
var mm = require('micromatch')

function modifyPath(p, entryPath) {
  var basename = path.basename(p)
  return path.join(entryPath, basename)
}

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

module.exports = {
  modifyPath,
  moduleUsePostCompile,
  isPathMatch
}
