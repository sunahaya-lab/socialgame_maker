/* Share panel runtime.
 * Role: owns editor-side public/collab share panel behavior and project member
 * runtime access for the share workflow.
 */
(() => {
  function create(deps = {}) {
    let projectMembersRuntime = null;

    function getApiErrorMessage(error, fallback) {
      const apiMessage = String(error?.data?.error || "").trim();
      if (apiMessage) return apiMessage;
      const message = String(error?.message || "").trim();
      if (message) return message;
      return fallback;
    }

    function ensureProjectMembersRuntime() {
      if (!projectMembersRuntime) {
        projectMembersRuntime = deps.createProjectMembersRuntime?.({
          apiUrl: deps.apiUrl,
          API: deps.API,
          fetchJSON: deps.fetchJSON,
          postJSON: deps.postJSON,
          getCurrentPlayerId: deps.getCurrentPlayerId
        }) || null;
      }
      return projectMembersRuntime;
    }

    async function listProjectMembers(projectId) {
      return ensureProjectMembersRuntime()?.list?.(projectId) || [];
    }

    async function inviteProjectMember(projectId, targetUserId, role = "viewer") {
      return ensureProjectMembersRuntime()?.invite?.(projectId, targetUserId, role) || [];
    }

    async function updateProjectMemberRole(projectId, targetUserId, role = "viewer") {
      return ensureProjectMembersRuntime()?.updateRole?.(projectId, targetUserId, role) || [];
    }

    function buildSharedUrl(projectId, shareParams = {}) {
      const url = new URL(location.href);
      url.searchParams.delete("room");
      url.searchParams.delete("collab");
      url.searchParams.delete("share");
      url.searchParams.delete("user");
      if (projectId) url.searchParams.set("project", projectId);
      Object.entries(shareParams).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
      });
      return url.toString();
    }

    function copyShareUrl(url) {
      navigator.clipboard.writeText(url).then(() => {
        deps.showToast?.("共有URLをコピーしました");
      }).catch(() => {
        prompt("共有URL:", url);
      });
    }

    function setSharePanelBusy(isBusy) {
      const panel = document.getElementById("share-panel");
      if (!panel) return;
      panel.classList.toggle("is-busy", isBusy);
      panel.querySelectorAll("button").forEach(button => {
        if (button.dataset.shareClose !== undefined) return;
        button.disabled = isBusy;
      });
    }

    function renderSharePanelStatus(message, isError = false) {
      const status = document.getElementById("share-panel-status");
      if (!status) return;
      status.textContent = String(message || "");
      status.classList.toggle("is-error", Boolean(isError));
    }

    async function rotateCollaborativeShare(projectId) {
      const confirmed = window.confirm("共同編集URLを再発行しますか？ 以前のURLは使えなくなります");
      if (!confirmed) return { ok: false, cancelled: true, message: "" };
      try {
        setSharePanelBusy(true);
        const response = await deps.postJSON(
          deps.apiUrl(deps.API.shareCollabLink, {
            includeProject: false,
            query: { project: projectId }
          }),
          { projectId, userId: deps.getCurrentPlayerId() }
        );
        const token = String(response?.collabShare?.token || "").trim();
        if (!token) throw new Error("missing_collab_token");
        copyShareUrl(buildSharedUrl(projectId, { collab: token }));
        const message = "共同編集URLを再発行し、コピーしました";
        renderSharePanelStatus(message);
        return { ok: true, message };
      } catch (error) {
        console.error("Failed to rotate collaborative share:", error);
        const message = getApiErrorMessage(error, "共同編集URLの発行に失敗しました");
        deps.showToast?.(message);
        renderSharePanelStatus(message, true);
        return { ok: false, message };
      } finally {
        setSharePanelBusy(false);
      }
    }

    async function createPublicShare(projectId) {
      try {
        setSharePanelBusy(true);
        const response = await deps.postJSON(
          deps.apiUrl(deps.API.sharePublicLink, {
            includeProject: false,
            query: { project: projectId }
          }),
          { projectId, userId: deps.getCurrentPlayerId() }
        );
        const token = String(response?.publicShare?.token || "").trim();
        if (!token) throw new Error("missing_public_token");
        copyShareUrl(buildSharedUrl(projectId, { share: token }));
        const message = "公開プレイ専用URLを発行し、コピーしました";
        renderSharePanelStatus(message);
        return { ok: true, message };
      } catch (error) {
        console.error("Failed to create public share:", error);
        const message = getApiErrorMessage(error, "このプロジェクトでは公開共有を利用できません");
        deps.showToast?.(message);
        renderSharePanelStatus(message, true);
        return { ok: false, message };
      } finally {
        setSharePanelBusy(false);
      }
    }

    async function getShareManagementSummary(projectId) {
      const response = await deps.postJSON(
        deps.apiUrl(deps.API.projectShareSummary, {
          includeProject: false,
          query: { project: projectId, user: deps.getCurrentPlayerId() }
        }),
        { projectId, userId: deps.getCurrentPlayerId() }
      );
      const isPaid = String(response?.licensePlan || "free") === "publish" && Boolean(response?.canCreatePublicShare);
      return {
        isPaid,
        licensePlan: String(response?.licensePlan || "free"),
        canCreatePublicShare: Boolean(response?.canCreatePublicShare),
        message: isPaid
          ? "プラン: 有料版。公開プレイ専用共有を利用できます"
          : "プラン: 無料版。公開プレイ専用共有は利用できません"
      };
    }

    async function loadSharePanelLicense(projectId) {
      const planEl = document.getElementById("share-panel-plan");
      const publicButton = document.querySelector("#share-panel [data-share-action='public']");
      if (planEl) {
        planEl.textContent = "プラン情報を確認しています...";
        planEl.classList.remove("is-paid", "is-free");
      }
      if (publicButton) publicButton.disabled = true;

      try {
        const summary = await getShareManagementSummary(projectId);
        const isPaid = Boolean(summary.isPaid);
        if (planEl) {
          planEl.textContent = summary.message;
          planEl.classList.toggle("is-paid", isPaid);
          planEl.classList.toggle("is-free", !isPaid);
        }
        if (publicButton) publicButton.disabled = !isPaid;
      } catch (error) {
        console.error("Failed to load project license:", error);
        const message = getApiErrorMessage(error, "プラン情報の確認に失敗しました");
        if (planEl) {
          planEl.textContent = message;
          planEl.classList.remove("is-paid");
          planEl.classList.add("is-free");
        }
        if (publicButton) publicButton.disabled = true;
        renderSharePanelStatus(message, true);
      }
    }

    function closeSharePanel() {
      const panel = document.getElementById("share-panel");
      if (!panel) return;
      panel.hidden = true;
      panel.classList.remove("active");
      setSharePanelBusy(false);
    }

    function ensureSharePanel() {
      const host = document.querySelector(".app-shell") || document.body;
      if (!host || document.getElementById("share-panel")) return;
      const panel = document.createElement("div");
      panel.className = "share-panel";
      panel.id = "share-panel";
      panel.hidden = true;
      panel.innerHTML = `
        <div class="share-panel-head">
          <h4>共有</h4>
          <button type="button" class="share-panel-close" data-share-close aria-label="閉じる">&times;</button>
        </div>
        <p class="share-panel-copy">
          現在のプロジェクト用に、共同編集URLまたは公開プレイ専用URLを発行できます
        </p>
        <div class="share-panel-actions">
          <button type="button" class="btn-primary" data-share-action="collab">共同編集URL</button>
          <button type="button" class="btn-secondary" data-share-action="public">公開URL</button>
        </div>
        <p class="share-panel-plan" id="share-panel-plan"></p>
        <p class="share-panel-note">
          共同編集URL: 無料版で利用可能です。編集でき、再発行すると以前のURLは失効します
        </p>
        <p class="share-panel-note">
          公開URL: 有料版限定です。プレイ専用で、編集はできません
        </p>
        <p class="share-panel-status" id="share-panel-status"></p>
      `;
      host.appendChild(panel);
      panel.querySelector("[data-share-close]")?.addEventListener("click", closeSharePanel);
      panel.querySelectorAll("[data-share-action]").forEach(button => {
        button.addEventListener("click", () => {
          const action = button.dataset.shareAction;
          const projectId = deps.getCurrentProjectId();
          if (!projectId) {
            renderSharePanelStatus("プロジェクトが選択されていません", true);
            return;
          }
          if (action === "collab") {
            rotateCollaborativeShare(projectId);
            return;
          }
          if (action === "public") {
            createPublicShare(projectId);
          }
        });
      });
    }

    function openSharePanel(projectId) {
      ensureSharePanel();
      const panel = document.getElementById("share-panel");
      if (!panel) return;
      panel.hidden = false;
      panel.classList.add("active");
      renderSharePanelStatus(projectId ? `プロジェクト: ${projectId}` : "");
      loadSharePanelLicense(projectId);
    }

    function handleShare() {
      const currentProjectId = deps.getCurrentProjectId();
      if (!currentProjectId) {
        deps.showToast?.("プロジェクトが選択されていません");
        return;
      }
      openSharePanel(currentProjectId);
    }

    function setupShareBindings() {
      document.getElementById("share-btn")?.addEventListener("click", handleShare);
      ensureSharePanel();
    }

    return {
      ensureSharePanel,
      setupShareBindings,
      handleShare,
      listProjectMembers,
      inviteProjectMember,
      updateProjectMemberRole,
      rotateCollaborativeShare,
      createPublicShare,
      getShareManagementSummary
    };
  }

  window.SociaSharePanelRuntime = {
    create
  };
})();
