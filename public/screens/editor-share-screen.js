(function () {
  function createEditorShareScreen(deps) {
    const {
      getShell,
      esc,
      getCurrentProjectId,
      getCurrentProjectName,
      getShareManagementSummary,
      rotateCollaborativeShare,
      createPublicShare,
      onClose
    } = deps;

    function ensureWindow() {
      const shell = getShell?.();
      if (!shell) return null;
      let windowEl = document.getElementById("editor-share-window-v1");
      if (windowEl) return windowEl;
      windowEl = document.createElement("section");
      windowEl.id = "editor-share-window-v1";
      windowEl.className = "editor-floating-window editor-content-window editor-share-window";
      windowEl.hidden = true;
      windowEl.innerHTML = `
        <div class="editor-floating-window-head">
          <div>
            <h4>公開/共有</h4>
            <p>共同編集URLと公開URLを管理します</p>
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

    async function open() {
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
        <p class="editor-share-copy">共同編集URLまたは公開URLをここから発行できます</p>
        <div class="editor-share-actions">
          <button type="button" class="btn-primary" data-share-action="collab">共同編集URL</button>
          <button type="button" class="btn-secondary" data-share-action="public">公開URL</button>
        </div>
        <p class="editor-share-plan" data-share-plan>プラン情報を確認しています...</p>
        <p class="editor-share-note">共同編集URL: 無料版で利用可能です。再発行すると以前のURLは失効します</p>
        <p class="editor-share-note">公開URL: 有料版限定です。プレイ専用で編集はできません</p>
        <p class="editor-share-status" data-share-status></p>
      `;
      const planEl = body.querySelector("[data-share-plan]");
      const statusEl = body.querySelector("[data-share-status]");
      const collabButton = body.querySelector('[data-share-action="collab"]');
      const publicButton = body.querySelector('[data-share-action="public"]');

      collabButton?.addEventListener("click", async () => {
        if (statusEl) {
          statusEl.textContent = "";
          statusEl.classList.remove("is-error");
        }
        const result = await rotateCollaborativeShare?.();
        if (!statusEl || !result || result.cancelled) return;
        statusEl.textContent = result.message || "";
        statusEl.classList.toggle("is-error", result.ok === false);
      });

      publicButton?.addEventListener("click", async () => {
        if (statusEl) {
          statusEl.textContent = "";
          statusEl.classList.remove("is-error");
        }
        const result = await createPublicShare?.();
        if (!statusEl || !result) return;
        statusEl.textContent = result.message || "";
        statusEl.classList.toggle("is-error", result.ok === false);
      });

      try {
        const summary = await getShareManagementSummary?.();
        const isPaid = Boolean(summary?.isPaid);
        if (planEl) {
          planEl.textContent = String(summary?.message || "");
          planEl.classList.toggle("is-paid", isPaid);
          planEl.classList.toggle("is-free", !isPaid);
        }
        if (publicButton) publicButton.disabled = !isPaid;
      } catch (error) {
        const message = String(error?.data?.error || error?.message || "共有設定の取得に失敗しました").trim();
        if (planEl) {
          planEl.textContent = message;
          planEl.classList.remove("is-paid");
          planEl.classList.add("is-free");
        }
        if (statusEl) {
          statusEl.textContent = message;
          statusEl.classList.add("is-error");
        }
        if (publicButton) publicButton.disabled = true;
      }

      windowEl.hidden = false;
    }

    function close() {
      const windowEl = document.getElementById("editor-share-window-v1");
      if (windowEl) windowEl.hidden = true;
    }

    return { ensureWindow, open, close };
  }

  window.EditorShareScreen = {
    create: createEditorShareScreen
  };
})();
