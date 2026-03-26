(function () {
  function resolvePath(root, path) {
    if (!path) return undefined;
    return String(path)
      .split(".")
      .filter(Boolean)
      .reduce((current, key) => current?.[key], root);
  }

  function defaultResolveDynamicAsset(key, runtime) {
    if (key === "homeBg") return runtime.state?.home?.backgroundImage || "";
    if (key === "gachaHero1") return runtime.state?.gacha?.activeHeroImages?.[0] || "";
    if (key === "gachaHero2") return runtime.state?.gacha?.activeHeroImages?.[1] || "";
    if (key === "gachaHero3") return runtime.state?.gacha?.activeHeroImages?.[2] || "";
    return "";
  }

  function createLayoutRuntime(options) {
    const runtime = {
      state: options?.state || {},
      theme: options?.theme || null,
      assetMap: options?.assetMap || {},
      resolveBind(path) {
        return resolvePath(runtime.state, path);
      },
      resolveAsset(assetId) {
        if (!assetId) return "";
        if (assetId.startsWith("asset:")) {
          return runtime.assetMap[assetId.slice(6)]?.src || "";
        }
        if (assetId.startsWith("bind:")) {
          return String(runtime.resolveBind(assetId.slice(5)) || "");
        }
        if (assetId.startsWith("dynamic:")) {
          const resolver = typeof options?.resolveDynamicAsset === "function" ? options.resolveDynamicAsset : defaultResolveDynamicAsset;
          return String(resolver(assetId.slice(8), runtime) || "");
        }
        return String(assetId || "");
      },
      dispatchAction(action, event) {
        if (typeof options?.dispatchAction === "function") {
          options.dispatchAction(action, event, runtime);
        }
      }
    };
    return runtime;
  }

  window.LayoutRuntimeLib = {
    resolvePath,
    createLayoutRuntime
  };
})();
