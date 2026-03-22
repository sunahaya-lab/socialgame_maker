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
    localStorage.setItem(getScopedStorageKey(key, scope), JSON.stringify(data));
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
