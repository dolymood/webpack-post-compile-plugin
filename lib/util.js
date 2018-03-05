var path = require('path')
var Module = require('module')
var load = require('load-pkg-config')

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
      var pkg = getPkg(context, name)
      if (pkg && dependencies.indexOf(pkg.modulePath) === -1) {
        var deps = pkg[key]
        if (deps) {
          collectDependencies(deps, dependencies, pkg.modulePath, key)
        }
        dependencies.push(pkg.modulePath)
      }
    }
  })
}

function getPkg (context, pkgName) {
  return load(pkgName || '.', context) || null
}
