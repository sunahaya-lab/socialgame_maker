(function () {
  function createAppAuthLifecycleRuntime(deps) {
    const {
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
      getSessionSyncState,
      setSessionSyncState
    } = deps;

    function ensureUi() {
      ensureAuthButton();
      ensureAuthPanel();
      bindSessionSync();
      renderAuthState();
      syncPlayerProfile();
    }

    function ensureAuthButton() {
      if (ensureAuthPanelUi()?.ensureButton) {
        ensureAuthPanelUi().ensureButton(openPanel);
        return;
      }
      if (authPanelRuntime?.ensureAuthButton) {
        authPanelRuntime.ensureAuthButton();
      }
    }

    function ensureAuthPanel() {
      if (ensureAuthPanelUi()?.ensurePanel) {
        ensureAuthPanelUi().ensurePanel({
          closePanel,
          handleLogin,
          handleRegister,
          handleProfileSave,
          handleActiveTitleChange,
          handleLogout,
          toggleSummaryDetails,
          toggleProfileEditor
        });
        bindEscClose();
        return;
      }
      authPanelRuntime?.ensureAuthPanel?.();
      bindEscClose();
    }

    function bindEscClose() {
      if (authPanelRuntime?.bindEscClose) {
        authPanelRuntime.bindEscClose();
      }
    }

    function bindSessionSync() {
      const state = getSessionSyncState();
      if (state.bound) return;
      const syncSession = () => {
        const current = getSessionSyncState();
        if (document.visibilityState === "hidden") return;
        if (current.inFlight) return;
        const inFlight = restoreSession()
          .catch(error => {
            console.error("Failed to sync auth session:", error);
          })
          .finally(() => {
            const latest = getSessionSyncState();
            setSessionSyncState({ ...latest, inFlight: null });
          });
        setSessionSyncState({ ...current, inFlight });
      };
      window.addEventListener("focus", syncSession);
      document.addEventListener("visibilitychange", syncSession);
      setSessionSyncState({ ...state, bound: true });
    }

    return {
      ensureUi,
      ensureAuthButton,
      ensureAuthPanel,
      bindEscClose,
      bindSessionSync
    };
  }

  window.AppAuthLifecycleRuntimeLib = {
    create: createAppAuthLifecycleRuntime
  };
})();
