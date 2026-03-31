/* Active compatibility implementation.
 * Role: member-management window implementation still wrapped by public/editor/ special sections.
 * Future mainline direction: public/editor/sections/members/ + editor/shared/ helpers.
 * Removal condition: only after special sections no longer instantiate window.EditorMemberScreen.
 */
(function () {
  const FLOATING_WINDOW_MAINLINE = "SociaEditorFloatingWindow";
  const PROJECT_CONTEXT_MAINLINE = "SociaEditorProjectContext";
  const ROLE_OPTIONS = [
    { value: "editor", label: "editor" },
    { value: "viewer", label: "viewer" }
  ];

  function createEditorMemberScreen(deps) {
    const {
      getShell,
      esc,
      getProjects,
      getCurrentProjectId,
      getCurrentProjectName,
      getCurrentPlayerId,
      handleCreateProject,
      renameProject,
      switchProject,
      listProjectMembers,
      inviteProjectMember,
      updateProjectMemberRole,
      onClose
    } = deps;

    let loading = false;

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
      windowId: "editor-member-window-v1",
      windowClassName: "editor-floating-window editor-content-window editor-member-window",
      title: "プロジェクト設定",
      description: "プロジェクト名、参加ユーザー、招待を管理します。",
      onClose
    }) || null;

    const projectContext = projectContextFactory?.create?.({
      getCurrentProjectId,
      getCurrentProjectName
    }) || null;

    function ensureWindow() {
      return floatingWindow?.ensureWindow?.() || null;
    }

    function getProjectName() {
      return projectContext?.getProjectName?.() || "無題のプロジェクト";
    }

    function getProjectId() {
      return projectContext?.getProjectId?.() || "";
    }

    function getPlayerId() {
      return String(getCurrentPlayerId?.() || "").trim() || "local-player";
    }

    function getProjectList() {
      return Array.isArray(getProjects?.()) ? getProjects() : [];
    }

    function renderProjectOptions() {
      const currentId = getProjectId();
      const projects = getProjectList().slice();
      if (currentId && !projects.some(project => String(project?.id || "").trim() === currentId)) {
        projects.unshift({
          id: currentId,
          name: getProjectName()
        });
      }
      return projects.map(project => `
        <option value="${esc(project.id)}"${String(project.id || "").trim() === currentId ? " selected" : ""}>${esc(project.name)}</option>
      `).join("");
    }

    function renderMemberRows(members = []) {
      if (!members.length) {
        return `
          <div class="editor-member-row">
            <span class="editor-member-user">参加ユーザーはいません</span>
            <span class="editor-member-role">-</span>
            <span class="editor-member-status">-</span>
            <span class="editor-member-actions">-</span>
          </div>
        `;
      }
      return members.map(member => {
        const role = String(member?.role || "viewer").trim();
        const status = String(member?.status || "active").trim();
        const canEditRole = role !== "owner";
        return `
          <div class="editor-member-row" data-member-user="${esc(member.userId)}">
            <span class="editor-member-user">
              <strong>${esc(member.displayName || member.email || member.userId)}</strong>
              <small>${esc(member.email || member.userId)}</small>
            </span>
            <span class="editor-member-role">
              ${canEditRole ? `
                <select class="editor-member-role-select" data-member-role-select="${esc(member.userId)}">
                  ${ROLE_OPTIONS.map(option => `
                    <option value="${esc(option.value)}"${option.value === role ? " selected" : ""}>${esc(option.label)}</option>
                  `).join("")}
                </select>
              ` : '<span class="editor-member-role-fixed">owner</span>'}
            </span>
            <span class="editor-member-status ${status === "invited" ? "is-invited" : "is-active"}">${esc(status)}</span>
            <span class="editor-member-actions">
              ${canEditRole ? `<button type="button" class="btn-secondary editor-member-action-btn" data-member-role-save="${esc(member.userId)}">変更</button>` : '<span class="editor-member-role-fixed">固定</span>'}
            </span>
          </div>
        `;
      }).join("");
    }

    function renderInviteSection() {
      return `
        <section class="editor-project-settings-section">
          <div class="editor-project-settings-head">
            <h5>参加ユーザーを招待</h5>
            <p>メールアドレスまたはユーザーIDを指定して招待を追加します。</p>
          </div>
          <div class="editor-member-invite-form">
            <label class="editor-project-settings-label" for="editor-member-invite-user">
              <span>メールアドレスまたはユーザーID</span>
              <input id="editor-member-invite-user" type="text" maxlength="160" placeholder="member@example.com">
            </label>
            <label class="editor-project-settings-label" for="editor-member-invite-role">
              <span>権限</span>
              <select id="editor-member-invite-role" aria-label="招待時の権限">
                ${ROLE_OPTIONS.map(option => `
                  <option value="${esc(option.value)}"${option.value === "viewer" ? " selected" : ""}>${esc(option.label)}</option>
                `).join("")}
              </select>
            </label>
            <div class="editor-project-settings-actions">
              <button type="button" class="btn-primary" id="editor-member-invite-btn">招待する</button>
            </div>
          </div>
        </section>
      `;
    }

    function renderBody(members = [], message = "", isError = false) {
      return `
        <div class="editor-dashboard-summary">
          <div class="editor-dashboard-summary-head">
            <p class="editor-dashboard-summary-label">Project</p>
            <h5 class="editor-dashboard-summary-name">${esc(getProjectName())}</h5>
            <p class="editor-dashboard-summary-id">${getProjectId() ? `ID: ${esc(getProjectId())}` : ""}</p>
          </div>
        </div>
        <section class="editor-project-settings-section">
          <label class="editor-project-settings-label" for="editor-project-name-input">
            <span>プロジェクト名</span>
            <input id="editor-project-name-input" type="text" maxlength="80" value="${esc(getProjectName())}" placeholder="プロジェクト名">
          </label>
          <div class="editor-project-settings-actions">
            <button type="button" class="btn-secondary" id="editor-project-rename-btn">名前を変更</button>
          </div>
          <label class="editor-project-settings-label" for="editor-project-select">
            <span>プロジェクト選択</span>
            <select id="editor-project-select" aria-label="プロジェクトを選択">
              ${renderProjectOptions()}
            </select>
          </label>
          <div class="editor-project-settings-actions">
            <button type="button" class="btn-secondary" id="editor-project-create-btn">新規プロジェクト</button>
          </div>
        </section>
        ${renderInviteSection()}
        <section class="editor-project-settings-section">
          <div class="editor-project-settings-head">
            <h5>参加ユーザー</h5>
            <p>owner は固定です。editor / viewer は変更できます。</p>
          </div>
          <div class="editor-member-list">
            <div class="editor-member-row editor-member-row-head">
              <span>ユーザー</span>
              <span>ロール</span>
              <span>状態</span>
              <span>操作</span>
            </div>
            ${renderMemberRows(members)}
          </div>
        </section>
        <p class="editor-member-note ${isError ? "is-error" : ""}" id="editor-member-note">${esc(message || "招待と権限変更はこの画面から行えます。")}</p>
      `;
    }

    function setBusy(windowEl, isBusy) {
      loading = Boolean(isBusy);
      windowEl?.classList.toggle("is-busy", loading);
      windowEl?.querySelectorAll("button, input, select").forEach(node => {
        if (node.dataset.closeWindow !== undefined) return;
        node.disabled = loading;
      });
    }

    function getApiMessage(error, fallback) {
      const apiMessage = String(error?.data?.error || "").trim();
      if (apiMessage) return apiMessage;
      const message = String(error?.message || "").trim();
      return message || fallback;
    }

    async function loadMembers() {
      if (!getProjectId()) return [];
      if (typeof listProjectMembers !== "function") {
        return [{
          userId: getPlayerId(),
          role: "owner",
          status: "active"
        }];
      }
      return await listProjectMembers(getProjectId());
    }

    function bindProjectActions(body) {
      body.querySelector("#editor-project-select")?.addEventListener("change", async event => {
        const nextProjectId = String(event.target.value || "").trim();
        if (!nextProjectId || nextProjectId === getProjectId() || loading) return;
        await switchProject?.(nextProjectId);
        await open();
      });

      body.querySelector("#editor-project-create-btn")?.addEventListener("click", async () => {
        if (loading) return;
        await handleCreateProject?.();
        await open();
      });

      body.querySelector("#editor-project-rename-btn")?.addEventListener("click", async () => {
        if (loading) return;
        const input = body.querySelector("#editor-project-name-input");
        const nextName = String(input?.value || "").trim();
        if (!nextName || nextName === getProjectName()) return;
        await renameProject?.(getProjectId(), nextName);
        await open();
      });
    }

    function bindMemberActions(windowEl, body) {
      body.querySelector("#editor-member-invite-btn")?.addEventListener("click", async () => {
        if (loading || typeof inviteProjectMember !== "function") return;
        const targetUserId = String(body.querySelector("#editor-member-invite-user")?.value || "").trim();
        const role = String(body.querySelector("#editor-member-invite-role")?.value || "viewer").trim();
        setBusy(windowEl, true);
        try {
          const members = await inviteProjectMember(targetUserId, role);
          body.innerHTML = renderBody(members, `ユーザー ${targetUserId} を招待しました。`);
          bindProjectActions(body);
          bindMemberActions(windowEl, body);
        } catch (error) {
          const members = await loadMembers().catch(() => []);
          body.innerHTML = renderBody(members, getApiMessage(error, "招待に失敗しました。"), true);
          bindProjectActions(body);
          bindMemberActions(windowEl, body);
        } finally {
          setBusy(windowEl, false);
        }
      });

      body.querySelectorAll("[data-member-role-save]").forEach(button => {
        button.addEventListener("click", async () => {
          if (loading || typeof updateProjectMemberRole !== "function") return;
          const targetUserId = String(button.dataset.memberRoleSave || "").trim();
          const row = button.closest("[data-member-user]");
          const select = row?.querySelector("[data-member-role-select]");
          const role = String(select?.value || "viewer").trim();
          setBusy(windowEl, true);
          try {
            const members = await updateProjectMemberRole(targetUserId, role);
            body.innerHTML = renderBody(members, `ユーザー ${targetUserId} の権限を更新しました。`);
            bindProjectActions(body);
            bindMemberActions(windowEl, body);
          } catch (error) {
            const members = await loadMembers().catch(() => []);
            body.innerHTML = renderBody(members, getApiMessage(error, "権限変更に失敗しました。"), true);
            bindProjectActions(body);
            bindMemberActions(windowEl, body);
          } finally {
            setBusy(windowEl, false);
          }
        });
      });
    }

    async function open() {
      const windowEl = floatingWindow?.openWindow?.() || null;
      const body = floatingWindow?.getBody?.() || null;
      if (!windowEl || !body) return;
      setBusy(windowEl, true);
      try {
        const members = await loadMembers();
        body.innerHTML = renderBody(members);
        bindProjectActions(body);
        bindMemberActions(windowEl, body);
      } catch (error) {
        body.innerHTML = renderBody([], getApiMessage(error, "参加ユーザーの読み込みに失敗しました。"), true);
        bindProjectActions(body);
        bindMemberActions(windowEl, body);
      } finally {
        setBusy(windowEl, false);
      }
    }

    function close() {
      floatingWindow?.closeWindow?.();
    }

    return { ensureWindow, open, close };
  }

  window.EditorMemberScreen = {
    create: createEditorMemberScreen
  };
})();
