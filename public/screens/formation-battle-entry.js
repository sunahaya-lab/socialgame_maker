(function () {
  function createFormationBattleEntry(deps) {
    const {
      getCharacters,
      getPartyFormation,
      getDefaultBattleState,
      setBattleState,
      navigateTo
    } = deps;

    function ensureBattleEntryPanel() {
      const screen = document.getElementById("screen-formation");
      const panel = screen?.querySelector(".formation-panel");
      if (!screen || !panel) return null;

      let section = document.getElementById("formation-battle-entry");
      if (section) return section;

      section = document.createElement("section");
      section.id = "formation-battle-entry";
      section.className = "formation-battle-entry";
      section.innerHTML = `
        <div class="formation-battle-entry-head">
          <div>
            <p class="formation-battle-entry-tag">TEST BATTLE</p>
            <h3>編成確認</h3>
            <p id="formation-battle-summary"></p>
          </div>
          <div class="formation-battle-entry-actions">
            <button type="button" class="btn-secondary" data-battle-template="single">単体敵</button>
            <button type="button" class="btn-secondary" data-battle-template="multi">複数敵</button>
            <button type="button" class="btn-primary" data-battle-template="boss">ボス</button>
          </div>
        </div>
      `;
      section.addEventListener("click", handleBattleEntryClick);
      screen.insertBefore(section, panel);
      return section;
    }

    function renderBattleEntryPanel() {
      const section = ensureBattleEntryPanel();
      const summary = document.getElementById("formation-battle-summary");
      if (!section || !summary) return;

      const formation = getPartyFormation().slice(0, 5);
      const characters = getCharacters();
      const assignedCards = formation
        .map(cardId => characters.find(item => item.id === cardId) || null)
        .filter(Boolean);
      const leader = assignedCards[0] || null;
      const subLeader = assignedCards[1] || null;
      const missing = Math.max(0, 5 - assignedCards.length);

      summary.textContent = leader
        ? `リーダー: ${leader.name}${subLeader ? ` / サブ: ${subLeader.name}` : ""}${missing > 0 ? ` / 空き ${missing}枠` : ""}`
        : "まずはカードを1枚以上編成してください。slot1 がリーダー、slot2 がサブリーダーです。";

      section.querySelectorAll("[data-battle-template]").forEach(button => {
        button.disabled = assignedCards.length <= 0;
      });
    }

    function handleBattleEntryClick(event) {
      const button = event.target.closest("[data-battle-template]");
      if (!button) return;
      const template = String(button.dataset.battleTemplate || "single");
      setBattleState?.(buildTestBattleState(template));
      navigateTo?.("battle");
    }

    function buildTestBattleState(template = "single") {
      const base = getDefaultBattleState?.() || {
        enemyName: "訓練用ダミー",
        enemyHp: 900,
        enemyMaxHp: 900,
        enemyDebuff: 0,
        turnCount: 0,
        party: [],
        log: "バトル準備完了",
        lastActionAt: 0
      };

      if (template === "boss") {
        return {
          ...base,
          enemyName: "試験ボス",
          enemyHp: 4200,
          enemyMaxHp: 4200,
          log: "ボス想定のテストバトルを開始します。"
        };
      }
      if (template === "multi") {
        return {
          ...base,
          enemyName: "訓練用小隊",
          enemyHp: 1800,
          enemyMaxHp: 1800,
          log: "複数敵想定のテストバトルを開始します。"
        };
      }
      return {
        ...base,
        enemyName: "訓練用ダミー",
        enemyHp: 900,
        enemyMaxHp: 900,
        log: "単体敵テストを開始します。"
      };
    }

    return {
      renderBattleEntryPanel
    };
  }

  window.FormationBattleEntryLib = {
    create: createFormationBattleEntry
  };
})();
