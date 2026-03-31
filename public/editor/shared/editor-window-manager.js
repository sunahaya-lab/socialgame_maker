(function () {
  function createEditorWindowManager(deps) {
    const {
      getShell,
      windowDefs,
      onEnsureWindow,
      onOpenWindow,
      onCloseWindow,
      onCloseAllWindows
    } = deps;

    let dragState = null;

    function ensureWindow(def) {
      if (typeof onEnsureWindow === "function") {
        return onEnsureWindow(def) || null;
      }
      const shell = getShell?.();
      if (!shell || !def?.key) return null;
      let windowEl = document.getElementById(def.id || `editor-window-next-${def.key}`);
      if (windowEl) return windowEl;
      windowEl = document.createElement("section");
      windowEl.id = def.id || `editor-window-next-${def.key}`;
      windowEl.className = def.className || "editor-floating-window editor-content-window";
      windowEl.hidden = true;
      windowEl.innerHTML = `
        <div class="editor-floating-window-head">
          <div><h4>${def.title || ""}</h4></div>
          <button type="button" class="editor-floating-window-close" data-editor-window-close="${def.key}">閉じる</button>
        </div>
        <div class="editor-content-window-body"></div>
      `;
      shell.appendChild(windowEl);
      bindDrag(windowEl);
      return windowEl;
    }

    function bindDrag(windowEl) {
      const handle = windowEl?.querySelector?.(".editor-floating-window-head");
      if (!handle) return;
      handle.addEventListener("pointerdown", event => {
        if (event.target.closest("button, input, select, textarea, label")) return;
        const rect = windowEl.getBoundingClientRect();
        dragState = {
          windowEl,
          offsetX: event.clientX - rect.left,
          offsetY: event.clientY - rect.top
        };
      });
    }

    window.addEventListener("pointermove", event => {
      if (!dragState?.windowEl) return;
      dragState.windowEl.style.left = `${event.clientX - dragState.offsetX}px`;
      dragState.windowEl.style.top = `${event.clientY - dragState.offsetY}px`;
    });

    window.addEventListener("pointerup", () => {
      dragState = null;
    });

    function openWindow(key) {
      if (typeof onOpenWindow === "function") {
        return onOpenWindow(key) || null;
      }
      const def = (windowDefs || []).find(item => item.key === key);
      const windowEl = ensureWindow(def);
      if (windowEl) windowEl.hidden = false;
      return windowEl;
    }

    function closeWindow(key) {
      if (typeof onCloseWindow === "function") {
        return onCloseWindow(key) || null;
      }
      const def = (windowDefs || []).find(item => item.key === key);
      const windowEl = document.getElementById(def?.id || `editor-window-next-${key}`);
      if (windowEl) windowEl.hidden = true;
      return windowEl || null;
    }

    function closeAllWindows() {
      if (typeof onCloseAllWindows === "function") {
        onCloseAllWindows();
        return;
      }
      (windowDefs || []).forEach(def => {
        closeWindow(def.key);
      });
    }

    return {
      ensureWindow,
      openWindow,
      closeWindow,
      closeAllWindows
    };
  }

  window.SociaEditorWindowManager = {
    create: createEditorWindowManager
  };
})();
