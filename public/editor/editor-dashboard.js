(function () {
  function createEditorDashboard(deps) {
    const {
      getHost,
      getItems,
      onSelect,
      onClose
    } = deps;

    let activeKey = "";

    function render() {
      const host = getHost?.();
      if (!host) return null;
      const items = getItems?.() || [];
      host.innerHTML = `
        <div class="editor-floating-window-head">
          <div><h4>編集ダッシュボード</h4></div>
          <button type="button" class="editor-floating-window-close" data-editor-dashboard-close>閉じる</button>
        </div>
        <div class="editor-window-launcher-grid">
          ${items.map(item => `
            <button
              type="button"
              class="editor-window-launcher-btn${item.key === activeKey ? " active" : ""}"
              data-editor-dashboard-key="${item.key}">
              <span class="editor-window-launcher-btn-title">${item.title}</span>
              <span class="editor-window-launcher-btn-sub">${item.sub}</span>
            </button>
          `).join("")}
        </div>
      `;
      host.querySelectorAll("[data-editor-dashboard-key]").forEach(button => {
        button.addEventListener("click", () => {
          const key = String(button.dataset.editorDashboardKey || "");
          onSelect?.(key);
        });
      });
      host.querySelector("[data-editor-dashboard-close]")?.addEventListener("click", () => {
        onClose?.();
      });
      return host;
    }

    function setActiveKey(nextKey) {
      activeKey = String(nextKey || "");
      render();
    }

    function show() {
      const host = getHost?.();
      if (host) host.hidden = false;
    }

    function hide() {
      const host = getHost?.();
      if (host) host.hidden = true;
    }

    return {
      render,
      setActiveKey,
      show,
      hide
    };
  }

  window.SociaEditorDashboard = {
    create: createEditorDashboard
  };
})();
