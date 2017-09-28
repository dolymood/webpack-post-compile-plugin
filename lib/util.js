var path = require('path')
var Module = require('module')

module.exports = {
  getPkg: getPkg,
  collectDependencies: collectDependencies
}

function collectDependencies (names, dependencies, context, key) {
  if (!Array.isArray(names)) {
    names = [names]
  }
  names.forEach(function (name) {
    if (name) {
      var modulePath = getModulePath(name, context)
      var pkg = loadPkg(name, context, modulePath)
      if (pkg && modulePath && dependencies.indexOf(modulePath) === -1) {
        var deps = pkg[key]
        if (deps) {
          collectDependencies(deps, dependencies, modulePath, key)
        }
        dependencies.push(modulePath)
      }
    }
  })
}

function getPkg (context, pkgName) {
  var pkg
  if (!pkgName) {
    try {
      pkg = require(path.resolve(context, 'package.json'))
    } catch (e) {}
  } else {
    pkg = loadPkg(pkgName, context)
  }
  return pkg || null
}

function getNodeModulePath (pkgName, relative) {
  var relativeMod = new Module()
  var filename = path.join(relative, './')
  relativeMod.id = filename
  relativeMod.filename = filename
  relativeMod.paths = Module._nodeModulePaths(relative)

  try {
    return Module._resolveFilename(pkgName, relativeMod)
  } catch (err) {
    return null
  }
}
function getModulePath (pkgName, relative) {
  var modulePath = getNodeModulePath(pkgName, relative)
  if (modulePath) {
    pkgName = path.join('node_modules', pkgName)
    modulePath = modulePath.substr(0, modulePath.lastIndexOf(pkgName) + pkgName.length)
  }
  return modulePath
}
function loadPkg (pkgName, relative, modulePath) {
  if (!modulePath) {
    modulePath = getModulePath(pkgName, relative)
  }
  var m = null
  if (modulePath) {
    try {
      m = require(path.resolve(modulePath, 'package.json'))
    } catch (e) {
      /* istanbul ignore if */
      if (e.message !== 'missing path') {
        console.log(e)
      }
    }
  }
  return m
}
