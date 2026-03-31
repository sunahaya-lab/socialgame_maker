/* Active compatibility implementation.
 * Role: share-management window implementation still wrapped by public/editor/ special sections.
 * Future mainline direction: public/editor/sections/share/ + editor/shared/ helpers.
 * Removal condition: only after special sections no longer instantiate window.EditorShareScreen.
 */
(function () {
  const FLOATING_WINDOW_MAINLINE = "SociaEditorFloatingWindow";
  const PROJECT_CONTEXT_MAINLINE = "SociaEditorProjectContext";

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

    const floatingWindowFactory =
      window[FLOATING_WINDOW_MAINLINE] ||
      window.EditorFloatingWindowLib ||
      null;
    const projectContextFactory =
      window[PROJECT_CONTEXT_MAINLINE] ||
      window.EditorProjectContextLib ||
      null;

    const floatingWindow = floatingWindowFactory?.create?.({
      getShell,
      windowId: "editor-share-window-v1",
      windowClassName: "editor-floating-window editor-content-window editor-share-window",
      title: "公開/共有",
      description: "共同編集URLと公開URLをここから発行します",
      onClose
    }) || null;

    function ensureWindow() {
      return floatingWindow?.ensureWindow?.() || null;
    }

    const projectContext = projectContextFactory?.create?.({
      getCurrentProjectId,
      getCurrentProjectName
    }) || null;

    function getProjectName() {
      return projectContext?.getProjectName?.() || "プロジェクト未選択";
    }

    function getProjectId() {
      return projectContext?.getProjectId?.() || "";
    }

    async function open() {
      const windowEl = floatingWindow?.openWindow?.() || null;
      const body = floatingWindow?.getBody?.() || null;
      if (!windowEl || !body) return;

      body.innerHTML = `
        <div class="editor-dashboard-summary">
          <div class="editor-dashboard-summary-head">
            <p class="editor-dashboard-summary-label">Project</p>
            <h5 class="editor-dashboard-summary-name">${esc(getProjectName())}</h5>
            <p class="editor-dashboard-summary-id">${getProjectId() ? `ID: ${esc(getProjectId())}` : ""}</p>
          </div>
        </div>
        <p class="editor-share-copy">共同編集URLまたは公開URLをここから発行できます。</p>
        <div class="editor-share-actions">
          <button type="button" class="btn-primary" data-share-action="collab">共同編集URL</button>
          <button type="button" class="btn-secondary" data-share-action="public">公開URL</button>
        </div>
        <p class="editor-share-plan" data-share-plan>プラン情報を確認しています...</p>
        <p class="editor-share-note">共同編集URL: 無料版でも利用できます。再発行すると以前のURLは無効になります。</p>
        <p class="editor-share-note">公開URL: 有料版限定です。プレイ専用で、編集はできません。</p>
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
    }

    function close() {
      floatingWindow?.closeWindow?.();
    }

    return { ensureWindow, open, close };
  }

  window.EditorShareScreen = {
    create: createEditorShareScreen
  };
})();
