(function () {
  const CANVAS_WIDTH = 480;
  const CANVAS_HEIGHT = 853;

  function createHomeLayoutOverlayModule(deps) {
    const {
      getCharacters,
      getStories,
      getGachas,
      getSystemConfig,
      getPlayerState,
      getBattleState,
      getHomeDialogueState,
      getActiveGacha,
      loadHomeConfig,
      getHomeLayoutPreset,
      syncRecoveredCurrenciesInMemory,
      formatCurrencyBalance,
      getCharacterImageForUsage,
      makeFallbackImage,
      buildGachaRateSummary,
      getBattleParty,
      getGachaHeroImages,
      normalizeLayoutAssetRecord
    } = deps;

    function buildLayoutRuntimeState() {
      const characters = getCharacters();
      const stories = getStories();
      const gachas = getGachas();
      const homeConfig = loadHomeConfig();
      const homeCard1 = characters.find(char => char.id === homeConfig.card1) || characters[0] || null;
      const homeCard2 = homeConfig.mode === 2 ? (characters.find(char => char.id === homeConfig.card2) || null) : null;
      const activeGachaData = getActiveGacha() || gachas[0] || null;
      const eventBanner = getHomeEventBannerData();
      const homeLevel = Math.max(1, characters.length + stories.length * 2 + gachas.length * 3);
      const dialogueState = getHomeDialogueState();
      const stamina = formatCurrencyBalance(syncRecoveredCurrenciesInMemory().find(item => item.key === "stamina"), true);
      const gems = formatCurrencyBalance(syncRecoveredCurrenciesInMemory().find(item => item.key === "gems"));
      const gold = formatCurrencyBalance(syncRecoveredCurrenciesInMemory().find(item => item.key === "gold"));

      return {
        home: {
          backgroundImage: homeConfig.backgroundImage || "",
          level: String(homeLevel),
          playerName: getHomePlayerName(),
          character1: homeCard1 ? { image: homeCard1.image || getCharacterImageForUsage(homeCard1, "formationPortrait") || makeFallbackImage(homeCard1.name, homeCard1.rarity) } : null,
          character2: homeCard2 ? { image: homeCard2.image || getCharacterImageForUsage(homeCard2, "formationPortrait") || makeFallbackImage(homeCard2.name, homeCard2.rarity) } : null,
          speech: dialogueState?.primaryText || "",
          primarySpeech: {
            name: dialogueState?.primaryName || "",
            text: dialogueState?.primaryText || ""
          },
          eventBanner
        },
        currency: {
          stamina: { label: "STA", value: stamina },
          gems: { label: "GEM", value: gems },
          gold: { label: "GOLD", value: gold }
        },
        gacha: {
          title: activeGachaData?.title || "Gacha",
          description: activeGachaData?.description || "",
          activeHeroImages: getGachaHeroImages(activeGachaData),
          single: "single",
          ten: "ten",
          list: gachas.map(gacha => ({
            id: gacha.id,
            title: gacha.title,
            image: getGachaHeroImages(gacha)[0] || ""
          }))
        },
        battle: {
          party: getBattleParty().filter(Boolean),
          enemyHp: getBattleState()?.enemyHp || 0,
          enemyMaxHp: getBattleState()?.enemyMaxHp || 0
        }
      };
    }

    function getHomeEventBannerData() {
      const gachas = getGachas();
      const stories = getStories();
      if (gachas.length > 0) {
        return {
          tag: "EVENT",
          title: gachas[0].title || "",
          subtitle: gachas[0].description || buildGachaRateSummary(gachas[0].rates)
        };
      }
      if (stories.length > 0) {
        return {
          tag: "STORY",
          title: "Latest Story",
          subtitle: stories[0].title || ""
        };
      }
      return null;
    }

    function getHomePlayerName() {
      const name = String(getPlayerState()?.profile?.displayName || "").trim();
      return name || "Player";
    }

    function buildLayoutAssetMap() {
      const map = {};
      (Array.isArray(getSystemConfig()?.layoutAssets?.home) ? getSystemConfig().layoutAssets.home : []).forEach(asset => {
        const normalized = normalizeLayoutAssetRecord(asset);
        if (!normalized) return;
        map[normalized.id] = {
          src: normalized.src,
          name: normalized.name,
          ownerMemberId: normalized.ownerMemberId
        };
      });
      return map;
    }

    function renderHomeLayoutOverlay(layoutPreset = getHomeLayoutPreset()) {
      const overlay = document.getElementById("home-layout-overlay");
      const homeScreen = document.getElementById("screen-home");
      const legacyEvent = document.getElementById("home-event-banner");
      const legacySpeech1 = document.getElementById("home-speech");
      const legacySpeech2 = document.getElementById("home-speech-2");
      const legacyCurrency = document.querySelector(".home-topbar-right");
      const legacyBattle = document.querySelector(".home-side-right");
      const customParts = Array.isArray(layoutPreset?.customParts) ? layoutPreset.customParts : [];
      const shouldRenderOverlay = layoutPreset?.mode === "advanced" && customParts.length > 0;

      if (!overlay || !homeScreen || !window.LayoutSchemaLib || !window.LayoutRuntimeLib || !window.LayoutRendererLib) {
        return;
      }

      if (!shouldRenderOverlay) {
        overlay.innerHTML = "";
        overlay.classList.remove("active");
        overlay.setAttribute("aria-hidden", "true");
        if (legacyEvent) legacyEvent.hidden = false;
        if (legacySpeech1) legacySpeech1.hidden = layoutPreset.speech === "hidden";
        if (legacySpeech2) legacySpeech2.hidden = layoutPreset.speech === "hidden";
        if (legacyCurrency) legacyCurrency.hidden = false;
        if (legacyBattle) legacyBattle.hidden = false;
        homeScreen.classList.remove("home-layout-overlay-active");
        return;
      }

      const overlayLayout = buildOverlayLayout(customParts);
      const renderHost = ensureOverlayStage(overlay);
      const runtime = createOverlayRuntime();
      if (!overlayLayout || !renderHost || !runtime) return;

      window.LayoutRendererLib.renderLayout(renderHost, overlayLayout, runtime);
      fitOverlayStage(renderHost, overlay);
      overlay.classList.add("active");
      overlay.setAttribute("aria-hidden", "false");

      const hasBattleRole = customParts.some(part => part?.role === "battle" && part?.visible !== false);
      const hasEventRole = customParts.some(part => part?.role === "event-banner" && part?.visible !== false);
      const hasSpeechRole = customParts.some(part => part?.role === "speech" && part?.visible !== false);
      const hasCurrencyRole = customParts.some(part => /^currency-/.test(String(part?.role || "")) && part?.visible !== false);

      if (legacyEvent) legacyEvent.hidden = hasEventRole;
      if (legacySpeech1) legacySpeech1.hidden = hasSpeechRole || layoutPreset.speech === "hidden";
      if (legacySpeech2) legacySpeech2.hidden = true;
      if (legacyCurrency) legacyCurrency.hidden = hasCurrencyRole;
      if (legacyBattle) legacyBattle.hidden = hasBattleRole;
      homeScreen.classList.add("home-layout-overlay-active");
    }

    function ensureOverlayStage(overlay) {
      overlay.innerHTML = `<div class="home-layout-overlay-stage"></div>`;
      return overlay.querySelector(".home-layout-overlay-stage");
    }

    function fitOverlayStage(stage, overlay) {
      const bounds = overlay.getBoundingClientRect();
      const scale = Math.min(bounds.width / CANVAS_WIDTH, bounds.height / CANVAS_HEIGHT) || 1;
      const offsetX = Math.max(0, (bounds.width - CANVAS_WIDTH * scale) / 2);
      const offsetY = Math.max(0, (bounds.height - CANVAS_HEIGHT * scale) / 2);
      stage.style.transformOrigin = "top left";
      stage.style.transform = `translate(${Math.round(offsetX)}px, ${Math.round(offsetY)}px) scale(${scale})`;
    }

    function createOverlayRuntime() {
      return window.LayoutRuntimeLib.createLayoutRuntime({
        state: buildLayoutRuntimeState(),
        assetMap: buildLayoutAssetMap(),
        dispatchAction(action) {
          if (!action?.type) return;
          if (action.type === "navigate" && action.target === "battle") {
            window.navigateTo?.("battle");
            return;
          }
          if (action.type === "open_modal" && action.target === "home-config") {
            window.openHomeConfigPanel?.();
            return;
          }
          if (action.type === "open_modal" && action.target === "share") {
            document.getElementById("share-btn")?.click();
          }
        }
      });
    }

    function buildOverlayLayout(customParts) {
      const nodes = customParts
        .map((part, index) => mapPartToNode(part, index))
        .filter(Boolean);
      if (nodes.length === 0) return null;
      return window.LayoutSchemaLib.normalizeScreenLayout({
        screen: "home",
        mode: "advanced",
        nodes
      });
    }

    function mapPartToNode(part, index) {
      const id = String(part?.id || `custom-home-part-${index + 1}`).trim();
      if (!id || part?.visible === false) return null;
      const base = {
        id,
        x: Number(part?.x) || 0,
        y: Number(part?.y) || 0,
        w: Math.max(24, Number(part?.w) || 120),
        h: Math.max(24, Number(part?.h) || 120),
        z: Number(part?.z) || 50,
        visible: part?.visible !== false,
        assetId: String(part?.assetId || "").trim()
      };
      const role = String(part?.role || "decorative").trim();

      if (role === "battle") {
        return {
          ...base,
          type: "button",
          variant: "home-battle",
          label: "BATTLE",
          showText: !base.assetId,
          action: { type: "navigate", target: "battle" }
        };
      }
      if (role === "home-config") {
        return {
          ...base,
          type: "button",
          variant: "home-side",
          label: "HOME",
          showText: !base.assetId,
          action: { type: "open_modal", target: "home-config" }
        };
      }
      if (role === "home-share") {
        return {
          ...base,
          type: "button",
          variant: "home-side",
          label: "SHARE",
          showText: !base.assetId,
          action: { type: "open_modal", target: "share" }
        };
      }
      if (role === "speech") {
        return {
          ...base,
          type: "list",
          bind: "home.primarySpeech",
          variant: "speech-bubble",
          showText: true
        };
      }
      if (role === "event-banner") {
        return {
          ...base,
          type: "list",
          bind: "home.eventBanner",
          variant: "home-event-banner",
          showText: true
        };
      }
      if (role === "currency-stamina" || role === "currency-gems" || role === "currency-gold") {
        const key = role.replace(/^currency-/, "");
        return {
          ...base,
          type: "currency",
          bind: `currency.${key}`,
          showText: true
        };
      }
      return {
        ...base,
        type: "image",
        fit: "contain"
      };
    }

    return {
      buildLayoutRuntimeState,
      getHomeEventBannerData,
      getHomePlayerName,
      buildLayoutAssetMap,
      renderHomeLayoutOverlay
    };
  }

  window.HomeLayoutOverlayModule = {
    create: createHomeLayoutOverlayModule
  };
})();
