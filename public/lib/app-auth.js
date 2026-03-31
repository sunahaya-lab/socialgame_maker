(function () {
  function createAppAuthModule(deps) {
    const {
      apiGet,
      apiPost,
      getCurrentProjectId,
      getPlayerState,
      updatePlayerProfile,
      persistProfileMeta,
      createProfileActions,
      createAuthSessionRuntime,
      createAuthPanelUi,
      showToast
    } = deps;

    const authText = window.AuthUiTextLib || null;

    let currentUser = null;
    let escBound = false;
    let profileActions = null;
    let authSessionRuntime = null;
    let authPanelUi = null;
    let summaryDetailsOpen = false;
    let profileEditorOpen = false;
    let sessionSyncBound = false;
    let sessionSyncInFlight = null;

    const utilsApi = window.AppAuthUtilsRuntimeLib?.create?.() || null;

    function text(key, fallback = "") {
      return authText?.get?.(key, fallback) || fallback;
    }

    function getPlayerProfile() {
      return utilsApi?.getPlayerProfile?.(getPlayerState);
    }

    function isProfileSetupRequired() {
      return utilsApi?.isProfileSetupRequired?.();
    }

    function renderPanelStatus(message, isError = false) {
      return utilsApi?.renderPanelStatus?.(message, isError);
    }

    function setProfileStatus(message, isError = false) {
      return utilsApi?.setProfileStatus?.(message, isError);
    }

    function clearProfileStatus() {
      return utilsApi?.clearProfileStatus?.();
    }

    function getApiErrorMessage(error, fallback) {
      return utilsApi?.getApiErrorMessage?.(error, fallback);
    }

    function escapeHtml(value) {
      return utilsApi?.escapeHtml?.(value) || "";
    }

    function ensureAuthSessionRuntime() {
      if (!authSessionRuntime) {
        authSessionRuntime = createAuthSessionRuntime?.({
          apiGet,
          apiPost
        }) || null;
      }
      return authSessionRuntime;
    }

    function ensureAuthPanelUi() {
      if (!authPanelUi) {
        authPanelUi = createAuthPanelUi?.() || null;
      }
      return authPanelUi;
    }

    function setPanelOpen(isOpen) {
      const panel = document.getElementById("auth-panel");
      if (!panel) return;
      if (!isOpen) {
        const activeElement = document.activeElement;
        if (activeElement && panel.contains(activeElement) && typeof activeElement.blur === "function") {
          activeElement.blur();
        }
        document.getElementById("auth-open-btn")?.focus?.();
      }
      panel.classList.toggle("is-open", Boolean(isOpen));
      panel.setAttribute("aria-hidden", isOpen ? "false" : "true");
      if ("inert" in panel) {
        panel.inert = !isOpen;
      }
    }

    function ensureProfileActions() {
      if (!profileActions) {
        profileActions = createProfileActions?.({
          updatePlayerProfile,
          persistProfileMeta,
          syncPlayerProfile,
          renderAuthState,
          renderPanelStatus,
          setProfileStatus,
          isProfileSetupRequired,
          setPanelOpen,
          showToast,
          getApiErrorMessage
        }) || null;
      }
      return profileActions;
    }

    const authProfileUiRuntime = window.AppAuthProfileUiRuntimeLib?.create?.({
      text,
      escapeHtml: value => escapeHtml(value),
      getCurrentProjectId,
      getCurrentUser: () => currentUser,
      getPlayerProfile: () => getPlayerProfile(),
      getSummaryDetailsOpen: () => summaryDetailsOpen,
      getProfileEditorOpen: () => profileEditorOpen,
      clearProfileStatus,
      setProfileEditorOpen: value => {
        profileEditorOpen = Boolean(value);
      },
      setSummaryDetailsOpen: value => {
        summaryDetailsOpen = Boolean(value);
      }
    });

    function syncPlayerProfile() {
      return authProfileUiRuntime?.syncPlayerProfile?.();
    }

    function renderAuthState() {
      authProfileUiRuntime?.renderAuthState?.();
      renderPanelStatus(
        currentUser?.id
          ? text("panelStatusLoggedIn", "You can manage the account and game profile.")
          : text("panelStatusLoggedOut", "You are logged out. Please log in or register.")
      );
      syncPlayerProfile();
    }

    const authSessionFlowRuntime = window.AppAuthSessionFlowRuntimeLib?.create?.({
      ensureAuthSessionRuntime,
      renderAuthState,
      syncPlayerProfile,
      renderPanelStatus,
      showToast,
      setPanelOpen,
      getApiErrorMessage,
      text,
      getCurrentUser: () => currentUser,
      setCurrentUser: value => {
        currentUser = value || null;
      }
    });

    const authProfileActionsRuntime = window.AppAuthProfileActionsRuntimeLib?.create?.({
      ensureProfileActions,
      ensureAuthSessionRuntime,
      renderAuthState,
      showToast,
      getApiErrorMessage,
      text,
      setCurrentUser: value => {
        currentUser = value || null;
      }
    });

    function restoreSession() {
      return authSessionFlowRuntime?.restoreSession?.();
    }

    function getCurrentUser() {
      return currentUser;
    }

    function openPanel() {
      ensureUi();
      renderAuthState();
      syncPlayerProfile();
      setPanelOpen(true);
    }

    function closePanel() {
      setPanelOpen(false);
    }

    function promptForProfileSetup() {
      ensureUi();
    }

    function submitAuth(path, payload, successMessage) {
      return authSessionFlowRuntime?.submitAuth?.(path, payload, successMessage);
    }

    function handleLogin(event) {
      return authSessionFlowRuntime?.handleLogin?.(event);
    }

    function handleRegister(event) {
      return authSessionFlowRuntime?.handleRegister?.(event);
    }

    function handleProfileSave(event) {
      return authProfileActionsRuntime?.handleProfileSave?.(event);
    }

    function handleActiveTitleChange(event) {
      return authProfileActionsRuntime?.handleActiveTitleChange?.(event);
    }

    function handleLogout() {
      return authSessionFlowRuntime?.handleLogout?.();
    }

    function toggleSummaryDetails() {
      authProfileUiRuntime?.toggleSummaryDetails?.();
      renderAuthState();
    }

    function toggleProfileEditor() {
      return authProfileUiRuntime?.toggleProfileEditor?.();
    }

    function syncProfileEditorUi() {
      return authProfileUiRuntime?.syncProfileEditorUi?.();
    }

    function syncTitleSelect(select, profile) {
      return authProfileUiRuntime?.syncTitleSelect?.(select, profile);
    }

    const authPanelRuntime = window.AppAuthPanelRuntimeLib?.create?.({
      text,
      escapeHtml: value => escapeHtml(value),
      getPanelMarkup: () => authText?.panelMarkup?.() || "",
      openPanel,
      closePanel,
      handleLogin,
      handleRegister,
      handleProfileSave,
      handleActiveTitleChange,
      handleLogout,
      toggleSummaryDetails,
      toggleProfileEditor,
      isEscBound: () => escBound,
      setEscBound: value => {
        escBound = Boolean(value);
      }
    });

    const authLifecycleRuntime = window.AppAuthLifecycleRuntimeLib?.create?.({
      ensureAuthPanelUi,
      authPanelRuntime,
      openPanel,
      closePanel,
      handleLogin,
      handleRegister,
      handleProfileSave,
      handleActiveTitleChange,
      handleLogout,
      toggleSummaryDetails,
      toggleProfileEditor,
      restoreSession,
      renderAuthState,
      syncPlayerProfile,
      getSessionSyncState: () => ({
        bound: sessionSyncBound,
        inFlight: sessionSyncInFlight
      }),
      setSessionSyncState: value => {
        sessionSyncBound = Boolean(value?.bound);
        sessionSyncInFlight = value?.inFlight || null;
      }
    }) || null;

    function ensureUi() {
      return authLifecycleRuntime?.ensureUi?.();
    }

    function ensureAuthButton() {
      return authLifecycleRuntime?.ensureAuthButton?.();
    }

    function ensureAuthPanel() {
      return authLifecycleRuntime?.ensureAuthPanel?.();
    }

    function bindEscClose() {
      return authLifecycleRuntime?.bindEscClose?.();
    }

    function bindSessionSync() {
      return authLifecycleRuntime?.bindSessionSync?.();
    }

    return {
      ensureUi,
      ensureAuthButton,
      ensureAuthPanel,
      bindEscClose,
      bindSessionSync,
      restoreSession,
      submitAuth,
      handleLogin,
      handleRegister,
      handleProfileSave,
      handleActiveTitleChange,
      handleLogout,
      getCurrentUser,
      openPanel,
      closePanel,
      promptForProfileSetup,
      toggleSummaryDetails,
      toggleProfileEditor,
      syncProfileEditorUi,
      syncPlayerProfile,
      syncTitleSelect,
      renderAuthState
    };
  }

  window.AppAuthLib = {
    create: createAppAuthModule
  };
})();
