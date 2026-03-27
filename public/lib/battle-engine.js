(function () {
  function createBattleEngineLib() {
    function getBattleActionLabel(kind) {
      if (kind === "special") return "スペシャル";
      if (kind === "active") return "アクティブスキル";
      return "通常攻撃";
    }

    function buildBattleActionLog({ actorName, kind, damage, effects, defeated }) {
      const suffix = Array.isArray(effects) && effects.length ? ` ${effects.join(" ")}` : "";
      return defeated
        ? `${actorName}の${getBattleActionLabel(kind)}で敵を撃破。${suffix}`
        : `${actorName}の${getBattleActionLabel(kind)}で${damage}ダメージ。${suffix}`;
    }

    function buildEnemyActionLog({ enemyName, targetName, incoming }) {
      return incoming > 0
        ? `${enemyName} hit ${targetName} for ${incoming} damage.`
        : `${enemyName} attacked ${targetName}, but the shield absorbed it.`;
    }

    function tickBattleCooldowns(state) {
      state?.party?.forEach(member => {
        if (!member?.cooldowns) return;
        Object.keys(member.cooldowns).forEach(key => {
          member.cooldowns[key] = Math.max(0, Number(member.cooldowns[key] || 0) - 1);
        });
      });
    }

    function hasAliveBattleParty(state) {
      return Boolean(state?.party?.some(member => member?.hp > 0));
    }

    function isManualBattleActionDisabled({
      battleMode,
      state,
      index,
      kind,
      isBattleSkillReady
    }) {
      return (
        battleMode !== "semiAuto" ||
        Number(state?.enemyHp || 0) <= 0 ||
        !hasAliveBattleParty(state) ||
        !isBattleSkillReady(index, kind)
      );
    }

    function getBattleMagnitudeScale(magnitude) {
      if (magnitude === "xl") return 1.9;
      if (magnitude === "large") return 1.45;
      if (magnitude === "medium") return 1.1;
      return 0.8;
    }

    function getLowestHpBattleMember(state, party) {
      const candidates = (state?.party || [])
        .map((member, index) => ({ member, char: party?.[index] || null }))
        .filter(item => item.member?.hp > 0 && item.char);
      if (!candidates.length) return null;
      candidates.sort((a, b) => (a.member.hp / a.member.maxHp) - (b.member.hp / b.member.maxHp));
      return candidates[0];
    }

    function applySkillPartsToBattle({ parts, actor, actorState, state, party }) {
      const result = { damageBonus: 0, logs: [] };
      (parts || []).forEach(part => {
        const scale = getBattleMagnitudeScale(part?.magnitude);
        if (part?.type === "physical" || part?.type === "magic") {
          result.damageBonus += Math.round((Number(actor?.battleKit?.atk) || 100) * 0.35 * scale);
          return;
        }
        if (part?.type === "heal") {
          const target = getLowestHpBattleMember(state, party);
          if (!target) return;
          const amount = Math.round((Number(actor?.battleKit?.atk) || 100) * 0.28 * scale) + 20;
          target.member.hp = Math.min(target.member.maxHp, target.member.hp + amount);
          result.logs.push(`${target.char.name} recovered ${amount} HP.`);
          return;
        }
        if (part?.type === "shield") {
          const amount = Math.round((Number(actor?.battleKit?.atk) || 100) * 0.22 * scale) + 18;
          actorState.shield += amount;
          result.logs.push(`${actor.name} gained ${amount} shield.`);
          return;
        }
        if (part?.type === "buff") {
          actorState.atkBuff = Math.min(1.2, (actorState.atkBuff || 0) + (0.08 * scale));
          result.logs.push(`${actor.name}'s ATK rose.`);
          return;
        }
        if (part?.type === "debuff") {
          state.enemyDebuff = Math.min(0.75, (state.enemyDebuff || 0) + (0.06 * scale));
          result.logs.push(`${state.enemyName} was weakened.`);
        }
      });
      return result;
    }

    function decayBattleStatuses(state) {
      state?.party?.forEach(member => {
        if (!member) return;
        member.atkBuff = Math.max(0, (member.atkBuff || 0) - 0.03);
      });
      state.enemyDebuff = Math.max(0, (state.enemyDebuff || 0) - 0.025);
    }

    function runEnemyAction({ state, party }) {
      if (!state || state.enemyHp <= 0) return { ok: false, code: "enemy_defeated" };
      const aliveMembers = (state.party || [])
        .map((member, index) => ({ member, char: party?.[index] || null }))
        .filter(item => item.member?.hp > 0 && item.char);
      if (!aliveMembers.length) {
        state.log = "Party wiped out.";
        return { ok: false, code: "party_wiped" };
      }

      const target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
      let incoming = 42 + Math.floor(Math.random() * 34);
      if (target.member.shield > 0) {
        const absorbed = Math.min(target.member.shield, incoming);
        target.member.shield -= absorbed;
        incoming -= absorbed;
      }
      target.member.hp = Math.max(0, target.member.hp - incoming);
      state.log = buildEnemyActionLog({
        enemyName: state.enemyName,
        targetName: target.char.name,
        incoming
      });
      return { ok: true, code: "enemy_action", target, incoming };
    }

    function runBattleAction({
      kind,
      forcedIndex = null,
      state,
      party,
      isBattleSkillReady,
      getLeaderAtkRate
    }) {
      if (!state || state.enemyHp <= 0) return { ok: false, code: "enemy_defeated" };

      const aliveParty = (party || [])
        .map((char, index) => ({ char, state: state.party?.[index], index }))
        .filter(item => item.char && item.state?.hp > 0);
      if (!aliveParty.length) {
        state.log = "No party members assigned.";
        return { ok: false, code: "empty_party" };
      }

      const selected = forcedIndex === null
        ? aliveParty[Math.floor(Math.random() * aliveParty.length)]
        : aliveParty.find(item => item.index === forcedIndex);
      if (!selected) return { ok: false, code: "actor_missing" };

      const { char: actor, state: actorState, index: actorIndex } = selected;
      const actorAtk = Math.max(0, Number(actor?.battleKit?.atk) || 100);
      const leaderAtkRate = Number(getLeaderAtkRate?.(actorIndex) || 0);
      const effectiveAtk = actorAtk * (1 + leaderAtkRate) * (1 + (actorState.atkBuff || 0)) * (1 + (state.enemyDebuff || 0));
      const baseDamage = kind === "special" ? effectiveAtk * 1.8 : kind === "active" ? effectiveAtk * 1.1 : effectiveAtk * 0.55;
      let damage = Math.max(1, Math.round(baseDamage + Math.floor(Math.random() * 24)));
      const effects = [];

      if (kind === "normal" && isBattleSkillReady(actorIndex, "normal")) {
        const effectResult = applySkillPartsToBattle({
          parts: actor?.battleKit?.normalSkill?.parts || [],
          actor,
          actorState,
          state,
          party
        });
        damage += effectResult.damageBonus;
        effects.push(...effectResult.logs);
        actorState.cooldowns.normal = Math.max(0, Number(actor?.battleKit?.normalSkill?.recast) || 0);
      }

      if (kind === "active" || kind === "special") {
        const cooldownKey = kind === "active" ? "active" : "special";
        if (!isBattleSkillReady(actorIndex, cooldownKey)) {
          return { ok: false, code: "cooldown_wait", actorIndex };
        }
        const skillConfig = kind === "special" ? actor?.battleKit?.specialSkill : actor?.battleKit?.activeSkill;
        const effectResult = applySkillPartsToBattle({
          parts: skillConfig?.parts || [],
          actor,
          actorState,
          state,
          party
        });
        damage += effectResult.damageBonus;
        effects.push(...effectResult.logs);
        actorState.cooldowns[cooldownKey] = Math.max(0, Number(skillConfig?.recast) || 0);
      }

      state.enemyHp = Math.max(0, state.enemyHp - damage);
      state.lastActionAt = Date.now();
      state.turnCount += 1;
      state.log = buildBattleActionLog({
        actorName: actor.name,
        kind,
        damage,
        effects,
        defeated: state.enemyHp <= 0
      });

      return {
        ok: true,
        code: "battle_action",
        actor,
        actorIndex,
        damage,
        effects,
        defeated: state.enemyHp <= 0
      };
    }

    function decideAutoBattleAction({ state, battleMode, isBattleSkillReady }) {
      if (!state?.party?.length) return null;
      if (battleMode !== "fullAuto") return null;

      const readyMembers = state.party
        .map((member, index) => ({ member, index }))
        .filter(item => item.member?.hp > 0 && (
          isBattleSkillReady(item.index, "active") ||
          isBattleSkillReady(item.index, "special")
        ));
      if (!readyMembers.length) return null;

      const pick = readyMembers[Math.floor(Math.random() * readyMembers.length)];
      const roll = Math.random();
      if (roll > 0.82 && isBattleSkillReady(pick.index, "special")) {
        return { kind: "special", index: pick.index };
      }
      if (isBattleSkillReady(pick.index, "active")) {
        return { kind: "active", index: pick.index };
      }
      if (isBattleSkillReady(pick.index, "special")) {
        return { kind: "special", index: pick.index };
      }
      return null;
    }

    return {
      getBattleActionLabel,
      buildBattleActionLog,
      buildEnemyActionLog,
      tickBattleCooldowns,
      hasAliveBattleParty,
      isManualBattleActionDisabled,
      getBattleMagnitudeScale,
      getLowestHpBattleMember,
      applySkillPartsToBattle,
      decayBattleStatuses,
      runEnemyAction,
      runBattleAction,
      decideAutoBattleAction
    };
  }

  window.BattleEngineLib = {
    create: createBattleEngineLib
  };
})();
