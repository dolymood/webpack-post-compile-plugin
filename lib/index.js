const path = require("path");
const mm = require("micromatch");
const cachedMerge = require("webpack/lib/util/cachedMerge");
const SingleEntryDependency = require("webpack/lib/dependencies/SingleEntryDependency");
const asyncLib = require("neo-async");

const loaderToIdent = data => {
  if (!data.options) {
    return data.loader;
  }
  if (typeof data.options === "string") {
    return data.loader + "?" + data.options;
  }
  if (typeof data.options !== "object") {
    throw new Error("loader options must be string or object");
  }
  if (data.ident) {
    return data.loader + "??" + data.ident;
  }
  return data.loader + "?" + JSON.stringify(data.options);
};

const identToLoaderRequest = resultString => {
  const idx = resultString.indexOf("?");
  if (idx >= 0) {
    const loader = resultString.substr(0, idx);
    const options = resultString.substr(idx + 1);
    return {
      loader,
      options
    };
  } else {
    return {
      loader: resultString,
      options: undefined
    };
  }
};

class PostCompilePlugin {
  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap("PostCompilePlugin", nmf => {
      let entryFilePath = path.resolve(compiler.options.context, 'src')
      let gotEntry = false
      nmf.hooks.afterResolve.tapAsync("PostCompilePlugin", (data, callback) => {
        const resolveData = data.resourceResolveData
        if (!gotEntry && !resolveData.context.compiler) {
          let entryDep
          data.dependencies.some(dep => {
            if (dep instanceof SingleEntryDependency) {
              entryDep = dep
              return true
            }
          })
          if (entryDep) {
            entryFilePath = path.dirname(data.resource)
            gotEntry = true
          }
        }
        if (
          resolveData &&
          resolveData.descriptionFileData &&
          resolveData.relativePath
        ) {
          const postCompile = resolveData.descriptionFileData.postCompile
          const usePostCompile = PostCompilePlugin.moduleUsePostCompile(
            resolveData.relativePath,
            postCompile
          )
          if (usePostCompile && data.resource.match(/node_modules/)) {
            const originData = {
              context: data.context,
              resolveOptions: data.resolveOptions,
              contextInfo: resolveData.context,
              request: data.rawRequest
            }
            const contextInfo = originData.contextInfo;
            const context = originData.context;
            const request = originData.request;

            const loaderResolver = nmf.getResolver("loader");
            const normalResolver = nmf.getResolver("normal", originData.resolveOptions);

            let matchResource = undefined;
            let requestWithoutMatchResource = request;
            const MATCH_RESOURCE_REGEX = /^([^!]+)!=!/;
            const matchResourceMatch = MATCH_RESOURCE_REGEX.exec(request);
            if (matchResourceMatch) {
              matchResource = matchResourceMatch[1];
              if (/^\.\.?\//.test(matchResource)) {
                matchResource = path.join(context, matchResource);
              }
              requestWithoutMatchResource = request.substr(
                matchResourceMatch[0].length
              );
            }

            const noPreAutoLoaders = requestWithoutMatchResource.startsWith("-!");
            const noAutoLoaders =
              noPreAutoLoaders || requestWithoutMatchResource.startsWith("!");
            const noPrePostAutoLoaders = requestWithoutMatchResource.startsWith("!!");
            let elements = requestWithoutMatchResource
              .replace(/^-?!+/, "")
              .replace(/!!+/g, "!")
              .split("!");
            let resource = elements.pop();
            elements = elements.map(identToLoaderRequest);

            asyncLib.parallel(
              [
                callback =>
                  nmf.resolveRequestArray(
                    contextInfo,
                    context,
                    elements,
                    loaderResolver,
                    callback
                  )
              ],
              (err, results) => {
                if (err) return callback(err);
                let loaders = results[0];
                const resourceResolveData = resolveData;
                resource = data.resource;

                // translate option idents
                try {
                  for (const item of loaders) {
                    if (typeof item.options === "string" && item.options[0] === "?") {
                      const ident = item.options.substr(1);
                      item.options = nmf.ruleSet.findOptionsByIdent(ident);
                      item.ident = ident;
                    }
                  }
                } catch (e) {
                  return callback(e);
                }

                const userRequest =
                  (matchResource !== undefined ? `${matchResource}!=!` : "") +
                  loaders
                    .map(loaderToIdent)
                    .concat([resource])
                    .join("!");

                let resourcePath =
                  matchResource !== undefined ? matchResource : resource;
                let resourceQuery = "";
                const queryIndex = resourcePath.indexOf("?");
                if (queryIndex >= 0) {
                  resourceQuery = resourcePath.substr(queryIndex);
                  resourcePath = resourcePath.substr(0, queryIndex);
                }
                const modifyPath = (p) => {
                  const basename = path.basename(p)
                  return path.join(entryFilePath, basename)
                }
                const result = nmf.ruleSet.exec({
                  resource: modifyPath(resourcePath),
                  realResource: modifyPath(matchResource !== undefined
                      ? resource.replace(/\?.*/, "")
                      : resourcePath),
                  resourceQuery,
                  issuer: contextInfo.issuer,
                  compiler: contextInfo.compiler
                });
                const settings = {};
                const useLoadersPost = [];
                const useLoaders = [];
                for (const r of result) {
                  if (r.type === "use") {
                    if (r.enforce === "post" && !noPrePostAutoLoaders) {
                      useLoadersPost.push(r.value);
                    } else if (
                      !r.enforce &&
                      !noAutoLoaders &&
                      !noPrePostAutoLoaders
                    ) {
                      useLoaders.push(r.value);
                    }
                  } else if (
                    typeof r.value === "object" &&
                    r.value !== null &&
                    typeof settings[r.type] === "object" &&
                    settings[r.type] !== null
                  ) {
                    settings[r.type] = cachedMerge(settings[r.type], r.value);
                  } else {
                    settings[r.type] = r.value;
                  }
                }
                asyncLib.parallel(
                  [
                    nmf.resolveRequestArray.bind(
                      nmf,
                      contextInfo,
                      nmf.context,
                      useLoadersPost,
                      loaderResolver
                    ),
                    nmf.resolveRequestArray.bind(
                      nmf,
                      contextInfo,
                      nmf.context,
                      useLoaders,
                      loaderResolver
                    )
                  ],
                  (err, results) => {
                    if (err) return callback(err);
                    loaders = results[0].concat(loaders, results[1]);

                    const defaultLoaders = data.loaders
                    const targetLoaders = defaultLoaders
                    for (const r of loaders) {
                      const hasInDefault = defaultLoaders.some((_r, index) => {
                        return _r.loader === r.loader
                      })
                      if (!hasInDefault) {
                        targetLoaders.push(r)
                      }
                    }
                    loaders = targetLoaders

                    const type = settings.type;
                    const resolveOptions = settings.resolve;
                    Object.assign(data, {
                      request: loaders
                        .map(loaderToIdent)
                        .concat([resource])
                        .join("!"),
                      dependencies: data.dependencies,
                      userRequest,
                      loaders,
                      resource,
                      matchResource,
                      settings,
                      type,
                      parser: nmf.getParser(type, settings.parser),
                      generator: nmf.getGenerator(type, settings.generator),
                      resolveOptions
                    })
                    callback(null, data);
                  }
                );
              }
            );
            return;
          }
        }
        callback(null, data);
      })
    })
  }

  static moduleUsePostCompile(moduleName, flagValue) {
    switch (typeof flagValue) {
      case "undefined":
        return false;
      case "boolean":
        return flagValue;
      case "string":
        if (process.platform === "win32") {
          flagValue = flagValue.replace(/\\/g, "/")
        }
        return mm.isMatch(moduleName, flagValue, {
          matchBase: true
        });
      case "object":
        return flagValue.some(glob =>
          PostCompilePlugin.moduleUsePostCompile(moduleName, glob)
        );
    }
  }
}

module.exports = PostCompilePlugin
