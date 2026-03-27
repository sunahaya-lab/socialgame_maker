(function () {
  function createBattleStateLib(deps) {
    const {
      getCharacters
    } = deps;

    function getBattleParty(formation, normalizePartyFormation) {
      return normalizePartyFormation(formation)
        .map(cardId => getCharacters().find(char => char.id === cardId) || null);
    }

    function getBattleSlotRole(index) {
      if (index === 0) return { label: "LEADER", className: "is-leader" };
      if (index === 1) return { label: "SUB", className: "is-sub" };
      return { label: `MEMBER ${index - 1}`, className: "" };
    }

    function getLeaderBattleBonus() {
      return {
        hpRate: 0.05,
        atkRate: 0.05
      };
    }

    function buildBattleRoleSummary(party) {
      const leader = party?.[0] || null;
      const subLeader = party?.[1] || null;
      const leaderBonus = getLeaderBattleBonus();
      return leader
        ? `リーダー ${leader.name}${subLeader ? ` / サブ ${subLeader.name}` : ""} / リーダー補正 HP+${Math.round(leaderBonus.hpRate * 100)}%・ATK+${Math.round(leaderBonus.atkRate * 100)}%`
        : "slot1 がリーダー、slot2 がサブリーダーです。";
    }

    function buildBattlePartyMemberState(cardId, slotIndex = -1) {
      const char = getCharacters().find(item => item.id === cardId);
      const baseHp = Math.max(1, Number(char?.battleKit?.hp) || 1000);
      const leaderBonus = slotIndex === 0 ? getLeaderBattleBonus() : null;
      const maxHp = Math.max(1, Math.round(baseHp * (1 + Number(leaderBonus?.hpRate || 0))));
      return {
        cardId,
        slotIndex,
        hp: maxHp,
        maxHp,
        shield: 0,
        atkBuff: 0,
        cooldowns: {
          normal: 0,
          active: 0,
          special: 0
        }
      };
    }

    function ensureBattlePartyState(state, party) {
      if (!Array.isArray(state.party) || state.party.length !== party.length) {
        state.party = party.map((char, index) => char ? buildBattlePartyMemberState(char.id, index) : null);
        return state.party;
      }

      state.party = party.map((char, index) => {
        if (!char) return null;
        const current = state.party[index];
        return current && current.cardId === char.id
          ? current
          : buildBattlePartyMemberState(char.id, index);
      });
      return state.party;
    }

    return {
      getBattleParty,
      getBattleSlotRole,
      getLeaderBattleBonus,
      buildBattleRoleSummary,
      buildBattlePartyMemberState,
      ensureBattlePartyState
    };
  }

  window.BattleStateLib = {
    create: createBattleStateLib
  };
})();
