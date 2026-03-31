(function () {
  function createEditorHostUi() {
    function getShell() {
      return document.querySelector(".editor-overlay-shell");
    }

    function ensureDashboardLauncher() {
      const shellEl = getShell();
      if (!shellEl) return null;
      let launcher = document.getElementById("editor-window-launcher");
      if (launcher) return launcher;
      launcher = document.createElement("div");
      launcher.id = "editor-window-launcher";
      launcher.className = "editor-floating-window editor-window-launcher";
      launcher.style.left = "24px";
      launcher.style.top = "24px";
      shellEl.appendChild(launcher);
      return launcher;
    }

    return {
      getShell,
      ensureDashboardLauncher
    };
  }

  window.SociaEditorHostUi = {
    create: createEditorHostUi
  };
})();
