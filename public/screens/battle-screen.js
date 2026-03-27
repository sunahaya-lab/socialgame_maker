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
      battleControllerLib,
      battleEngineLib,
      battleStateLib,
      battleViewLib,
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
      return battleStateLib.getBattleParty(getPartyFormation(), normalizePartyFormation);
    }

    function formatBattleCooldown(value) {
      const amount = Math.max(0, Number(value) || 0);
      return amount > 0 ? amount : "OK";
    }

    function isBattleSkillReady(index, kind) {
      const member = getBattleState()?.party?.[index];
      return member?.hp > 0 && Math.max(0, Number(member.cooldowns?.[kind] || 0)) <= 0;
    }

    function buildBattlePartyMemberState(cardId, slotIndex = -1) {
      return battleStateLib.buildBattlePartyMemberState(cardId, slotIndex);
    }

    function ensureBattlePartyState() {
      const state = getBattleState();
      const party = getBattleParty();
      battleStateLib.ensureBattlePartyState(state, party);
    }

    function renderBattleScreen() {
      if (!getBattleState()) setBattleState(getDefaultBattleState());
      ensureBattlePartyState();

      const state = getBattleState();
      const systemConfig = getSystemConfig();
      const refs = battleViewLib.getBattleScreenRefs();
      if (!battleViewLib.hasBattleScreenRefs(refs)) return;

      const hpRate = state.enemyMaxHp > 0 ? Math.max(0, state.enemyHp) / state.enemyMaxHp : 0;
      refs.enemyName.textContent = String(state.enemyName || "訓練用ダミー");
      refs.hpFill.style.width = `${Math.max(0, Math.min(100, hpRate * 100))}%`;
      refs.hpText.textContent = `${Math.max(0, state.enemyHp)} / ${state.enemyMaxHp}`;
      refs.modeChip.textContent = systemConfig.battleMode === "semiAuto" ? "SEMI AUTO" : "FULL AUTO";
      refs.log.textContent = state.log;

      const party = getBattleParty();
      refs.roleSummary.textContent = battleStateLib.buildBattleRoleSummary(party);
      refs.strip.innerHTML = battleViewLib.renderBattlePartyCards({
        party,
        partyState: state.party,
        systemConfig,
        buildBattlePartyMemberState,
        getBattleSlotRole: index => battleStateLib.getBattleSlotRole(index)
      });

      refs.strip.querySelectorAll("[data-battle-active]").forEach(button => {
        const index = Number(button.dataset.battleActive);
        button.addEventListener("click", () => triggerBattleAction("active", index));
        button.disabled = battleEngineLib.isManualBattleActionDisabled({
          battleMode: systemConfig.battleMode,
          state,
          index,
          kind: "active",
          isBattleSkillReady
        });
      });
      refs.strip.querySelectorAll("[data-battle-special]").forEach(button => {
        const index = Number(button.dataset.battleSpecial);
        button.addEventListener("click", () => triggerBattleAction("special", index));
        button.disabled = battleEngineLib.isManualBattleActionDisabled({
          battleMode: systemConfig.battleMode,
          state,
          index,
          kind: "special",
          isBattleSkillReady
        });
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
        if (!battleControllerLib.shouldProcessBattleLoop({
          currentScreen: getCurrentScreen(),
          state,
          hasAliveBattleParty: nextState => battleEngineLib.hasAliveBattleParty(nextState)
        })) return;

        battleControllerLib.runBattleLoopStep({
          state,
          systemConfig,
          battleEngineLib,
          isBattleSkillReady,
          triggerBattleAction,
          triggerEnemyAction
        });
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
      const result = battleEngineLib.runBattleAction({
        kind,
        forcedIndex,
        state,
        party: getBattleParty(),
        isBattleSkillReady,
        getLeaderAtkRate: index => index === 0 ? battleStateLib.getLeaderBattleBonus().atkRate : 0
      });
      battleControllerLib.handleBattleActionResult({
        result,
        state,
        battleEngineLib,
        flashBattleHit,
        triggerEnemyAction,
        renderBattleScreen
      });
    }

    function triggerEnemyAction() {
      ensureBattlePartyState();
      const state = getBattleState();
      battleEngineLib.runEnemyAction({
        state,
        party: getBattleParty()
      });
      renderBattleScreen();
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
      triggerEnemyAction,
      flashBattleHit,
      resetBattleState
    };
  }

  window.BattleScreenModule = {
    create: createBattleScreenModule
  };
})();
