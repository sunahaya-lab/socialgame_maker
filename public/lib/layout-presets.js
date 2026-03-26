(function () {
  const schemaLib = () => window.LayoutSchemaLib;

  function createHomeStandardPreset(input) {
    const theme = schemaLib().normalizeThemeToken(input?.theme);
    const options = input?.options || {};
    const presetId = options.layout === "dual-stage" ? "home_dual_stage" : "home_single_focus";

    return schemaLib().normalizeScreenLayout({
      screen: "home",
      mode: "preset",
      themeId: theme.id,
      presetId,
      nodes: [
        { id: "bg", type: "image", assetId: "dynamic:homeBg", x: 0, y: 0, w: 480, h: 853, z: 0, fit: "cover" },
        { id: "level-label", type: "text", text: "Lv.", x: 20, y: 12, w: 28, h: 20, z: 22, textRole: "home-level-label" },
        { id: "level-value", type: "text", text: "{home.level}", x: 44, y: 8, w: 44, h: 28, z: 22, textRole: "home-level-value" },
        { id: "player-name", type: "text", text: "{home.playerName}", x: 96, y: 10, w: 154, h: 24, z: 22, textRole: "home-player-name" },
        { id: "home-config", type: "button", label: "??", x: 8, y: 60, w: 52, h: 52, z: 24, variant: "home-side", action: { type: "open_modal", target: "home-config" } },
        { id: "home-editor", type: "button", label: "??", x: 8, y: 120, w: 52, h: 52, z: 24, variant: "home-side", action: { type: "open_modal", target: "editor" } },
        { id: "home-share", type: "button", label: "??", x: 8, y: 180, w: 52, h: 52, z: 24, variant: "home-side", action: { type: "open_modal", target: "share" } },
        { id: "currency-stamina", type: "currency", bind: "currency.stamina", x: 270, y: 10, w: 64, h: 28, z: 20 },
        { id: "currency-gems", type: "currency", bind: "currency.gems", x: 338, y: 10, w: 64, h: 28, z: 20 },
        { id: "currency-gold", type: "currency", bind: "currency.gold", x: 406, y: 10, w: 64, h: 28, z: 20 },
        { id: "main-char", type: "character-slot", bind: "home.character1", x: 28, y: 170, w: 270, h: 520, z: 10, variant: "full-illustration" },
        ...(options.layout === "dual-stage"
          ? [{ id: "sub-char", type: "character-slot", bind: "home.character2", x: 186, y: 194, w: 220, h: 460, z: 11, variant: "full-illustration" }]
          : []),
        { id: "event-banner", type: "list", bind: "home.eventBanner", x: options.layout === "dual-stage" ? 244 : 240, y: 84, w: options.layout === "dual-stage" ? 208 : 224, h: 82, z: 24, variant: "home-event-banner" },
        ...(options.speech === "hidden"
          ? []
          : [{
              id: "speech",
              type: "list",
              bind: "home.primarySpeech",
              x: options.speech === "left-bubble" ? 18 : 248,
              y: 520,
              w: 194,
              h: 96,
              z: 30,
              variant: options.speech === "left-bubble" ? "speech-bubble-left" : "speech-bubble"
            }]),
        { id: "battle", type: "button", label: "??", x: 312, y: 664, w: 144, h: 144, z: 40, variant: "home-battle", action: { type: "navigate", target: "battle" } }
      ]
    });
  }

  function createGachaHeroPreset(input) {
    const theme = schemaLib().normalizeThemeToken(input?.theme);
    const options = input?.options || {};
    const presetId = options.heroLayout === "triple-portrait" ? "gacha_triple_portrait" : "gacha_single_banner";
    const useLeftBanners = options.bannerList === "left";
    const titleX = options.titlePosition === "center-top" ? 90 : 28;

    return schemaLib().normalizeScreenLayout({
      screen: "gacha",
      mode: "preset",
      themeId: theme.id,
      presetId,
      nodes: [
        { id: "bg", type: "image", assetId: theme.assets.textureOverlay || "dynamic:gachaHero1", x: 0, y: 0, w: 480, h: 853, z: 0, fit: "cover" },
        { id: "hero-stage", type: "image", assetId: "dynamic:gachaHero1", x: useLeftBanners ? 110 : 16, y: 76, w: useLeftBanners ? 354 : 448, h: 410, z: 10, fit: "cover", maskRadius: 24 },
        ...(options.heroLayout === "triple-portrait"
          ? [
              { id: "hero-2", type: "image", assetId: "dynamic:gachaHero2", x: 162, y: 104, w: 124, h: 330, z: 11, fit: "contain" },
              { id: "hero-3", type: "image", assetId: "dynamic:gachaHero3", x: 286, y: 104, w: 124, h: 330, z: 11, fit: "contain" }
            ]
          : []),
        { id: "title", type: "text", text: "{gachaTitle}", x: titleX, y: 96, w: 280, h: 42, z: 20, textRole: "title", align: options.titlePosition === "center-top" ? "center" : "left" },
        { id: "desc", type: "text", text: "{gachaDescription}", x: titleX, y: 142, w: 220, h: 58, z: 20, textRole: "body", align: options.titlePosition === "center-top" ? "center" : "left" },
        { id: "single", type: "gacha-button", bind: "gacha.single", label: "Single", x: options.buttonLayout === "overlay-right" ? 258 : 36, y: 706, w: 180, h: 56, z: 30, variant: "secondary", action: { type: "trigger_gacha", target: "single" } },
        { id: "ten", type: "gacha-button", bind: "gacha.ten", label: "Ten", x: options.buttonLayout === "overlay-right" ? 258 : 264, y: 770, w: 180, h: 56, z: 30, variant: "primary", action: { type: "trigger_gacha", target: "ten" } },
        { id: "banner-list", type: "list", bind: "gacha.list", x: useLeftBanners ? 16 : 16, y: useLeftBanners ? 86 : 778, w: useLeftBanners ? 84 : 448, h: useLeftBanners ? 360 : 54, z: 25, variant: useLeftBanners ? "vertical-banners" : "horizontal-banners" }
      ]
    });
  }

  window.LayoutPresetsLib = {
    createHomeStandardPreset,
    createGachaHeroPreset
  };
})();
