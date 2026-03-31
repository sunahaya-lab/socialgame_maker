(function () {
  function createAppAuthPanelRuntime(deps) {
    const {
      text,
      escapeHtml,
      getPanelMarkup,
      openPanel,
      closePanel,
      handleLogin,
      handleRegister,
      handleProfileSave,
      handleActiveTitleChange,
      handleLogout,
      toggleSummaryDetails,
      toggleProfileEditor,
      isEscBound,
      setEscBound
    } = deps;

    function ensureAuthButton() {
      const host = document.querySelector(".home-topbar-left");
      if (!host || document.getElementById("auth-open-btn")) return;
      const wrap = document.createElement("div");
      wrap.className = "auth-toolbar";
      wrap.innerHTML = `
        <button type="button" class="auth-open-btn" id="auth-open-btn" aria-label="${escapeHtml(text("buttonAriaLabel", "Open user profile"))}">
          <span class="auth-open-icon" aria-hidden="true">&#128100;</span>
          <span class="auth-open-label" id="auth-open-label">${escapeHtml(text("guest", "Guest"))}</span>
        </button>
      `;
      host.appendChild(wrap);
      wrap.querySelector("#auth-open-btn")?.addEventListener("click", openPanel);
    }

    function ensureAuthPanel() {
      const host = document.body;
      if (!host || document.getElementById("auth-panel")) return;
      const panel = document.createElement("section");
      panel.id = "auth-panel";
      panel.className = "auth-panel";
      panel.setAttribute("aria-hidden", "true");
      panel.innerHTML = getPanelMarkup() || "";
      host.appendChild(panel);

      panel.addEventListener("click", event => {
        if (event.target === panel) closePanel();
      });
      panel.querySelector(".auth-panel-card")?.addEventListener("click", event => {
        event.stopPropagation();
      });
      panel.querySelector("[data-auth-close]")?.addEventListener("click", closePanel);
      panel.querySelector("#auth-close-btn")?.addEventListener("click", closePanel);
      panel.querySelector("#auth-login-form")?.addEventListener("submit", handleLogin);
      panel.querySelector("#auth-register-form")?.addEventListener("submit", handleRegister);
      panel.querySelector("#auth-profile-form")?.addEventListener("submit", handleProfileSave);
      panel.querySelector("#auth-profile-title-select")?.addEventListener("change", handleActiveTitleChange);
      panel.querySelector("#auth-logout-btn")?.addEventListener("click", handleLogout);
      panel.querySelector("#auth-summary-detail-toggle")?.addEventListener("click", toggleSummaryDetails);
      panel.querySelector("#auth-profile-toggle")?.addEventListener("click", toggleProfileEditor);
    }

    function bindEscClose() {
      if (isEscBound()) return;
      document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;
        const panel = document.getElementById("auth-panel");
        if (!panel || !panel.classList.contains("is-open")) return;
        closePanel();
      });
      setEscBound(true);
    }

    return {
      ensureAuthButton,
      ensureAuthPanel,
      bindEscClose
    };
  }

  window.AppAuthPanelRuntimeLib = {
    create: createAppAuthPanelRuntime
  };
})();
