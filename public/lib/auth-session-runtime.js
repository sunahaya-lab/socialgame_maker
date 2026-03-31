(function () {
  function createAuthSessionRuntime(deps) {
    const {
      apiGet,
      apiPost
    } = deps;

    async function restore() {
      const response = await apiGet("/api/auth-session");
      return response?.authenticated ? response.user || null : null;
    }

    async function submit(path, payload) {
      const response = await apiPost(path, payload);
      if (response?.authenticated === true) {
        return response.user || null;
      }
      if (response?.ok === true && response?.user) {
        return response.user;
      }
      return null;
    }

    async function logout() {
      await apiPost("/api/auth-logout", {});
      return null;
    }

    return {
      restore,
      submit,
      logout
    };
  }

  window.AuthSessionRuntimeLib = {
    create: createAuthSessionRuntime
  };
})();
