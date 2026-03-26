(function () {
  function createBattleScreenModule(deps) {
    const {
      getCharacters,
      getPartyFormation,
      getCurrentScreen,
      getSystemConfig,
      getBattleState,
      setBattleState,
      getBattleLoopTimer,
      setBattleLoopTimer,
      getDefaultBattleState,
      normalizePartyFormation,
      getCharacterBattleVisual,
      normalizeCharacterSdImages,
      makeFallbackImage,
      esc,
      renderBattleScreenExternal
    } = deps;

    function setupBattleControls() {
      const skillButton = document.getElementById("battle-skill-btn");
      const specialButton = document.getElementById("battle-special-btn");
      if (skillButton) skillButton.hidden = true;
      if (specialButton) specialButton.hidden = true;
      document.getElementById("battle-reset-btn")?.addEventListener("click", () => resetBattleState());
    }

    function getBattleParty() {
      return normalizePartyFormation(getPartyFormation())
        .map(cardId => getCharacters().find(char => char.id === cardId) || null);
    }

    function formatBattleCooldown(value) {
      const amount = Math.max(0, Number(value) || 0);
      return amount > 0 ? amount : "OK";
    }

    function isBattleSkillReady(index, kind) {
      const member = getBattleState()?.party?.[index];
      return member?.hp > 0 && Math.max(0, Number(member.cooldowns?.[kind] || 0)) <= 0;
    }

    function buildBattlePartyMemberState(cardId) {
      const char = getCharacters().find(item => item.id === cardId);
      const maxHp = Math.max(1, Number(char?.battleKit?.hp) || 1000);
      return {
        cardId,
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

    function ensureBattlePartyState() {
      const state = getBattleState();
      const party = getBattleParty();
      if (!Array.isArray(state.party) || state.party.length !== party.length) {
        state.party = party.map(char => char ? buildBattlePartyMemberState(char.id) : null);
        return;
      }

      state.party = party.map((char, index) => {
        if (!char) return null;
        const current = state.party[index];
        return current && current.cardId === char.id
          ? current
          : buildBattlePartyMemberState(char.id);
      });
    }

    function renderBattleScreen() {
      if (!getBattleState()) setBattleState(getDefaultBattleState());
      ensureBattlePartyState();

      const state = getBattleState();
      const systemConfig = getSystemConfig();
      const hpFill = document.getElementById("battle-enemy-hpfill");
      const hpText = document.getElementById("battle-enemy-hptext");
      const modeChip = document.getElementById("battle-mode-chip");
      const log = document.getElementById("battle-battlelog");
      const strip = document.getElementById("battle-party-strip");
      if (!hpFill || !hpText || !modeChip || !log || !strip) return;

      const hpRate = state.enemyMaxHp > 0 ? Math.max(0, state.enemyHp) / state.enemyMaxHp : 0;
      hpFill.style.width = `${Math.max(0, Math.min(100, hpRate * 100))}%`;
      hpText.textContent = `${Math.max(0, state.enemyHp)} / ${state.enemyMaxHp}`;
      modeChip.textContent = systemConfig.battleMode === "semiAuto" ? "SEMI AUTO" : "FULL AUTO";
      log.textContent = state.log;

      const party = getBattleParty();
      strip.innerHTML = party.map((char, index) => {
        if (!char) {
          return `<div class="battle-party-card"><div class="battle-party-card-empty">EMPTY</div></div>`;
        }
        const memberState = state.party[index] || buildBattlePartyMemberState(char.id);
        const image = getCharacterBattleVisual(char, "idle", systemConfig) || makeFallbackImage(char.name, char.rarity);
        const isSd = systemConfig.battleVisualMode === "sdCharacter" && normalizeCharacterSdImages(char.sdImages).idle;
        const hpRateParty = memberState.maxHp > 0 ? Math.max(0, memberState.hp) / memberState.maxHp : 0;
        return `
          <div class="battle-party-card${isSd ? " is-sd" : ""}">
            <img src="${image}" alt="${esc(char.name)}">
            <span class="battle-party-hpbar"><span class="battle-party-hpfill" style="width:${Math.max(0, Math.min(100, hpRateParty * 100))}%"></span></span>
            <span class="battle-party-meta">${Math.max(0, memberState.hp)}/${memberState.maxHp}${memberState.shield > 0 ? ` | Shield ${memberState.shield}` : ""}</span>
            <span class="battle-party-actions">
              <button type="button" class="battle-party-action" data-battle-active="${index}">A ${formatBattleCooldown(memberState.cooldowns?.active)}</button>
              <button type="button" class="battle-party-action battle-party-action-special" data-battle-special="${index}">S ${formatBattleCooldown(memberState.cooldowns?.special)}</button>
            </span>
            <span class="battle-party-name">${esc(char.name)}</span>
          </div>
        `;
      }).join("");

      const partyAlive = state.party.some(member => member?.hp > 0);
      strip.querySelectorAll("[data-battle-active]").forEach(button => {
        const index = Number(button.dataset.battleActive);
        button.addEventListener("click", () => triggerBattleAction("active", index));
        button.disabled = systemConfig.battleMode !== "semiAuto" || state.enemyHp <= 0 || !partyAlive || !isBattleSkillReady(index, "active");
      });
      strip.querySelectorAll("[data-battle-special]").forEach(button => {
        const index = Number(button.dataset.battleSpecial);
        button.addEventListener("click", () => triggerBattleAction("special", index));
        button.disabled = systemConfig.battleMode !== "semiAuto" || state.enemyHp <= 0 || !partyAlive || !isBattleSkillReady(index, "special");
      });
    }

    function startBattleLoop() {
      stopBattleLoop();
      setBattleLoopTimer(window.setInterval(() => {
        if (getCurrentScreen() !== "battle") return;
        if (!getBattleState()) setBattleState(getDefaultBattleState());
        ensureBattlePartyState();
        const state = getBattleState();
        const systemConfig = getSystemConfig();
        const partyAlive = state.party.some(member => member?.hp > 0);
        if (!partyAlive || state.enemyHp <= 0) return;

        tickBattleCooldowns();
        triggerBattleAction("normal");

        if (systemConfig.battleMode === "fullAuto") {
          const readyMembers = state.party
            .map((member, index) => ({ member, index }))
            .filter(item => item.member?.hp > 0 && (isBattleSkillReady(item.index, "active") || isBattleSkillReady(item.index, "special")));
          if (readyMembers.length > 0) {
            const pick = readyMembers[Math.floor(Math.random() * readyMembers.length)];
            const roll = Math.random();
            if (roll > 0.82 && isBattleSkillReady(pick.index, "special")) triggerBattleAction("special", pick.index);
            else if (isBattleSkillReady(pick.index, "active")) triggerBattleAction("active", pick.index);
          }
        } else {
          triggerEnemyAction();
        }
      }, 1100));
    }

    function stopBattleLoop() {
      const timer = getBattleLoopTimer();
      if (timer) {
        window.clearInterval(timer);
        setBattleLoopTimer(null);
      }
    }

    function triggerBattleAction(kind, forcedIndex = null) {
      if (!getBattleState()) setBattleState(getDefaultBattleState());
      ensureBattlePartyState();
      const state = getBattleState();
      if (state.enemyHp <= 0) return;

      const aliveParty = getBattleParty()
        .map((char, index) => ({ char, state: state.party[index], index }))
        .filter(item => item.char && item.state?.hp > 0);
      if (aliveParty.length === 0) {
        state.log = "No party members assigned.";
        renderBattleScreen();
        return;
      }

      const selected = forcedIndex === null
        ? aliveParty[Math.floor(Math.random() * aliveParty.length)]
        : aliveParty.find(item => item.index === forcedIndex);
      if (!selected) return;
      const { char: actor, state: actorState, index: actorIndex } = selected;
      const actorAtk = Math.max(0, Number(actor.battleKit?.atk) || 100);
      const effectiveAtk = actorAtk * (1 + (actorState.atkBuff || 0)) * (1 + (state.enemyDebuff || 0));
      const baseDamage = kind === "special" ? effectiveAtk * 1.8 : kind === "active" ? effectiveAtk * 1.1 : effectiveAtk * 0.55;
      let damage = Math.max(1, Math.round(baseDamage + Math.floor(Math.random() * 24)));
      const effects = [];

      if (kind === "normal" && isBattleSkillReady(actorIndex, "normal")) {
        const effectResult = applySkillPartsToBattle(actor.battleKit?.normalSkill?.parts || [], actor, actorState);
        damage += effectResult.damageBonus;
        effects.push(...effectResult.logs);
        actorState.cooldowns.normal = Math.max(0, Number(actor.battleKit?.normalSkill?.recast) || 0);
      }

      if ((kind === "active" || kind === "special")) {
        const cooldownKey = kind === "active" ? "active" : "special";
        if (!isBattleSkillReady(actorIndex, cooldownKey)) return;
        const skillConfig = kind === "special" ? actor.battleKit?.specialSkill : actor.battleKit?.activeSkill;
        const effectResult = applySkillPartsToBattle(skillConfig?.parts || [], actor, actorState);
        damage += effectResult.damageBonus;
        effects.push(...effectResult.logs);
        actorState.cooldowns[cooldownKey] = Math.max(0, Number(skillConfig?.recast) || 0);
      }

      state.enemyHp = Math.max(0, state.enemyHp - damage);
      state.lastActionAt = Date.now();
      state.turnCount += 1;
      state.log = state.enemyHp > 0
        ? `${actor.name}の${kind === "special" ? "スペシャル" : kind === "active" ? "アクティブスキル" : "通常攻撃"}で${damage}ダメージ。${effects.length ? ` ${effects.join(" ")}` : ""}`
        : `${actor.name}の${kind === "special" ? "スペシャル" : kind === "active" ? "アクティブスキル" : "通常攻撃"}で敵を撃破。${effects.length ? ` ${effects.join(" ")}` : ""}`;

      flashBattleHit();
      if (state.enemyHp > 0) {
        decayBattleStatuses();
        triggerEnemyAction();
      }
      renderBattleScreen();
    }

    function tickBattleCooldowns() {
      getBattleState().party.forEach(member => {
        if (!member?.cooldowns) return;
        Object.keys(member.cooldowns).forEach(key => {
          member.cooldowns[key] = Math.max(0, Number(member.cooldowns[key] || 0) - 1);
        });
      });
    }

    function triggerEnemyAction() {
      ensureBattlePartyState();
      const state = getBattleState();
      if (state.enemyHp <= 0) return;
      const aliveMembers = state.party
        .map((member, index) => ({ member, char: getBattleParty()[index] }))
        .filter(item => item.member?.hp > 0 && item.char);
      if (aliveMembers.length === 0) {
        state.log = "Party wiped out.";
        renderBattleScreen();
        return;
      }

      const target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
      let incoming = 42 + Math.floor(Math.random() * 34);
      if (target.member.shield > 0) {
        const absorbed = Math.min(target.member.shield, incoming);
        target.member.shield -= absorbed;
        incoming -= absorbed;
      }
      target.member.hp = Math.max(0, target.member.hp - incoming);
      state.log = incoming > 0
        ? `${state.enemyName} hit ${target.char.name} for ${incoming} damage.`
        : `${state.enemyName} attacked ${target.char.name}, but the shield absorbed it.`;
      renderBattleScreen();
    }

    function applySkillPartsToBattle(parts, actor, actorState) {
      const state = getBattleState();
      const result = { damageBonus: 0, logs: [] };
      parts.forEach(part => {
        const scale = getBattleMagnitudeScale(part.magnitude);
        if (part.type === "physical" || part.type === "magic") {
          result.damageBonus += Math.round((Number(actor.battleKit?.atk) || 100) * 0.35 * scale);
          return;
        }
        if (part.type === "heal") {
          const target = getLowestHpBattleMember();
          if (!target) return;
          const amount = Math.round((Number(actor.battleKit?.atk) || 100) * 0.28 * scale) + 20;
          target.member.hp = Math.min(target.member.maxHp, target.member.hp + amount);
          result.logs.push(`${target.char.name} recovered ${amount} HP.`);
          return;
        }
        if (part.type === "shield") {
          const amount = Math.round((Number(actor.battleKit?.atk) || 100) * 0.22 * scale) + 18;
          actorState.shield += amount;
          result.logs.push(`${actor.name} gained ${amount} shield.`);
          return;
        }
        if (part.type === "buff") {
          actorState.atkBuff = Math.min(1.2, (actorState.atkBuff || 0) + (0.08 * scale));
          result.logs.push(`${actor.name}'s ATK rose.`);
          return;
        }
        if (part.type === "debuff") {
          state.enemyDebuff = Math.min(0.75, (state.enemyDebuff || 0) + (0.06 * scale));
          result.logs.push(`${state.enemyName} was weakened.`);
        }
      });
      return result;
    }

    function getLowestHpBattleMember() {
      ensureBattlePartyState();
      const candidates = getBattleState().party
        .map((member, index) => ({ member, char: getBattleParty()[index] }))
        .filter(item => item.member?.hp > 0 && item.char);
      if (candidates.length === 0) return null;
      candidates.sort((a, b) => (a.member.hp / a.member.maxHp) - (b.member.hp / b.member.maxHp));
      return candidates[0];
    }

    function getBattleMagnitudeScale(magnitude) {
      if (magnitude === "xl") return 1.9;
      if (magnitude === "large") return 1.45;
      if (magnitude === "medium") return 1.1;
      return 0.8;
    }

    function decayBattleStatuses() {
      const state = getBattleState();
      state.party.forEach(member => {
        if (!member) return;
        member.atkBuff = Math.max(0, (member.atkBuff || 0) - 0.03);
      });
      state.enemyDebuff = Math.max(0, (state.enemyDebuff || 0) - 0.025);
    }

    function flashBattleHit() {
      const flash = document.getElementById("battle-hit-flash");
      if (!flash) return;
      flash.classList.remove("is-active");
      void flash.offsetWidth;
      flash.classList.add("is-active");
    }

    function resetBattleState() {
      setBattleState(getDefaultBattleState());
      ensureBattlePartyState();
      renderBattleScreen();
      if (getCurrentScreen() === "battle") startBattleLoop();
    }

    return {
      setupBattleControls,
      renderBattleScreen,
      getBattleParty,
      formatBattleCooldown,
      isBattleSkillReady,
      ensureBattlePartyState,
      buildBattlePartyMemberState,
      startBattleLoop,
      stopBattleLoop,
      triggerBattleAction,
      tickBattleCooldowns,
      triggerEnemyAction,
      applySkillPartsToBattle,
      getLowestHpBattleMember,
      getBattleMagnitudeScale,
      decayBattleStatuses,
      flashBattleHit,
      resetBattleState
    };
  }

  window.BattleScreenModule = {
    create: createBattleScreenModule
  };
})();
