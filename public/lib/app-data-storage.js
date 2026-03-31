(function () {
  function createAppDataStorageModule(deps) {
    const {
      apiGet,
      apiPost,
      getCurrentPlayerId,
      getCurrentProjectId,
      getAuthenticatedUserId,
      storageLoadLocal,
      storageSaveLocal,
      storageGetScopedStorageKey,
    } = deps;

    function mergeCollectionState(remoteItems, localItems) {
      const merged = [];
      const seenIds = new Set();

      [...(Array.isArray(remoteItems) ? remoteItems : []), ...(Array.isArray(localItems) ? localItems : [])].forEach(item => {
        if (!item || !item.id || seenIds.has(item.id)) return;
        seenIds.add(item.id);
        merged.push(item);
      });

      return merged;
    }

    async function fetchJSON(url) {
      return apiGet(url);
    }

    async function postJSON(url, data) {
      const currentUserId = String(getCurrentPlayerId?.() || "").trim();
      let nextUrl = url;
      if (currentUserId) {
        try {
          const resolved = new URL(String(url || ""), location.origin);
          if (!resolved.searchParams.get("user")) {
            resolved.searchParams.set("user", currentUserId);
          }
          nextUrl = resolved.pathname + resolved.search + resolved.hash;
        } catch {
          nextUrl = String(url || "");
        }
      }
      const payload = currentUserId && data && typeof data === "object" && !Array.isArray(data) && !data.userId
        ? { ...data, userId: currentUserId }
        : data;
      return apiPost(nextUrl, payload);
    }

    function getDataScope() {
      const projectId = String(getCurrentProjectId?.() || "").trim();
      return projectId ? `project:${projectId}` : null;
    }

    function getPlayerIdentityScope() {
      const authenticated = String(getAuthenticatedUserId?.() || "").trim();
      return authenticated ? `viewer:${authenticated}` : "viewer";
    }

    function getProjectRegistryScope() {
      const authenticated = String(getAuthenticatedUserId?.() || "").trim();
      return authenticated ? `projects:${authenticated}` : "projects";
    }

    function getScopedStorageKey(key) {
      return storageGetScopedStorageKey(key, getDataScope());
    }

    function loadLegacyPlayerStateFallback(fallback) {
      const sentinel = { __missing: true };
      const scopes = [
        null,
        getPlayerIdentityScope(),
        String(getCurrentPlayerId?.() || "").trim() || null
      ].filter((scope, index, list) => scope !== undefined && list.indexOf(scope) === index);

      for (const scope of scopes) {
        const candidate = storageLoadLocal("socia-player-state", sentinel, scope);
        if (candidate !== sentinel) {
          storageSaveLocal("socia-player-state", candidate, getDataScope());
          return candidate;
        }
      }
      return fallback;
    }

    function loadLocal(key, fallback) {
      if (key === "socia-characters") return fallback;
      const scopedValue = storageLoadLocal(key, fallback, getDataScope());
      if (key !== "socia-player-state") return scopedValue;
      if (scopedValue !== fallback) return scopedValue;
      return loadLegacyPlayerStateFallback(fallback);
    }

    function saveLocal(key, data) {
      if (key === "socia-characters") {
        try {
          localStorage.removeItem(getScopedStorageKey(key));
          localStorage.removeItem(key);
        } catch {}
        return true;
      }
      storageSaveLocal(key, data, getDataScope());
      return true;
    }

    function clearCharactersLocalCache() {
      try {
        localStorage.removeItem(getScopedStorageKey("socia-characters"));
        localStorage.removeItem("socia-characters");
      } catch {}
    }

    function loadProjectRegistry(key, fallback) {
      return storageLoadLocal(key, fallback, getProjectRegistryScope());
    }

    function saveProjectRegistry(key, data) {
      storageSaveLocal(key, data, getProjectRegistryScope());
    }

    return {
      mergeCollectionState,
      fetchJSON,
      postJSON,
      getDataScope,
      getPlayerIdentityScope,
      getProjectRegistryScope,
      getScopedStorageKey,
      loadLocal,
      saveLocal,
      clearCharactersLocalCache,
      loadProjectRegistry,
      saveProjectRegistry,
    };
  }

  window.AppDataStorageLib = {
    create: createAppDataStorageModule
  };
})();
