(function () {
  function createBattleControllerLib() {
    function shouldProcessBattleLoop({ currentScreen, state, hasAliveBattleParty }) {
      return currentScreen === "battle" &&
        Number(state?.enemyHp || 0) > 0 &&
        hasAliveBattleParty(state);
    }

    function runBattleLoopStep({
      state,
      systemConfig,
      battleEngineLib,
      isBattleSkillReady,
      triggerBattleAction,
      triggerEnemyAction
    }) {
      battleEngineLib.tickBattleCooldowns(state);
      triggerBattleAction("normal");

      if (systemConfig?.battleMode === "fullAuto") {
        const nextAutoAction = battleEngineLib.decideAutoBattleAction({
          state,
          battleMode: systemConfig?.battleMode,
          isBattleSkillReady
        });
        if (nextAutoAction) {
          triggerBattleAction(nextAutoAction.kind, nextAutoAction.index);
        }
        return;
      }

      triggerEnemyAction();
    }

    function handleBattleActionResult({
      result,
      state,
      battleEngineLib,
      flashBattleHit,
      triggerEnemyAction,
      renderBattleScreen
    }) {
      if (!result?.ok) {
        renderBattleScreen();
        return;
      }

      flashBattleHit();
      if (Number(state?.enemyHp || 0) > 0) {
        battleEngineLib.decayBattleStatuses(state);
        triggerEnemyAction();
      }
      renderBattleScreen();
    }

    return {
      shouldProcessBattleLoop,
      runBattleLoopStep,
      handleBattleActionResult
    };
  }

  window.BattleControllerLib = {
    create: createBattleControllerLib
  };
})();
