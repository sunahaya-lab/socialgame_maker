(function () {
  function createAppAuthSessionFlowRuntime(deps) {
    const {
      ensureAuthSessionRuntime,
      renderAuthState,
      syncPlayerProfile,
      renderPanelStatus,
      showToast,
      setPanelOpen,
      getApiErrorMessage,
      text,
      getCurrentUser,
      setCurrentUser
    } = deps;

    async function restoreSession() {
      try {
        const sessionRuntime = ensureAuthSessionRuntime?.() || null;
        const restoredUser = await sessionRuntime?.restore?.();
        setCurrentUser(restoredUser);
      } catch (error) {
        console.error("Failed to restore auth session:", error);
        setCurrentUser(null);
      }
      renderAuthState();
      return getCurrentUser();
    }

    async function submitAuth(path, payload, successMessage) {
      try {
        renderPanelStatus(text("processing", "Processing..."));
        setCurrentUser(await ensureAuthSessionRuntime()?.submit?.(path, payload));
        renderAuthState();
        syncPlayerProfile();
        renderPanelStatus(successMessage);
        showToast(successMessage);
        setPanelOpen(false);
        return getCurrentUser();
      } catch (error) {
        console.error("Failed to submit auth form:", error);
        const message = getApiErrorMessage(error, text("authFailed", "Authentication failed."));
        renderPanelStatus(message, true);
        showToast(message);
        return null;
      }
    }

    async function handleLogin(event) {
      event.preventDefault();
      const form = event.currentTarget;
      return submitAuth("/api/auth-login", {
        email: String(form.email?.value || "").trim(),
        password: String(form.password?.value || "")
      }, text("loginSuccess", "Logged in."));
    }

    async function handleRegister(event) {
      event.preventDefault();
      const form = event.currentTarget;
      return submitAuth("/api/auth-register", {
        displayName: String(form.displayName?.value || "").trim(),
        email: String(form.email?.value || "").trim(),
        password: String(form.password?.value || "")
      }, text("registerSuccess", "Registered account."));
    }

    async function handleLogout() {
      try {
        setCurrentUser(await ensureAuthSessionRuntime()?.logout?.());
        renderAuthState();
        showToast(text("logoutSuccess", "Logged out."));
        location.reload();
      } catch (error) {
        console.error("Failed to logout:", error);
        showToast(getApiErrorMessage(error, text("logoutFailed", "Failed to log out.")));
      }
    }

    return {
      restoreSession,
      submitAuth,
      handleLogin,
      handleRegister,
      handleLogout
    };
  }

  window.AppAuthSessionFlowRuntimeLib = {
    create: createAppAuthSessionFlowRuntime
  };
})();
