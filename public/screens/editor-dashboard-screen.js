(function () {
  function createEditorDashboardScreen(deps) {
    const {
      getLauncher,
      esc,
      getProjectName,
      getProjectId,
      getSummaryCards,
      onOpenSection,
      onOpenShare,
      onOpenMembers,
      onCloseEditor
    } = deps;

    function render() {
      const launcher = getLauncher?.();
      if (!launcher) return;
      const summaryCards = getSummaryCards?.() || [];
      const dashboardItems = [
        { key: "base-char", title: "ベースキャラ", sub: "プロフィールと音声の編集" },
        { key: "character", title: "カード", sub: "カード登録と画像の編集" },
        { key: "story", title: "ストーリー", sub: "本文とシーン構成の編集" },
        { key: "gacha", title: "ガチャ", sub: "排出設定とバナーの編集" },
        { key: "system", title: "システム", sub: "基本設定と表示の編集" },
        { key: "publish-share", title: "公開/共有", sub: "共同編集URLと公開URL" },
        { key: "members", title: "メンバー", sub: "参加者と権限の管理" }
      ];

      launcher.innerHTML = `
        <div class="editor-floating-window-head">
          <div>
            <h4>編集ダッシュボード</h4>
          </div>
          <button type="button" class="editor-floating-window-close" data-close-editor-overlay>閉じる</button>
        </div>
        <section class="editor-dashboard-summary">
          <div class="editor-dashboard-summary-head">
            <p class="editor-dashboard-summary-label">Project</p>
            <h5 class="editor-dashboard-summary-name">${esc(getProjectName?.() || "")}</h5>
            <p class="editor-dashboard-summary-id">${getProjectId?.() ? `ID: ${esc(getProjectId())}` : ""}</p>
          </div>
          <div class="editor-dashboard-summary-stats">
            ${summaryCards.map(item => `
              <div class="editor-dashboard-stat">
                <span class="editor-dashboard-stat-label">${item.label}</span>
                <strong class="editor-dashboard-stat-value">${item.value}</strong>
              </div>
            `).join("")}
          </div>
        </section>
        <div class="editor-window-launcher-grid">
          ${dashboardItems.map(item => `
            <button type="button" class="editor-window-launcher-btn" data-editor-action="${item.key}">
              <span class="editor-window-launcher-btn-title">${item.title}</span>
              <span class="editor-window-launcher-btn-sub">${item.sub}</span>
            </button>
          `).join("")}
        </div>
      `;

      launcher.querySelectorAll(".editor-window-launcher-btn").forEach(button => {
        button.addEventListener("click", () => {
          const key = button.dataset.editorAction || "";
          if (key === "publish-share") {
            onOpenShare?.();
            return;
          }
          if (key === "members") {
            onOpenMembers?.();
            return;
          }
          onOpenSection?.(key);
        });
      });

      launcher.querySelector("[data-close-editor-overlay]")?.addEventListener("click", () => {
        onCloseEditor?.();
      });
    }

    return { render };
  }

  window.EditorDashboardScreen = {
    create: createEditorDashboardScreen
  };
})();
