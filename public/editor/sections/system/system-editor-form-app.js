(function () {
  function createSystemEditorFormController(deps) {
    const {
      getSystemConfig,
      setSystemConfig,
      getCurrentScreen,
      getFeatureAccess,
      titleController,
      rarityApi,
      saveConfig,
      applyOrientation,
      renderAll,
      refreshCollection,
      refreshGacha,
      renderSystemPreview,
      renderTitleScreenPreview,
      refreshBattlePackUi,
      showToast
    } = deps;

    function renderCharacterRarityOptions(selectedValue) {
      const select = document.getElementById("character-rarity-select");
      if (!select) return;

      const normalized = rarityApi.normalizeRarityValue(selectedValue || rarityApi.getRarityModeConfig().fallback);
      select.innerHTML = rarityApi.getRarityModeConfig().tiers.map(tier =>
        `<option value="${tier.value}"${tier.value === normalized ? " selected" : ""}>${rarityApi.esc(rarityApi.getRarityLabel(tier.value))}</option>`
      ).join("");
    }

    function renderGachaRateInputs(values) {
      const wrap = document.getElementById("gacha-rate-inputs");
      if (!wrap) return;

      const rates = rarityApi.normalizeRates(values || rarityApi.getDefaultRates());
      wrap.innerHTML = rarityApi.getRarityModeConfig().tiers.map(tier =>
        `<label>${rarityApi.esc(rarityApi.getRarityLabel(tier.value))} <input name="rate-${tier.value}" type="number" min="0" max="100" value="${rates[tier.value] || 0}">%</label>`
      ).join("");
    }

    function renderSystemForm() {
      const form = document.getElementById("system-form");
      const config = getSystemConfig();
      if (!form || !config) return;

      if (form.orientation) {
        form.orientation.value = ["portrait", "landscape"].includes(config.orientation) ? config.orientation : "portrait";
      }
      if (form.fontPreset) {
        form.fontPreset.value = [
          "zen-kaku-gothic-new",
          "noto-sans-jp",
          "m-plus-rounded-1c",
          "yusei-magic",
          "dotgothic16"
        ].includes(config.fontPreset)
          ? config.fontPreset
          : "zen-kaku-gothic-new";
      }
      if (form.rarityMode) {
        form.rarityMode.value = config.rarityMode === "stars5" ? "stars5" : "classic4";
      }
      if (form.gachaCatalogMode) {
        form.gachaCatalogMode.value = ["characters_only", "mixed_shared", "split_catalogs"].includes(config.gachaCatalogMode)
          ? config.gachaCatalogMode
          : "characters_only";
      }
      if (form.equipmentMode) {
        form.equipmentMode.value = ["disabled", "database_only", "enabled"].includes(config.equipmentMode)
          ? config.equipmentMode
          : "disabled";
      }
      if (form.battleMode) {
        form.battleMode.value = ["fullAuto", "semiAuto"].includes(config.battleMode) ? config.battleMode : "fullAuto";
      }
      if (form.battleVisualMode) {
        form.battleVisualMode.value = ["cardIllustration", "sdCharacter"].includes(config.battleVisualMode)
          ? config.battleVisualMode
          : "cardIllustration";
      }
      titleController?.syncTitleScreenForm?.(config);
      renderCharacterRarityOptions(config.rarityMode);
      renderGachaRateInputs(config.gachaRates || {});
      renderSystemPreview?.();
      renderTitleScreenPreview?.();
      void refreshBattlePackUi?.();
    }

    function handleSystemModePreview(event) {
      setSystemConfig({
        ...getSystemConfig(),
        rarityMode: event.target.value === "stars5" ? "stars5" : "classic4"
      });

      renderSystemForm();
      if (getCurrentScreen?.() === "collection") refreshCollection?.();
    }

    function buildSharedSafeSystemConfig(config, access) {
      const nextConfig = {
        ...config,
        battleMode: access?.battle ? config.battleMode : "fullAuto"
      };

      // Event editing is frozen for release. Keep the local data shape intact,
      // but do not send event configuration through the shared release save path.
      delete nextConfig.eventConfig;
      return nextConfig;
    }

    async function handleSystemSubmit(event) {
      event.preventDefault();
      const form = event.target;
      const access = typeof getFeatureAccess === "function" ? await getFeatureAccess() : null;
      const currentConfig = getSystemConfig();
      const titleScreenConfig = await titleController?.collectTitleScreenConfig?.(form, currentConfig.titleScreen || {});
      const nextConfig = {
        ...currentConfig,
        rarityMode: form.rarityMode.value === "stars5" ? "stars5" : "classic4",
        equipmentMode: ["disabled", "database_only", "enabled"].includes(form.equipmentMode?.value)
          ? form.equipmentMode.value
          : "disabled",
        gachaCatalogMode: ["characters_only", "mixed_shared", "split_catalogs"].includes(form.gachaCatalogMode?.value)
          ? form.gachaCatalogMode.value
          : "characters_only",
        orientation: ["portrait", "landscape"].includes(form.orientation.value) ? form.orientation.value : "portrait",
        fontPreset: [
          "zen-kaku-gothic-new",
          "noto-sans-jp",
          "m-plus-rounded-1c",
          "yusei-magic",
          "dotgothic16"
        ].includes(form.fontPreset?.value)
          ? form.fontPreset.value
          : "zen-kaku-gothic-new",
        battleMode: ["fullAuto", "semiAuto"].includes(form.battleMode?.value) ? form.battleMode.value : "fullAuto",
        battleVisualMode: ["cardIllustration", "sdCharacter"].includes(form.battleVisualMode?.value)
          ? form.battleVisualMode.value
          : "cardIllustration",
        titleScreen: titleScreenConfig || {
          version: 1,
          enabled: false,
          backgroundImage: "",
          logoImage: "",
          pressStartText: "Press Start",
          tapToStartEnabled: true
        },
        eventConfig: currentConfig.eventConfig || {},
        layoutPresets: currentConfig.layoutPresets || { home: { mode: "preset", layout: "single-focus", speech: "right-bubble", advancedNodes: [], customParts: [] } },
        layoutAssets: currentConfig.layoutAssets || { home: [] },
        assetFolders: currentConfig.assetFolders || { home: [] }
      };

      setSystemConfig(nextConfig);
      const sharedSaveConfig = buildSharedSafeSystemConfig(nextConfig, access);
      const saveResult = await saveConfig?.(sharedSaveConfig);
      applyOrientation?.();
      renderAll?.();
      if (getCurrentScreen?.() === "gacha") refreshGacha?.();
      if (getCurrentScreen?.() === "collection") refreshCollection?.();
      if (!access?.battle && nextConfig.battleMode === "semiAuto") {
        showToast?.("戦闘設定はローカルにのみ保持されました");
        return;
      }
      if (saveResult?.sharedSaved === false) {
        return;
      }
      showToast?.("システム設定を保存しました");
    }

    return {
      renderSystemForm,
      renderCharacterRarityOptions,
      renderGachaRateInputs,
      handleSystemModePreview,
      handleSystemSubmit
    };
  }

  window.SociaSystemEditorFormApp = {
    create: createSystemEditorFormController
  };
})();
