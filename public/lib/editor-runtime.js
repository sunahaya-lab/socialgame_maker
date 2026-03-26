(function () {
  function createEditorRuntimeModule(deps) {
    const {
      getCurrentScreen,
      getEditorScreen,
      closeHomeEditMode,
      showToast
    } = deps;

    function setupEditorOverlay() {
      const overlay = document.getElementById("screen-editor");
      let closeButton = document.getElementById("editor-overlay-close");
      if (!overlay) return;
      overlay.classList.add("editor-overlay");
      overlay.hidden = true;
      let shell = overlay.querySelector(".editor-overlay-shell");
      if (!shell) {
        shell = document.createElement("div");
        shell.className = "editor-overlay-shell";
        while (overlay.firstChild) {
          shell.appendChild(overlay.firstChild);
        }
        overlay.appendChild(shell);
      }

      if (!closeButton) {
        const header = shell.querySelector(".screen-header");
        if (header) {
          closeButton = document.createElement("button");
          closeButton.type = "button";
          closeButton.id = "editor-overlay-close";
          closeButton.className = "editor-overlay-close";
          closeButton.setAttribute("aria-label", "閉じる");
          closeButton.title = "閉じる";
          closeButton.innerHTML = "&#x2715;";
          header.appendChild(closeButton);
        }
      }

      closeButton?.addEventListener("click", closeEditorScreen);
      overlay.addEventListener("click", event => {
        const tab = event.target.closest(".editor-tab");
        if (tab) {
          event.preventDefault();
          getEditorScreen()?.activateEditorTab?.(tab.dataset.editorTab || "base-char");
          return;
        }
        const close = event.target.closest("#editor-overlay-close");
        if (close) {
          event.preventDefault();
          closeEditorScreen();
          return;
        }
      });
      overlay.addEventListener("click", event => {
        if (event.target === overlay || event.target === shell) closeEditorScreen();
      });
      document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !overlay.hidden) closeEditorScreen();
      });
    }

    function disableLegacyEditorUi() {
      const editorScreenEl = document.getElementById("screen-editor");
      if (editorScreenEl) {
        editorScreenEl.hidden = true;
        editorScreenEl.classList.remove("active");
        editorScreenEl.setAttribute("aria-hidden", "true");
      }

      document.querySelectorAll('[data-go="editor"]').forEach(button => {
        button.hidden = true;
        button.setAttribute("aria-hidden", "true");
      });
    }

    function bindEditorOverlayTabs() {
      document.querySelectorAll("#screen-editor .editor-tab").forEach(tab => {
        tab.type = "button";
        tab.onclick = event => {
          event.preventDefault();
          event.stopPropagation();
          getEditorScreen()?.activateEditorTab?.(tab.dataset.editorTab || "base-char");
        };
      });
    }

    function openEditorSurface(tabName = null, screen = getCurrentScreen()) {
      if (screen === "home") {
        return closeHomeEditMode?.() || null;
      }
      return openEditorScreen(tabName);
    }

    function openEditorScreen(tabName = null) {
      showToast("エディターは再設計中のため現在は無効です。");
      return null;
    }

    function closeEditorScreen() {
      const overlay = document.getElementById("screen-editor");
      if (!overlay) return;
      overlay.classList.remove("active");
      overlay.setAttribute("aria-hidden", "true");
      overlay.hidden = true;
    }

    return {
      setupEditorOverlay,
      disableLegacyEditorUi,
      bindEditorOverlayTabs,
      openEditorSurface,
      openEditorScreen,
      closeEditorScreen
    };
  }

  window.EditorRuntimeLib = {
    create: createEditorRuntimeModule
  };
})();
