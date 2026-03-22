(function () {
  function setupSystemEditor(deps) {
    const api = createSystemEditor(deps);

    document.getElementById("system-form").addEventListener("submit", api.handleSystemSubmit);
    document.querySelector("#system-form select[name='rarityMode']").addEventListener("change", api.handleSystemModePreview);

    return api;
  }

  function createSystemEditor(deps) {
    const {
      getSystemConfig,
      setSystemConfig,
      getEditState,
      getGachas,
      getCurrentScreen,
      saveConfig,
      renderAll,
      applyOrientation,
      refreshCollection,
      refreshGacha,
      rarityApi,
      showToast
    } = deps;

    function renderSystemForm() {
      const form = document.getElementById("system-form");
      if (!form) return;

      const config = getSystemConfig();
      form.rarityMode.value = config.rarityMode || "classic4";
      form.orientation.value = config.orientation || "auto";
      renderSystemPreview();
      renderCharacterRarityOptions(document.getElementById("character-form")?.rarity.value);
      renderGachaRateInputs(getEditState().gachaId ? getGachas().find(gacha => gacha.id === getEditState().gachaId)?.rates : null);
    }

    function renderSystemPreview() {
      const list = document.getElementById("system-rarity-preview");
      if (!list) return;

      list.innerHTML = rarityApi.getRarityModeConfig().tiers.map(tier =>
        `<span class="system-rarity-chip ${rarityApi.getRarityCssClass(tier.value)}">${rarityApi.esc(rarityApi.getRarityLabel(tier.value))}</span>`
      ).join("");
    }

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

    function handleSystemModePreview(e) {
      setSystemConfig({
        ...getSystemConfig(),
        rarityMode: e.target.value === "stars5" ? "stars5" : "classic4"
      });

      renderSystemForm();
      if (getCurrentScreen() === "collection") refreshCollection();
    }

    async function handleSystemSubmit(e) {
      e.preventDefault();
      const form = e.target;
      const nextConfig = {
        rarityMode: form.rarityMode.value === "stars5" ? "stars5" : "classic4",
        orientation: ["portrait", "landscape", "fullscreen", "auto"].includes(form.orientation.value) ? form.orientation.value : "auto"
      };

      setSystemConfig(nextConfig);
      await saveConfig(nextConfig);
      applyOrientation();
      renderAll();
      if (getCurrentScreen() === "gacha") refreshGacha();
      if (getCurrentScreen() === "collection") refreshCollection();
      showToast("システム設定を保存しました");
    }

    return {
      renderSystemForm,
      renderSystemPreview,
      renderCharacterRarityOptions,
      renderGachaRateInputs,
      handleSystemModePreview,
      handleSystemSubmit
    };
  }

  window.SystemEditor = {
    setupSystemEditor,
    createSystemEditor
  };
})();
