(function () {
  function createAppAuthProfileUiRuntime(deps) {
    const {
      text,
      escapeHtml,
      getCurrentProjectId,
      getCurrentUser,
      getPlayerProfile,
      getSummaryDetailsOpen,
      getProfileEditorOpen,
      clearProfileStatus,
      setProfileEditorOpen,
      setSummaryDetailsOpen
    } = deps;

    function toggleSummaryDetails() {
      setSummaryDetailsOpen(!getSummaryDetailsOpen());
    }

    function toggleProfileEditor() {
      setProfileEditorOpen(!getProfileEditorOpen());
      syncProfileEditorUi();
    }

    function syncProfileEditorUi() {
      const editor = document.getElementById("auth-profile-editor");
      const toggle = document.getElementById("auth-profile-toggle");
      if (editor) editor.hidden = !getProfileEditorOpen();
      if (toggle) {
        toggle.textContent = getProfileEditorOpen()
          ? text("closeProfileEditor", "Close game profile")
          : text("editProfile", "Edit game profile");
      }
    }

    function syncTitleSelect(select, profile) {
      if (!select) return;
      const titles = window.TitleSystemLib?.normalizeTitleCollection?.(profile?.titles) || [];
      select.innerHTML = `<option value="">${escapeHtml(text("unset", "Unset"))}</option>` + titles.map(title => `
        <option value="${escapeHtml(title.id)}">${escapeHtml(title.label)}</option>
      `).join("");
      select.value = titles.some(title => title.id === profile?.activeTitleId)
        ? String(profile.activeTitleId)
        : "";
    }

    function syncPlayerProfile() {
      const form = document.getElementById("auth-profile-form");
      if (!form) return;
      const profile = getPlayerProfile();
      const hasProject = Boolean(getCurrentProjectId?.());
      const titleSelect = document.getElementById("auth-profile-title-select");

      if (form.displayName) form.displayName.value = profile.displayName || "";
      if (form.birthday) form.birthday.value = profile.birthday || "";
      syncTitleSelect(titleSelect, profile);

      const disabled = !hasProject;
      Array.from(form.querySelectorAll("input, button, select")).forEach(element => {
        element.disabled = disabled;
      });

      form.classList.toggle("is-disabled", disabled);
      const note = document.getElementById("auth-profile-note");
      if (note) {
        note.textContent = hasProject
          ? text("profileNoteWithProject", "You can set a per-project name and birthday.")
          : text("profileNoteWithoutProject", "Select a project before editing the game profile.");
      }
      clearProfileStatus();
      syncProfileEditorUi();
    }

    function renderAuthState() {
      const profile = getPlayerProfile();
      const activeTitle = window.TitleSystemLib?.getActiveTitle?.(profile) || null;
      const guestLabel = text("guest", "Guest");
      const unsetLabel = text("unset", "Unset");

      const label = document.getElementById("auth-open-label");
      if (label) {
        label.textContent = profile.displayName || getCurrentUser()?.displayName || getCurrentUser()?.email || guestLabel;
      }

      const homePlayerName = document.getElementById("home-player-name");
      if (homePlayerName) {
        const name = profile.displayName || getCurrentUser()?.displayName || getCurrentUser()?.email || guestLabel;
        homePlayerName.textContent = activeTitle?.label ? `【${activeTitle.label}】 ${name}` : name;
      }

      const summary = document.getElementById("auth-session-summary");
      if (summary) {
        summary.innerHTML = `
          <div class="auth-summary-main">
            <strong class="auth-summary-name">${escapeHtml(profile.displayName || unsetLabel)}</strong>
            <span class="auth-summary-title">${escapeHtml(activeTitle?.label || text("summaryTitleUnset", "Title unset"))}</span>
            <span class="auth-summary-login-state">${getCurrentUser()?.id ? escapeHtml(text("loginStateLoggedIn", "Logged in")) : escapeHtml(text("loginStateLoggedOut", "Logged out"))}</span>
          </div>
          <div class="auth-summary-details" ${getSummaryDetailsOpen() ? "" : "hidden"}>
            <span>${escapeHtml(text("playerName", "Player name"))}: ${escapeHtml(profile.displayName || unsetLabel)}</span>
            <span>${escapeHtml(text("birthday", "Birthday"))}: ${escapeHtml(profile.birthday || unsetLabel)}</span>
            <span>${escapeHtml(text("ownedTitleCount", "Owned titles"))}: ${escapeHtml(String((profile.titles || []).length || 0))}</span>
            <span>${escapeHtml(text("accountLabel", "Account"))}: ${escapeHtml(getCurrentUser()?.displayName || getCurrentUser()?.email || guestLabel)}</span>
            <span class="auth-session-id">${escapeHtml(text("accountIdLabel", "Account ID"))}: ${escapeHtml(getCurrentUser()?.id || "") || escapeHtml(text("loginStateLoggedOut", "Logged out"))}</span>
          </div>
        `;
      }

      const detailToggle = document.getElementById("auth-summary-detail-toggle");
      if (detailToggle) {
        detailToggle.textContent = getSummaryDetailsOpen()
          ? text("hideDetails", "Hide details")
          : text("showDetails", "Show details");
      }

      const panelSections = document.getElementById("auth-panel-sections");
      if (panelSections) panelSections.hidden = Boolean(getCurrentUser()?.id);
      const panel = document.getElementById("auth-panel");
      if (panel) panel.classList.toggle("is-authenticated", Boolean(getCurrentUser()?.id));
      const logoutButton = document.getElementById("auth-logout-btn");
      if (logoutButton) logoutButton.hidden = !getCurrentUser()?.id;
    }

    return {
      toggleSummaryDetails,
      toggleProfileEditor,
      syncProfileEditorUi,
      syncTitleSelect,
      syncPlayerProfile,
      renderAuthState
    };
  }

  window.AppAuthProfileUiRuntimeLib = {
    create: createAppAuthProfileUiRuntime
  };
})();
