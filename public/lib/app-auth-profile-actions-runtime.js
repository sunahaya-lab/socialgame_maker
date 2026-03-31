(function () {
  function createAppAuthProfileActionsRuntime(deps) {
    const {
      ensureProfileActions,
      ensureAuthSessionRuntime,
      renderAuthState,
      showToast,
      getApiErrorMessage,
      text,
      setCurrentUser
    } = deps;

    async function handleProfileSave(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const displayName = String(form.displayName?.value || "").trim();
      const birthday = String(form.birthday?.value || "").trim();
      await ensureProfileActions()?.saveProfile?.({ displayName, birthday });
    }

    function handleActiveTitleChange(event) {
      ensureProfileActions()?.updateActiveTitle?.(event.currentTarget?.value);
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
      handleProfileSave,
      handleActiveTitleChange,
      handleLogout
    };
  }

  window.AppAuthProfileActionsRuntimeLib = {
    create: createAppAuthProfileActionsRuntime
  };
})();
