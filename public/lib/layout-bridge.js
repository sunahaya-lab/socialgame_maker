(function () {
  function createLayoutBridge(deps) {
    const {
      getCharacters,
      getCurrentLayoutOwnerId,
      getHomeAssetFolders,
      resolveHomeAssetFolderAssets,
      resolveSharedAssetFolderAssets,
      upsertHomeLayoutAssetInConfig,
      getHomeLayoutPreset,
      buildLayoutRuntimeState,
      buildLayoutAssetMap,
      navigateTo,
      openEditorSurface,
      openHomeConfigPanel,
      getCharacterImageForUsage,
      makeFallbackImage
    } = deps;

    function getDefaultLayoutThemeToken() {
      return window.LayoutSchemaLib?.normalizeThemeToken?.({
        id: "socia_default",
        label: "Socia Default",
        fonts: {
          title: "Zen Kaku Gothic New",
          body: "Zen Kaku Gothic New",
          accent: "Zen Kaku Gothic New"
        },
        colors: {
          bg: "#0a0a12",
          panel: "#12121e",
          panel2: "#1a1040",
          text: "#eef0ff",
          muted: "#8a8ea8",
          accent: "#6c5ce7",
          accent2: "#a29bfe",
          danger: "#ff6b6b",
          success: "#2ecc71"
        },
        effects: {
          panelRadius: 18,
          panelShadow: "0 18px 40px rgba(0,0,0,0.35)",
          glow: "0 0 24px rgba(162,155,254,0.18)",
          borderStyle: "soft"
        },
        assets: {
          textureOverlay: ""
        },
        motion: {
          enter: "fade",
          emphasis: "pulse"
        }
      }) || null;
    }

    function getGachaHeroImages(gacha) {
      if (!gacha) return [];
      if (Array.isArray(gacha.heroImages) && gacha.heroImages.length > 0) {
        return gacha.heroImages.filter(Boolean).slice(0, 3);
      }
      if (gacha.bannerImage) return [gacha.bannerImage];
      if (Array.isArray(gacha.featured) && gacha.featured.length > 0) {
        return gacha.featured
          .map(id => getCharacters().find(char => char.id === id))
          .filter(Boolean)
          .map(char => char.image || getCharacterImageForUsage(char, "formationWide") || makeFallbackImage(char.name, char.rarity))
          .slice(0, 3);
      }
      return [];
    }

    function getEditableHomeLayout(input = {}) {
      const options = {
        ...getHomeLayoutPreset(),
        ...(input.options || {})
      };
      const baseLayout = window.LayoutPresetsLib?.createHomeStandardPreset?.({
        theme: input.theme || getDefaultLayoutThemeToken(),
        options,
        data: input.data || {}
      }) || null;
      if (!baseLayout) return null;

      const customNodes = Array.isArray(input.advancedNodes) ? input.advancedNodes : options.advancedNodes;
      const customParts = Array.isArray(input.customParts) ? input.customParts : options.customParts;
      const nextNodes = baseLayout.nodes.map(node => {
        if (options.mode !== "advanced" || !Array.isArray(customNodes) || customNodes.length === 0) {
          return node;
        }
        const customMap = new Map(
          customNodes
            .map(item => [String(item?.id || "").trim(), item])
            .filter(entry => entry[0])
        );
        const override = customMap.get(node.id);
        return override ? { ...node, ...override, id: node.id, type: node.type } : node;
      });

      if (options.mode !== "advanced" || !Array.isArray(customParts) || customParts.length === 0) {
        return window.LayoutSchemaLib.normalizeScreenLayout({
          ...baseLayout,
          mode: options.mode === "advanced" ? "advanced" : baseLayout.mode,
          nodes: nextNodes
        });
      }

      return window.LayoutSchemaLib.normalizeScreenLayout({
        ...baseLayout,
        mode: "advanced",
        nodes: [
          ...nextNodes,
          ...customParts
            .filter(part => String(part?.assetId || "").trim())
            .map((part, index) => ({
              id: String(part?.id || `custom-home-part-${index + 1}`),
              type: "image",
              x: Number(part?.x) || 0,
              y: Number(part?.y) || 0,
              w: Math.max(0, Number(part?.w) || 120),
              h: Math.max(0, Number(part?.h) || 120),
              z: Number(part?.z) || 50,
              visible: part?.visible !== false,
              assetId: String(part?.assetId || ""),
              fit: "contain",
              maskRadius: Math.max(0, Number(part?.maskRadius) || 0)
            }))
        ]
      });
    }

    function getHomeRenderableLayout(layoutPreset = getHomeLayoutPreset()) {
      return getEditableHomeLayout({
        options: layoutPreset,
        advancedNodes: layoutPreset?.advancedNodes || [],
        customParts: layoutPreset?.customParts || []
      });
    }

    function createRuntime(overrides = {}) {
      return window.LayoutRuntimeLib?.createLayoutRuntime?.({
        state: buildLayoutRuntimeState(),
        theme: getDefaultLayoutThemeToken(),
        assetMap: {
          ...buildLayoutAssetMap(),
          ...(overrides.assetMap || {})
        },
        resolveDynamicAsset: overrides.resolveDynamicAsset,
        dispatchAction: overrides.dispatchAction || (action => {
          if (!action?.type) return;
          if (action.type === "navigate" && action.target) navigateTo(action.target);
          if (action.type === "trigger_gacha" && action.target === "single") document.getElementById("gacha-single")?.click();
          if (action.type === "trigger_gacha" && action.target === "ten") document.getElementById("gacha-ten")?.click();
          if (action.type === "open_modal" && action.target === "editor") openEditorSurface();
          if (action.type === "open_modal" && action.target === "home-config") openHomeConfigPanel?.();
          if (action.type === "open_modal" && action.target === "share") document.getElementById("share-btn")?.click();
        })
      });
    }

    function generatePresetLayout(screen, input = {}) {
      const theme = input.theme || getDefaultLayoutThemeToken();
      if (screen === "home") {
        return getEditableHomeLayout({
          theme,
          options: input.options || {},
          data: input.data || {},
          advancedNodes: input.advancedNodes || [],
          customParts: input.customParts || []
        });
      }
      if (screen === "gacha") {
        return window.LayoutPresetsLib?.createGachaHeroPreset?.({
          theme,
          options: input.options || {},
          data: input.data || {}
        }) || null;
      }
      return null;
    }

    return {
      getDefaultLayoutThemeToken,
      buildLayoutRuntimeState,
      getCurrentLayoutOwnerId,
      getHomeAssetFolders,
      resolveHomeAssetFolderAssets,
      resolveSharedAssetFolderAssets,
      upsertHomeLayoutAssetInConfig,
      getGachaHeroImages,
      getEditableHomeLayout,
      getHomeRenderableLayout,
      createRuntime,
      generatePresetLayout
    };
  }

  window.LayoutBridgeLib = {
    create: createLayoutBridge
  };
})();
