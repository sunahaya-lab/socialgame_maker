(function () {
  function createEditorMemberScreen(deps) {
    const {
      getShell,
      esc,
      getCurrentProjectId,
      getCurrentProjectName,
      getCurrentPlayerId,
      onClose
    } = deps;

    function ensureWindow() {
      const shell = getShell?.();
      if (!shell) return null;
      let windowEl = document.getElementById("editor-member-window-v1");
      if (windowEl) return windowEl;
      windowEl = document.createElement("section");
      windowEl.id = "editor-member-window-v1";
      windowEl.className = "editor-floating-window editor-content-window editor-member-window";
      windowEl.hidden = true;
      windowEl.innerHTML = `
        <div class="editor-floating-window-head">
          <div>
            <h4>メンバー</h4>
            <p>このプロジェクトに参加するメンバーを確認します</p>
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

    function getProjectName() {
      return String(getCurrentProjectName?.() || "無題のプロジェクト").trim() || "無題のプロジェクト";
    }

    function getProjectId() {
      return String(getCurrentProjectId?.() || "").trim();
    }

    function getPlayerId() {
      return String(getCurrentPlayerId?.() || "").trim() || "local-player";
    }

    function open() {
      const windowEl = ensureWindow();
      const body = windowEl?.querySelector(".editor-content-window-body");
      if (!windowEl || !body) return;
      body.innerHTML = `
        <div class="editor-dashboard-summary">
          <div class="editor-dashboard-summary-head">
            <p class="editor-dashboard-summary-label">Project</p>
            <h5 class="editor-dashboard-summary-name">${esc(getProjectName())}</h5>
            <p class="editor-dashboard-summary-id">${getProjectId() ? `ID: ${esc(getProjectId())}` : ""}</p>
          </div>
        </div>
        <div class="editor-member-list">
          <div class="editor-member-row editor-member-row-head">
            <span>ユーザー</span>
            <span>ロール</span>
            <span>状態</span>
          </div>
          <div class="editor-member-row">
            <span class="editor-member-user">${esc(getPlayerId())}</span>
            <span class="editor-member-role">owner</span>
            <span class="editor-member-status">active</span>
          </div>
        </div>
        <p class="editor-member-note">メンバー招待と権限変更は次の段階で追加します</p>
      `;
      windowEl.hidden = false;
    }

    function close() {
      const windowEl = document.getElementById("editor-member-window-v1");
      if (windowEl) windowEl.hidden = true;
    }

    return { ensureWindow, open, close };
  }

  window.EditorMemberScreen = {
    create: createEditorMemberScreen
  };
})();
