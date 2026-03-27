(function () {
  function createBattleViewLib(deps) {
    const {
      getCharacterBattleVisual,
      normalizeCharacterSdImages,
      makeFallbackImage,
      esc
    } = deps;

    function getBattleScreenRefs() {
      return {
        enemyName: document.getElementById("battle-enemy-name"),
        hpFill: document.getElementById("battle-enemy-hpfill"),
        hpText: document.getElementById("battle-enemy-hptext"),
        modeChip: document.getElementById("battle-mode-chip"),
        log: document.getElementById("battle-battlelog"),
        strip: document.getElementById("battle-party-strip"),
        roleSummary: document.getElementById("battle-role-summary")
      };
    }

    function hasBattleScreenRefs(refs) {
      return Boolean(
        refs?.enemyName &&
        refs?.hpFill &&
        refs?.hpText &&
        refs?.modeChip &&
        refs?.log &&
        refs?.strip &&
        refs?.roleSummary
      );
    }

    function renderBattlePartyCards({
      party,
      partyState,
      systemConfig,
      buildBattlePartyMemberState,
      getBattleSlotRole
    }) {
      return (party || []).map((char, index) => {
        if (!char) {
          return `<div class="battle-party-card"><div class="battle-party-card-empty">EMPTY</div></div>`;
        }
        const memberState = partyState?.[index] || buildBattlePartyMemberState(char.id, index);
        const image = getCharacterBattleVisual(char, "idle", systemConfig) || makeFallbackImage(char.name, char.rarity);
        const isSd = systemConfig?.battleVisualMode === "sdCharacter" && normalizeCharacterSdImages(char.sdImages).idle;
        const hpRateParty = memberState.maxHp > 0 ? Math.max(0, memberState.hp) / memberState.maxHp : 0;
        const slotRole = getBattleSlotRole(index);
        return `
          <div class="battle-party-card${isSd ? " is-sd" : ""}">
            <img src="${image}" alt="${esc(char.name)}">
            <span class="battle-party-role ${slotRole.className}">${slotRole.label}</span>
            <span class="battle-party-hpbar"><span class="battle-party-hpfill" style="width:${Math.max(0, Math.min(100, hpRateParty * 100))}%"></span></span>
            <span class="battle-party-meta">${Math.max(0, memberState.hp)}/${memberState.maxHp}${memberState.shield > 0 ? ` | Shield ${memberState.shield}` : ""}</span>
            <span class="battle-party-actions">
              <button type="button" class="battle-party-action" data-battle-active="${index}">A ${Math.max(0, Number(memberState.cooldowns?.active) || 0) || "OK"}</button>
              <button type="button" class="battle-party-action battle-party-action-special" data-battle-special="${index}">S ${Math.max(0, Number(memberState.cooldowns?.special) || 0) || "OK"}</button>
            </span>
            <span class="battle-party-name">${esc(char.name)}</span>
          </div>
        `;
      }).join("");
    }

    return {
      getBattleScreenRefs,
      hasBattleScreenRefs,
      renderBattlePartyCards
    };
  }

  window.BattleViewLib = {
    create: createBattleViewLib
  };
})();
