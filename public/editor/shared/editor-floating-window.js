(function () {
  function createEditorFloatingWindow(deps) {
    const {
      getShell,
      windowId,
      windowClassName,
      title,
      description,
      onClose
    } = deps;

    function ensureWindow() {
      const shell = getShell?.();
      if (!shell) return null;
      let windowEl = document.getElementById(windowId);
      if (windowEl) return windowEl;
      windowEl = document.createElement("section");
      windowEl.id = windowId;
      windowEl.className = windowClassName;
      windowEl.hidden = true;
      windowEl.innerHTML = `
        <div class="editor-floating-window-head">
          <div>
            <h4>${title}</h4>
            <p>${description}</p>
          </div>
          <button type="button" class="editor-floating-window-close" data-close-window>閉じる</button>
        </div>
        <div class="editor-content-window-body"></div>
      `;
      shell.appendChild(windowEl);
      windowEl.querySelector("[data-close-window]")?.addEventListener("click", () => {
        windowEl.hidden = true;
        onClose?.();
      });
      return windowEl;
    }

    function getBody() {
      return ensureWindow()?.querySelector(".editor-content-window-body") || null;
    }

    function openWindow() {
      const windowEl = ensureWindow();
      if (windowEl) windowEl.hidden = false;
      return windowEl;
    }

    function closeWindow() {
      const windowEl = document.getElementById(windowId);
      if (windowEl) windowEl.hidden = true;
      return windowEl || null;
    }

    return {
      ensureWindow,
      getBody,
      openWindow,
      closeWindow
    };
  }

  window.SociaEditorFloatingWindow = {
    create: createEditorFloatingWindow
  };
})();
