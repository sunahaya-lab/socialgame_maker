(() => {
  function create(deps = {}) {
    let editorFeatureAccessCache = {
      projectId: "",
      userId: "",
      value: null,
      promise: null
    };

    const API = {
      projects: "/api/projects",
      baseChars: "/api/base-chars",
      characters: "/api/entries",
      equipmentCards: "/api/equipment-cards",
      announcements: "/api/announcements",
      assetsUpload: "/api/assets-upload",
      assetsContent: "/api/assets-content",
      stories: "/api/stories",
      gachas: "/api/gachas",
      system: "/api/system",
      playerBootstrap: "/api/player-bootstrap",
      playerProfile: "/api/player-profile",
      playerStoryProgress: "/api/player-story-progress",
      playerGachaPulls: "/api/player-gacha-pulls",
      playerHomePreferences: "/api/player-home-preferences",
      playerEventLoginBonusClaim: "/api/player-event-login-bonus-claim",
      playerEventExchangePurchase: "/api/player-event-exchange-purchase",
      collabShareResolve: "/api/collab-share-resolve",
      shareCollabLink: "/api/share-collab-link",
      sharePublicLink: "/api/share-public-link",
      publicShareResolve: "/api/public-share-resolve",
      projectShareSummary: "/api/project-share-summary",
      projectMembers: "/api/project-members",
      authRegister: "/api/auth-register",
      authLogin: "/api/auth-login",
      authSession: "/api/auth-session",
      authLogout: "/api/auth-logout"
    };

    function apiUrl(path, options = {}) {
      const query = new URLSearchParams();
      const roomId = deps.getRoomId?.() || null;
      const collabToken = deps.getCollabToken?.() || null;
      const publicShareToken = deps.getPublicShareToken?.() || null;
      const currentProjectId = deps.getCurrentProjectId?.() || null;
      if (roomId) query.set("room", roomId);
      if (collabToken) query.set("collab", collabToken);
      if (publicShareToken) query.set("share", publicShareToken);
      if (options.includeProject !== false && currentProjectId) query.set("project", currentProjectId);
      Object.entries(options.query || {}).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") return;
        query.set(key, String(value));
      });
      const text = query.toString();
      return text ? `${path}?${text}` : path;
    }

    async function getEditorFeatureAccess(options = {}) {
      const projectId = String(deps.getCurrentProjectId?.() || "").trim();
      const userId = String(deps.getCurrentPlayerId?.() || "").trim();
      if (!projectId || !userId) {
        return { battle: false, storyFx: false, event: false };
      }

      const force = options === true || options?.force === true;
      if (
        !force &&
        editorFeatureAccessCache.value &&
        editorFeatureAccessCache.projectId === projectId &&
        editorFeatureAccessCache.userId === userId
      ) {
        return editorFeatureAccessCache.value;
      }

      if (
        !force &&
        editorFeatureAccessCache.promise &&
        editorFeatureAccessCache.projectId === projectId &&
        editorFeatureAccessCache.userId === userId
      ) {
        return editorFeatureAccessCache.promise;
      }

      const request = deps.postJSON?.(
        apiUrl(API.projectShareSummary, {
          includeProject: false,
          query: { project: projectId, user: userId }
        }),
        { projectId, userId }
      ).then(response => {
        const entitlements = response?.featureAccess || {};
        const value = {
          battle: Boolean(entitlements.battle),
          storyFx: Boolean(entitlements.storyFx),
          event: Boolean(entitlements.event)
        };
        editorFeatureAccessCache = {
          projectId,
          userId,
          value,
          promise: null
        };
        return value;
      }).catch(error => {
        deps.onFeatureAccessError?.(error);
        const value = { battle: false, storyFx: false, event: false };
        editorFeatureAccessCache = {
          projectId,
          userId,
          value,
          promise: null
        };
        return value;
      });

      editorFeatureAccessCache = {
        projectId,
        userId,
        value: null,
        promise: request
      };
      return request;
    }

    return {
      API,
      apiUrl,
      getEditorFeatureAccess
    };
  }

  window.AppApiRuntimeFactoryLib = {
    create
  };
})();
