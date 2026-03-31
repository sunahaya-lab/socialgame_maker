(function () {
  function createAppAuthUtilsRuntime() {
    function getPlayerProfile(getPlayerState) {
      const profile = getPlayerState?.()?.profile;
      return profile && typeof profile === "object"
        ? profile
        : { displayName: "", birthday: "", userId: "", titles: [], activeTitleId: "" };
    }

    function isProfileSetupRequired() {
      return false;
    }

    function renderPanelStatus(message, isError = false) {
      const status = document.getElementById("auth-panel-status");
      if (!status) return;
      status.textContent = String(message || "");
      status.classList.toggle("is-error", Boolean(isError));
    }

    function setProfileStatus(message, isError = false) {
      const status = document.getElementById("auth-profile-status");
      if (!status) return;
      status.textContent = String(message || "");
      status.classList.toggle("is-error", Boolean(isError));
    }

    function clearProfileStatus() {
      setProfileStatus("", false);
    }

    function getApiErrorMessage(error, fallback) {
      const apiMessage = String(error?.data?.error || "").trim();
      if (apiMessage) return apiMessage;
      const message = String(error?.message || "").trim();
      return message || fallback;
    }

    function escapeHtml(value) {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    return {
      getPlayerProfile,
      isProfileSetupRequired,
      renderPanelStatus,
      setProfileStatus,
      clearProfileStatus,
      getApiErrorMessage,
      escapeHtml
    };
  }

  window.AppAuthUtilsRuntimeLib = {
    create: createAppAuthUtilsRuntime
  };
})();
