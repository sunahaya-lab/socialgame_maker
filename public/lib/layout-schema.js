(function () {
  const CANVAS_WIDTH = 480;
  const CANVAS_HEIGHT = 853;
  const SCREENS = ["home", "gacha", "story", "collection", "battle"];
  const NODE_TYPES = ["image", "text", "button", "group", "currency", "character-slot", "gacha-button", "list", "battle-party"];
  const ANCHORS = ["top-left", "top-center", "center", "bottom-center", "bottom-right"];

  function normalizeThemeToken(input) {
    const source = input && typeof input === "object" ? input : {};
    return {
      id: String(source.id || "default_theme").trim(),
      label: String(source.label || "Default Theme").trim(),
      fonts: {
        title: String(source.fonts?.title || "Zen Kaku Gothic New").trim(),
        body: String(source.fonts?.body || "Zen Kaku Gothic New").trim(),
        accent: String(source.fonts?.accent || source.fonts?.title || "Zen Kaku Gothic New").trim()
      },
      colors: {
        bg: String(source.colors?.bg || "#0a0a12").trim(),
        panel: String(source.colors?.panel || "#12121e").trim(),
        panel2: String(source.colors?.panel2 || source.colors?.panel || "#12121e").trim(),
        text: String(source.colors?.text || "#eef0ff").trim(),
        muted: String(source.colors?.muted || "#8a8ea8").trim(),
        accent: String(source.colors?.accent || "#6c5ce7").trim(),
        accent2: String(source.colors?.accent2 || "#a29bfe").trim(),
        danger: String(source.colors?.danger || "#ff6b6b").trim(),
        success: String(source.colors?.success || "#2ecc71").trim()
      },
      effects: {
        panelRadius: Math.max(0, Number(source.effects?.panelRadius) || 18),
        panelShadow: String(source.effects?.panelShadow || "0 18px 40px rgba(0,0,0,0.35)").trim(),
        glow: String(source.effects?.glow || "").trim(),
        borderStyle: ["soft", "hard", "ornate"].includes(source.effects?.borderStyle) ? source.effects.borderStyle : "soft"
      },
      assets: {
        framePrimary: String(source.assets?.framePrimary || "").trim(),
        frameSecondary: String(source.assets?.frameSecondary || "").trim(),
        buttonPrimary: String(source.assets?.buttonPrimary || "").trim(),
        buttonSecondary: String(source.assets?.buttonSecondary || "").trim(),
        ornamentCorner: String(source.assets?.ornamentCorner || "").trim(),
        textureOverlay: String(source.assets?.textureOverlay || "").trim(),
        particleOverlay: String(source.assets?.particleOverlay || "").trim()
      },
      motion: {
        enter: ["fade", "slideUp", "scaleIn"].includes(source.motion?.enter) ? source.motion.enter : "fade",
        emphasis: ["pulse", "shine", "float"].includes(source.motion?.emphasis) ? source.motion.emphasis : "pulse"
      }
    };
  }

  function normalizeLayoutNode(input, index = 0) {
    const source = input && typeof input === "object" ? input : {};
    const type = NODE_TYPES.includes(source.type) ? source.type : "group";
    return {
      id: String(source.id || `node-${index + 1}`).trim(),
      type,
      x: Number(source.x) || 0,
      y: Number(source.y) || 0,
      w: Math.max(0, Number(source.w) || 0),
      h: Math.max(0, Number(source.h) || 0),
      z: Number(source.z) || 0,
      rotation: Number(source.rotation) || 0,
      opacity: source.opacity === undefined ? 1 : Math.max(0, Math.min(1, Number(source.opacity) || 0)),
      visible: source.visible !== false,
      anchor: ANCHORS.includes(source.anchor) ? source.anchor : "top-left",
      lock: source.lock === true,
      styleRef: String(source.styleRef || "").trim(),
      assetId: String(source.assetId || "").trim(),
      fit: ["cover", "contain", "stretch"].includes(source.fit) ? source.fit : "cover",
      maskRadius: Math.max(0, Number(source.maskRadius) || 0),
      text: String(source.text || "").trim(),
      textRole: String(source.textRole || "").trim(),
      fontFamily: String(source.fontFamily || "").trim(),
      fontSize: Math.max(0, Number(source.fontSize) || 0),
      fontWeight: Math.max(0, Number(source.fontWeight) || 0),
      color: String(source.color || "").trim(),
      align: ["left", "center", "right"].includes(source.align) ? source.align : "left",
      stroke: String(source.stroke || "").trim(),
      label: String(source.label || "").trim(),
      variant: String(source.variant || "").trim(),
      showText: source.showText !== false,
      action: normalizeAction(source.action),
      bind: String(source.bind || "").trim(),
      children: Array.isArray(source.children) ? source.children.map(value => String(value || "").trim()).filter(Boolean) : []
    };
  }

  function normalizeAction(input) {
    const source = input && typeof input === "object" ? input : {};
    return {
      type: ["navigate", "open_modal", "trigger_gacha", "open_story"].includes(source.type) ? source.type : "",
      target: String(source.target || "").trim()
    };
  }

  function normalizeScreenLayout(input) {
    const source = input && typeof input === "object" ? input : {};
    return {
      version: 1,
      screen: SCREENS.includes(source.screen) ? source.screen : "home",
      mode: source.mode === "advanced" ? "advanced" : "preset",
      themeId: String(source.themeId || "default_theme").trim(),
      presetId: String(source.presetId || "").trim(),
      canvas: {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT
      },
      nodes: Array.isArray(source.nodes) ? source.nodes.map((node, index) => normalizeLayoutNode(node, index)) : []
    };
  }

  window.LayoutSchemaLib = {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    SCREENS,
    NODE_TYPES,
    normalizeThemeToken,
    normalizeLayoutNode,
    normalizeScreenLayout
  };
})();
