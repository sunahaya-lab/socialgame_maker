(function () {
  function createAppDataBootstrapModule(deps) {
    const {
      API,
      apiUrl,
      fetchJSON,
      postJSON,
      getCurrentProjectId,
      getPlayerApiUrl,
      getPlayerState,
      setPlayerState,
      persistPlayerState,
      normalizePlayerCurrencies,
      upsertInventoryRecord,
      clearCharactersLocalCache,
      loadLocal,
      saveLocal,
      getDefaultSystemConfig,
      getDefaultPartyFormation,
      getDefaultBattleState,
      getBaseChars,
      setBaseChars,
      getCharacters,
      setCharacters,
      getEquipmentCards,
      setEquipmentCards,
      getAnnouncements,
      setAnnouncements,
      getStories,
      setStories,
      getGachas,
      setGachas,
      setSystemConfig,
      normalizeCharacterRecord,
      normalizeStoryRecord,
      normalizeFolderList,
      normalizeLayoutAssetRecord,
      normalizeAssetFoldersConfig,
      createDefaultHomeAssetFolder,
      mergeCollectionState,
      normalizePartyFormation,
      setPartyFormation,
      setBattleState,
      loadPlayerState,
      ensureEventCurrencies,
      ensureHomeCurrencyTimer,
    } = deps;

    async function recordGachaPulls(gachaId, resultsOrCount = []) {
      if (!gachaId || !getCurrentProjectId()) return null;

      const count = Array.isArray(resultsOrCount)
        ? resultsOrCount.length
        : Math.max(0, Math.floor(Number(resultsOrCount || 0)));
      if (![1, 10].includes(count)) return null;

      const response = await postJSON(getPlayerApiUrl(API.playerGachaPulls), {
        gachaId,
        count
      });

      if (response?.results?.length) {
        response.results.forEach(result => {
          upsertInventoryRecord({
            cardId: result.cardId,
            quantity: result.quantity
          });
        });
        if (response?.currencies) {
          const playerState = getPlayerState();
          playerState.currencies = normalizePlayerCurrencies(response.currencies);
          setPlayerState(playerState);
        }
        persistPlayerState();
      }

      return response;
    }

    async function loadAllData() {
      clearCharactersLocalCache();
      const localBaseChars = loadLocal("socia-base-chars", []);
      const localCharacters = loadLocal("socia-characters", []);
      const localEquipmentCards = loadLocal("socia-equipment-cards", []);
      const localAnnouncements = loadLocal("socia-announcements", []);
      const localStories = loadLocal("socia-stories", []);
      const localGachas = loadLocal("socia-gachas", []);
      const localSystem = loadLocal("socia-system", getDefaultSystemConfig());

      const [remoteBaseChars, remoteCharacters, remoteEquipmentCards, remoteAnnouncements, remoteStories, remoteGachas, remoteSystem] = await Promise.all([
        fetchJSON(apiUrl(API.baseChars)).then(data => data.baseChars || []).catch(() => null),
        fetchJSON(apiUrl(API.characters)).then(data => data.entries || []).catch(() => null),
        fetchJSON(apiUrl(API.equipmentCards)).then(data => data.equipmentCards || []).catch(() => null),
        fetchJSON(apiUrl(API.announcements)).then(data => data.announcements || []).catch(() => null),
        fetchJSON(apiUrl(API.stories)).then(data => data.stories || []).catch(() => null),
        fetchJSON(apiUrl(API.gachas)).then(data => data.gachas || []).catch(() => null),
        fetchJSON(apiUrl(API.system)).then(data => data.system || getDefaultSystemConfig()).catch(() => null)
      ]);

      setBaseChars(mergeCollectionState(remoteBaseChars, localBaseChars));
      setCharacters(mergeCollectionState(remoteCharacters, localCharacters).map(normalizeCharacterRecord));
      setEquipmentCards(mergeCollectionState(remoteEquipmentCards, localEquipmentCards));
      setAnnouncements(mergeCollectionState(remoteAnnouncements, localAnnouncements));
      setStories(mergeCollectionState(remoteStories, localStories).map(normalizeStoryRecord));
      setGachas(mergeCollectionState(remoteGachas, localGachas));

      const nextSystemConfig = {
        ...getDefaultSystemConfig(),
        ...(remoteSystem || {}),
        ...(localSystem || {}),
        titleScreen: {
          ...getDefaultSystemConfig().titleScreen,
          ...(remoteSystem?.titleScreen || {}),
          ...(localSystem?.titleScreen || {})
        },
        layoutPresets: {
          ...getDefaultSystemConfig().layoutPresets,
          ...(remoteSystem?.layoutPresets || {}),
          ...(localSystem?.layoutPresets || {}),
          home: {
            ...getDefaultSystemConfig().layoutPresets.home,
            ...(remoteSystem?.layoutPresets?.home || {}),
            ...(localSystem?.layoutPresets?.home || {})
          }
        },
        layoutAssets: {
          ...getDefaultSystemConfig().layoutAssets,
          ...(remoteSystem?.layoutAssets || {}),
          ...(localSystem?.layoutAssets || {}),
          home: Array.isArray(localSystem?.layoutAssets?.home)
            ? localSystem.layoutAssets.home
            : (Array.isArray(remoteSystem?.layoutAssets?.home) ? remoteSystem.layoutAssets.home : [])
        },
        assetFolders: {
          ...getDefaultSystemConfig().assetFolders,
          ...(remoteSystem?.assetFolders || {}),
          ...(localSystem?.assetFolders || {}),
          home: Array.isArray(localSystem?.assetFolders?.home)
            ? localSystem.assetFolders.home
            : (Array.isArray(remoteSystem?.assetFolders?.home) ? remoteSystem.assetFolders.home : [])
        }
      };
      const rawTitleScreen = nextSystemConfig.titleScreen || {};
      if (Number(rawTitleScreen.version || 0) < 1) {
        nextSystemConfig.titleScreen = {
          ...getDefaultSystemConfig().titleScreen,
          ...rawTitleScreen,
          version: 1,
          enabled: true
        };
      }
      nextSystemConfig.cardFolders = normalizeFolderList(nextSystemConfig.cardFolders);
      nextSystemConfig.storyFolders = normalizeFolderList(nextSystemConfig.storyFolders);
      nextSystemConfig.layoutAssets = {
        ...getDefaultSystemConfig().layoutAssets,
        ...(nextSystemConfig.layoutAssets || {}),
        home: (Array.isArray(nextSystemConfig?.layoutAssets?.home) ? nextSystemConfig.layoutAssets.home : [])
          .map(asset => normalizeLayoutAssetRecord(asset))
          .filter(Boolean)
      };
      nextSystemConfig.assetFolders = normalizeAssetFoldersConfig(nextSystemConfig.assetFolders);
      if (!nextSystemConfig.assetFolders.home.length) {
        nextSystemConfig.assetFolders.home = [createDefaultHomeAssetFolder()];
      }
      nextSystemConfig.musicAssets = Array.isArray(nextSystemConfig.musicAssets)
        ? nextSystemConfig.musicAssets.filter(item => item && typeof item === "object" && item.id && item.src).slice(0, 10)
        : [];
      nextSystemConfig.homeBgmAssetId = String(nextSystemConfig.homeBgmAssetId || "").trim();
      nextSystemConfig.battleBgmAssetId = String(nextSystemConfig.battleBgmAssetId || "").trim();
      nextSystemConfig.titleMasters = window.TitleSystemLib?.normalizeTitleMasterCollection?.(nextSystemConfig.titleMasters) || [];
      nextSystemConfig.fontPreset = [
        "zen-kaku-gothic-new",
        "noto-sans-jp",
        "m-plus-rounded-1c",
        "yusei-magic",
        "dotgothic16"
      ].includes(String(nextSystemConfig.fontPreset || "").trim())
        ? String(nextSystemConfig.fontPreset).trim()
        : "zen-kaku-gothic-new";
      nextSystemConfig.equipmentMode = ["disabled", "database_only", "enabled"].includes(nextSystemConfig.equipmentMode)
        ? nextSystemConfig.equipmentMode
        : "disabled";
      setSystemConfig(nextSystemConfig);

      saveLocal("socia-base-chars", getBaseChars());
      saveLocal("socia-characters", getCharacters());
      saveLocal("socia-equipment-cards", getEquipmentCards());
      saveLocal("socia-announcements", getAnnouncements());
      saveLocal("socia-stories", getStories());
      saveLocal("socia-gachas", getGachas());
      saveLocal("socia-system", nextSystemConfig);
      setPartyFormation(normalizePartyFormation(loadLocal("socia-party-formation", getDefaultPartyFormation())));
      setBattleState(getDefaultBattleState());
      await loadPlayerState();
      ensureEventCurrencies(nextSystemConfig.eventConfig || {});
      ensureHomeCurrencyTimer();
    }

    return {
      recordGachaPulls,
      loadAllData,
    };
  }

  window.AppDataBootstrapLib = {
    create: createAppDataBootstrapModule
  };
})();
