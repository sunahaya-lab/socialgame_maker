(function () {
  function createAppDataPlayerModule(deps) {
    const {
      searchParams,
      apiUrl,
      API,
      fetchJSON,
      postJSON,
      saveLocal,
      loadLocal,
      storageLoadLocal,
      storageSaveLocal,
      getPlayerIdentityScope,
      getAuthenticatedUserId,
      getCurrentProjectId,
      getPlayerState,
      setPlayerState,
      getDefaultPlayerState,
      mergePlayerState,
      normalizeEquipmentInventory,
      normalizeGrowthResources,
      normalizePlayerCurrencies,
      ensureInstanceCollections,
    } = deps;

    function persistPlayerState() {
      saveLocal("socia-player-state", getPlayerState());
    }

    function getCurrentPlayerId() {
      const authenticated = String(getAuthenticatedUserId?.() || "").trim();
      if (authenticated) return authenticated;

      const explicit = searchParams.get("user");
      if (explicit) return explicit;

      const stored = storageLoadLocal("socia-player-id", null, getPlayerIdentityScope());
      if (stored) return stored;

      const next = crypto.randomUUID();
      storageSaveLocal("socia-player-id", next, getPlayerIdentityScope());
      return next;
    }

    function getPlayerApiUrl(path) {
      return apiUrl(path, {
        query: {
          user: getCurrentPlayerId()
        }
      });
    }

    async function ensurePlayerProfile() {
      if (!getCurrentProjectId()) return null;
      try {
        const response = await postJSON(getPlayerApiUrl(API.playerProfile), {});
        if (response?.profile) {
          const playerState = getPlayerState();
          playerState.profile = {
            ...(playerState.profile || {}),
            ...response.profile,
            unlockedTitleIds: Array.isArray(playerState?.profile?.unlockedTitleIds) ? playerState.profile.unlockedTitleIds : [],
            titles: Array.isArray(playerState?.profile?.titles) ? playerState.profile.titles : [],
            activeTitleId: String(playerState?.profile?.activeTitleId || "").trim()
          };
          setPlayerState(playerState);
          persistPlayerState();
        }
        return response?.profile || null;
      } catch (error) {
        console.error("Failed to ensure player profile:", error);
        return null;
      }
    }

    async function updatePlayerProfile(profileInput = {}) {
      if (!getCurrentProjectId()) {
        throw new Error("プロフィールを保存するにはプロジェクトを選択してください");
      }
      const payload = {
        displayName: String(profileInput?.displayName || "").trim(),
        birthday: String(profileInput?.birthday || "").trim()
      };
      const response = await postJSON(getPlayerApiUrl(API.playerProfile), payload);
      if (response?.profile) {
        const playerState = getPlayerState();
        playerState.profile = {
          ...(playerState.profile || {}),
          ...response.profile,
          unlockedTitleIds: Array.isArray(playerState?.profile?.unlockedTitleIds) ? playerState.profile.unlockedTitleIds : [],
          titles: Array.isArray(playerState?.profile?.titles) ? playerState.profile.titles : [],
          activeTitleId: String(playerState?.profile?.activeTitleId || "").trim()
        };
        setPlayerState(playerState);
        persistPlayerState();
      }
      return response?.profile || null;
    }

    async function loadPlayerState() {
      const localState = loadLocal("socia-player-state", getDefaultPlayerState(getCurrentProjectId(), getCurrentPlayerId()));
      if (!getCurrentProjectId()) {
        const next = getDefaultPlayerState(null, getCurrentPlayerId());
        setPlayerState(next);
        return next;
      }

      let nextState;
      try {
        await ensurePlayerProfile();
        const response = await fetchJSON(getPlayerApiUrl(API.playerBootstrap));
        nextState = mergePlayerState(
          response?.bootstrap || getDefaultPlayerState(getCurrentProjectId(), getCurrentPlayerId()),
          localState || getDefaultPlayerState(getCurrentProjectId(), getCurrentPlayerId())
        );
      } catch (error) {
        console.error("Failed to load player state:", error);
        nextState = localState || getDefaultPlayerState(getCurrentProjectId(), getCurrentPlayerId());
      }

      nextState.equipmentInventory = normalizeEquipmentInventory(nextState.equipmentInventory || []);
      nextState.cardGrowth = nextState.cardGrowth && typeof nextState.cardGrowth === "object"
        ? nextState.cardGrowth
        : {};
      nextState.equipmentGrowth = nextState.equipmentGrowth && typeof nextState.equipmentGrowth === "object"
        ? nextState.equipmentGrowth
        : {};
      nextState.loginBonuses = nextState.loginBonuses && typeof nextState.loginBonuses === "object"
        ? nextState.loginBonuses
        : {};
      nextState.eventExchangePurchases = nextState.eventExchangePurchases && typeof nextState.eventExchangePurchases === "object"
        ? nextState.eventExchangePurchases
        : {};
      nextState.eventItems = nextState.eventItems && typeof nextState.eventItems === "object"
        ? nextState.eventItems
        : {};
      nextState.growthResources = normalizeGrowthResources(nextState.growthResources);
      nextState.currencies = normalizePlayerCurrencies(nextState.currencies);
      ensureInstanceCollections(nextState);
      setPlayerState(nextState);
      persistPlayerState();
      return nextState;
    }

    return {
      persistPlayerState,
      getCurrentPlayerId,
      getPlayerApiUrl,
      ensurePlayerProfile,
      updatePlayerProfile,
      loadPlayerState,
    };
  }

  window.AppDataPlayerLib = {
    create: createAppDataPlayerModule
  };
})();
