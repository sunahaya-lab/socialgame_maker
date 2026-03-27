(function () {
  const APP_MODES = Object.freeze({
    play: "play",
    edit: "edit",
    admin: "admin"
  });

  function normalizeAppMode(mode) {
    const value = String(mode || "").trim().toLowerCase();
    if (value === APP_MODES.edit) return APP_MODES.edit;
    if (value === APP_MODES.admin) return APP_MODES.admin;
    return APP_MODES.play;
  }

  function isPlayMode(mode) {
    return normalizeAppMode(mode) === APP_MODES.play;
  }

  function isEditMode(mode) {
    return normalizeAppMode(mode) === APP_MODES.edit;
  }

  function isAdminMode(mode) {
    return normalizeAppMode(mode) === APP_MODES.admin;
  }

  window.AppModeLib = {
    MODES: APP_MODES,
    normalizeAppMode,
    isPlayMode,
    isEditMode,
    isAdminMode
  };
})();
