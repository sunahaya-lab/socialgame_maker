(function () {
  function createSystemEditorBattleController(deps) {
    const {
      getFeatureAccess,
      rarityApi
    } = deps;

    function ensureBattleSystemControls() {
      const form = document.getElementById("system-form");
      const preview = form?.querySelector(".system-preview");
      if (!form || !preview || document.getElementById("system-battle-pack-note")) return;

      const battlePackNote = document.createElement("p");
      battlePackNote.id = "system-battle-pack-note";
      battlePackNote.className = "editor-pack-note";
      battlePackNote.hidden = true;
      battlePackNote.textContent = "Battle Pack がない場合、セミオートは選択できません。";

      preview.before(battlePackNote);
      void refreshBattlePackUi();
    }

    function renderSystemPreview() {
      const list = document.getElementById("system-rarity-preview");
      if (!list) return;

      list.innerHTML = rarityApi.getRarityModeConfig().tiers.map(tier =>
        `<span class="system-rarity-chip ${rarityApi.getRarityCssClass(tier.value)}">${rarityApi.esc(rarityApi.getRarityLabel(tier.value))}</span>`
      ).join("");
    }

    async function refreshBattlePackUi() {
      const battleModeSelect = document.getElementById("system-battle-mode-select");
      const note = document.getElementById("system-battle-pack-note");
      if (!battleModeSelect || !note || typeof getFeatureAccess !== "function") return;

      const access = await getFeatureAccess();
      const hasBattlePack = Boolean(access?.battle);
      note.hidden = hasBattlePack;
      note.textContent = hasBattlePack
        ? ""
        : "未所持の場合、戦闘設定はローカルのみに保持されます";

      const semiAutoOption = battleModeSelect.querySelector('option[value="semiAuto"]');
      if (semiAutoOption) semiAutoOption.disabled = false;
    }

    return {
      ensureBattleSystemControls,
      renderSystemPreview,
      refreshBattlePackUi
    };
  }

  window.SociaSystemEditorBattleApp = {
    create: createSystemEditorBattleController
  };
})();
