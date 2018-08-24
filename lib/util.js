var load = require('load-pkg-config')

module.exports = {
  getPkg: getPkg,
  collectDependencies: collectDependencies
}

function collectDependencies (names, dependencies, context, key, isAll) {
  if (!Array.isArray(names)) {
    names = [names]
  }
  names.forEach(function (name) {
    if (name) {
      var pkg = getPkg(context, name)
      if (pkg && dependencies.indexOf(pkg.modulePath) === -1) {
        var deps = pkg[key]
        var getFromAll = false
        if (!deps && pkg.postCompile) {
          deps = Object.keys(pkg.dependencies || {})
          getFromAll = true
        }
        if (deps) {
          collectDependencies(deps, dependencies, pkg.modulePath, key, getFromAll)
        }
        if (isAll) {
          if (pkg.postCompile) {
            dependencies.push(pkg.modulePath)
          }
        } else {
          dependencies.push(pkg.modulePath)
        }
      }
    }
  })
}

function getPkg (context, pkgName) {
  return load(pkgName || '.', context) || null
}
