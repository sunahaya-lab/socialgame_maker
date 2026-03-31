(function () {
  function createAuthPanelUi() {
    const authText = window.AuthUiTextLib || null;

    function text(key, fallback = "") {
      return authText?.get?.(key, fallback) || fallback;
    }

    function ensureButton(openPanel) {
      const host = document.querySelector(".home-topbar-left");
      if (!host || document.getElementById("auth-open-btn")) return;
      const wrap = document.createElement("div");
      wrap.className = "auth-toolbar";
      wrap.innerHTML = `
        <button type="button" class="auth-open-btn" id="auth-open-btn" aria-label="${text("buttonAriaLabel", "Open user profile")}">
          <span class="auth-open-icon" aria-hidden="true">👤</span>
          <span class="auth-open-label" id="auth-open-label">${text("guest", "Guest")}</span>
        </button>
      `;
      host.appendChild(wrap);
      wrap.querySelector("#auth-open-btn")?.addEventListener("click", openPanel);
    }

    function ensurePanel(handlers) {
      const host = document.body;
      if (!host || document.getElementById("auth-panel")) return;
      const panel = document.createElement("section");
      panel.id = "auth-panel";
      panel.className = "auth-panel";
      panel.setAttribute("aria-hidden", "true");
      panel.innerHTML = authText?.panelMarkup?.() || "";
      host.appendChild(panel);
      panel.addEventListener("click", event => {
        if (event.target === panel) handlers.closePanel?.();
      });
      panel.querySelector(".auth-panel-card")?.addEventListener("click", event => {
        event.stopPropagation();
      });
      panel.querySelector("[data-auth-close]")?.addEventListener("click", handlers.closePanel);
      panel.querySelector("#auth-close-btn")?.addEventListener("click", handlers.closePanel);
      panel.querySelector("#auth-login-form")?.addEventListener("submit", handlers.handleLogin);
      panel.querySelector("#auth-register-form")?.addEventListener("submit", handlers.handleRegister);
      panel.querySelector("#auth-profile-form")?.addEventListener("submit", handlers.handleProfileSave);
      panel.querySelector("#auth-profile-title-select")?.addEventListener("change", handlers.handleActiveTitleChange);
      panel.querySelector("#auth-logout-btn")?.addEventListener("click", handlers.handleLogout);
      panel.querySelector("#auth-summary-detail-toggle")?.addEventListener("click", handlers.toggleSummaryDetails);
      panel.querySelector("#auth-profile-toggle")?.addEventListener("click", handlers.toggleProfileEditor);
    }

    return {
      ensureButton,
      ensurePanel
    };
  }

  window.AuthPanelUiLib = {
    create: createAuthPanelUi
  };
})();
