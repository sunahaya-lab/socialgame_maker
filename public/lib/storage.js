(function () {
  function getScopedStorageKey(key, scope) {
    if (!scope) return key;
    return `${key}::scope:${scope}`;
  }

  function loadLocal(key, fallback, scope) {
    try {
      const raw = localStorage.getItem(getScopedStorageKey(key, scope));
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveLocal(key, data, scope) {
    try {
      localStorage.setItem(getScopedStorageKey(key, scope), JSON.stringify(data));
      return true;
    } catch (error) {
      console.warn("Failed to save local storage:", {
        key: getScopedStorageKey(key, scope),
        error
      });
      return false;
    }
  }

  function removeLocal(key, scope) {
    localStorage.removeItem(getScopedStorageKey(key, scope));
  }

  window.StorageLib = {
    getScopedStorageKey,
    loadLocal,
    saveLocal,
    removeLocal
  };
})();
