(function () {
  function createEditorRuntimeModule(deps) {
    const {
      getCurrentScreen,
      setCurrentScreen,
      getEditorScreen,
      closeHomeEditMode,
      renderHome,
      showToast
    } = deps;

    function getEditorApiMethod(name) {
      const editorScreen = getEditorScreen?.();
      const legacyMethod = editorScreen?.__legacyApi?.[name];
      if (typeof legacyMethod === "function") return legacyMethod;
      const method = editorScreen?.[name];
      return typeof method === "function" ? method.bind(editorScreen) : null;
    }

    function setBottomNavActive(screen) {
      document.querySelectorAll(".bottom-nav-btn").forEach(button => {
        button.classList.toggle("active", button.dataset.go === screen);
      });
    }

    function showEditorScreen() {
      const overlay = document.getElementById("screen-editor");
      if (!overlay) return null;
      document.querySelectorAll(".screen").forEach(screenEl => {
        screenEl.classList.remove("active");
      });
      overlay.hidden = false;
      overlay.classList.add("active");
      overlay.setAttribute("aria-hidden", "false");
      setCurrentScreen?.("editor");
      setBottomNavActive("");
      return overlay;
    }

    function setupEditorOverlay() {
      const overlay = document.getElementById("screen-editor");
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
      return null;
    }

    function openEditorSurface(tabName = null, screen = getCurrentScreen()) {
      if (screen === "home") {
        closeHomeEditMode?.();
      }
      return openEditorScreen(tabName);
    }

    function openEditorScreen(tabName = null) {
      const overlay = showEditorScreen();
      if (!overlay) {
        showToast("編集画面を開けませんでした");
        return null;
      }
      getEditorApiMethod("renderEditorScreen")?.();
      if (tabName) getEditorApiMethod("activateEditorTab")?.(tabName);
      else getEditorApiMethod("closeAllEditorWindows")?.();
      return overlay;
    }

    function closeEditorScreen() {
      const overlay = document.getElementById("screen-editor");
      if (!overlay) return null;
      overlay.classList.remove("active");
      overlay.setAttribute("aria-hidden", "true");
      overlay.hidden = true;
      const home = document.getElementById("screen-home");
      if (home) {
        document.querySelectorAll(".screen").forEach(screenEl => {
          if (screenEl !== overlay) screenEl.classList.remove("active");
        });
        home.classList.add("active");
      }
      setCurrentScreen?.("home");
      setBottomNavActive("home");
      renderHome?.("refresh");
      return overlay;
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
