(function () {
  function setupSystemEditor(deps) {
    const api = createSystemEditor(deps);

    api.ensureBattleSystemControls();
    api.ensureEventSystemControls();
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
      getStories,
      getCurrentScreen,
      readFileAsDataUrl,
      saveConfig,
      renderAll,
      applyOrientation,
      refreshCollection,
      refreshGacha,
      openFolderManager,
      getFeatureAccess,
      rarityApi,
      showToast
    } = deps;

    let homeLayoutDraft = null;
    let selectedHomeNodeId = "";
    let homeCustomPartsDraft = [];
    let selectedCustomPartId = "";
    let selectedHomeFolderId = "";
    const HOME_NODE_META = {
      "level-label": { label: "レベルラベル", kind: "表示パーツ" },
      "level-value": { label: "レベル値", kind: "表示パーツ" },
      "player-name": { label: "プレイヤー名", kind: "表示パーツ" },
      "home-config": { label: "配置設定ボタン", kind: "ボタン" },
      "home-editor": { label: "編集ボタン", kind: "ボタン" },
      "home-share": { label: "共有ボタン", kind: "ボタン" },
      "currency-stamina": { label: "スタミナ表示", kind: "表示パーツ" },
      "currency-gems": { label: "ジェム表示", kind: "表示パーツ" },
      "currency-gold": { label: "ゴールド表示", kind: "表示パーツ" },
      "event-banner": { label: "イベントバナー", kind: "表示パーツ" },
      speech: { label: "ホームセリフ", kind: "表示パーツ" },
      battle: { label: "バトルボタン", kind: "ボタン" }
    };

    function text(key, fallback) {
      return window.UiTextLib?.get?.(key, fallback) || fallback;
    }

    // Active Stage 1 controller boundary:
    // preview/layout behavior lives in system-editor-preview.js
    const previewController = window.SystemEditorPreviewLib?.create?.({
      getHomeLayoutDraft: () => homeLayoutDraft,
      setHomeLayoutDraft: value => {
        homeLayoutDraft = value;
      },
      buildHomeLayoutDraft,
      getSelectedHomeNodeId: () => selectedHomeNodeId,
      setSelectedHomeNodeId: value => {
        selectedHomeNodeId = value;
      },
      getHomeNodeMeta: () => HOME_NODE_META,
      renderFreePartsEditor,
      renderLayoutAssetSelection: () => renderHomeAssetLibrary(),
      readFileAsDataUrl,
      upsertHomeLayoutAsset
    });

    // Active Stage 1 controller boundary:
    // asset/folder behavior lives in system-editor-assets.js
    const assetsController = window.SystemEditorAssetsLib?.create?.({
      getSystemConfig,
      setSystemConfig,
      getHomeLayoutDraft: () => homeLayoutDraft,
      getSelectedHomeNodeId: () => selectedHomeNodeId,
      getSelectedHomeFolderId: () => selectedHomeFolderId,
      setSelectedHomeFolderId: value => {
        selectedHomeFolderId = value;
      },
      getHomeCustomPartsDraft: () => homeCustomPartsDraft,
      setHomeCustomPartsDraft: value => {
        homeCustomPartsDraft = value;
      },
      renderFreePartsEditor,
      renderLayoutPresetPreview,
      escapeHtml,
      text
    });

    function ensureLayoutPresetControls() {
      const form = document.getElementById("system-form");
      const preview = form?.querySelector(".system-preview");
      if (!form || !preview || document.getElementById("system-home-layout-select")) return;

      const modeLabel = document.createElement("label");
      modeLabel.innerHTML = `
        ホーム配置設定
        <select name="homeLayoutMode" id="system-home-layout-mode-select">
          <option value="preset">Preset</option>
          <option value="advanced">Advanced</option>
        </select>
      `;

      const layoutLabel = document.createElement("label");
      layoutLabel.innerHTML = `
        配置形式
        <select name="homeLayoutPreset" id="system-home-layout-select">
          <option value="single-focus">フォーカス</option>
          <option value="dual-stage">デュアル</option>
        </select>
      `;

      const speechLabel = document.createElement("label");
      speechLabel.innerHTML = `
        会話
        <select name="homeSpeechPreset" id="system-home-speech-select">
          <option value="right-bubble">右吹き出し</option>
          <option value="left-bubble">左吹き出し</option>
          <option value="hidden">非表示</option>
        </select>
      `;

      const presetPanel = document.createElement("section");
      presetPanel.className = "layout-preset-panel";
      presetPanel.innerHTML = `
        <div class="layout-preset-head">
          <h4>部品設定</h4>
          <p>Advanced は部品の見た目を作る場ではなく、置いた素材に役割を割り当てて配置するモードです。</p>
        </div>
        <div class="layout-advanced-panel" id="system-home-advanced-panel" hidden>
          <p class="layout-advanced-note">${escapeHtml(text("editor.advancedNote", "見た目は自前素材で作る前提です ここでは何のボタンか 何を表示する枠か と位置だけを決めます"))}</p>
          <label>
            役割
            <select name="homeNodeTarget" id="system-home-node-target"></select>
          </label>
          <div class="layout-advanced-kind">
            <span class="layout-advanced-kind-label">部品タイプ</span>
            <strong id="system-home-node-kind">-</strong>
          </div>
          <label>
            素材画像
            <input type="file" id="system-home-node-asset" accept="image/*">
          </label>
          <div class="layout-advanced-asset-actions">
            <button type="button" class="btn-secondary" id="system-home-node-asset-clear">画像をクリア</button>
          </div>
          <div class="layout-asset-library">
            <div class="layout-asset-library-head">
              <h5>カスタムパーツ一覧</h5>
              <p>アップした素材はここに残ります。役割ごとに再選択できます。</p>
            </div>
            <div class="layout-advanced-asset-actions">
              <button type="button" class="btn-secondary" id="system-home-open-ui-folders">UIフォルダ管理へ</button>
            </div>
          </div>
          <div class="layout-free-parts">
            <div class="layout-asset-library-head">
              <h5>自由配置</h5>
              <p>役割に縛られない飾りや枠を追加できます。まずは画像部品だけを置けます。</p>
            </div>
            <div class="layout-free-parts-actions">
              <button type="button" class="btn-secondary" id="system-home-add-free-part">素材を追加する</button>
            </div>
            <div class="layout-free-parts-list" id="system-home-free-parts"></div>
          </div>
          <label class="layout-advanced-visibility">
            <input type="checkbox" name="homeNodeShowText" id="system-home-node-show-text">
            テキストを表示する
          </label>
          <div class="layout-advanced-grid">
            <label>X <input type="number" name="homeNodeX" id="system-home-node-x" step="1"></label>
            <label>Y <input type="number" name="homeNodeY" id="system-home-node-y" step="1"></label>
            <label>W <input type="number" name="homeNodeW" id="system-home-node-w" step="1"></label>
            <label>H <input type="number" name="homeNodeH" id="system-home-node-h" step="1"></label>
            <label>奥行き <input type="number" name="homeNodeZ" id="system-home-node-z" step="1"></label>
          </div>
          <label class="layout-advanced-visibility">
            <input type="checkbox" name="homeNodeVisible" id="system-home-node-visible">
            表示する
          </label>
        </div>
        <div class="layout-preset-preview-wrap">
          <div class="layout-preset-preview" id="system-home-layout-preview"></div>
        </div>
      `;

      preview.before(modeLabel, layoutLabel, speechLabel, presetPanel);

      modeLabel.querySelector("select")?.addEventListener("change", handleLayoutModeChange);
      layoutLabel.querySelector("select")?.addEventListener("change", handlePresetOptionChange);
      speechLabel.querySelector("select")?.addEventListener("change", handlePresetOptionChange);
      document.getElementById("system-home-node-target")?.addEventListener("change", handleHomeNodeSelectionChange);
      ["system-home-node-x", "system-home-node-y", "system-home-node-w", "system-home-node-h", "system-home-node-z", "system-home-node-visible"].forEach(id => {
        document.getElementById(id)?.addEventListener("input", handleHomeNodeFieldInput);
        document.getElementById(id)?.addEventListener("change", handleHomeNodeFieldInput);
      });
      document.getElementById("system-home-node-show-text")?.addEventListener("change", handleHomeNodeFieldInput);
      document.getElementById("system-home-node-asset")?.addEventListener("change", handleHomeNodeAssetChange);
      document.getElementById("system-home-node-asset-clear")?.addEventListener("click", handleHomeNodeAssetClear);
      document.getElementById("system-home-add-free-part")?.addEventListener("click", addFreeHomePart);
      document.getElementById("system-home-open-ui-folders")?.addEventListener("click", () => openFolderManager?.("ui"));
    }

    function ensureBattleSystemControls() {
      const form = document.getElementById("system-form");
      const preview = form?.querySelector(".system-preview");
      if (!form || !preview || document.getElementById("system-battle-mode-select")) return;

      const gachaCatalogLabel = document.createElement("label");
      gachaCatalogLabel.innerHTML =         `
        \u88c5\u5099
        <select name="gachaCatalogMode" id="system-gacha-catalog-mode-select">
          <option value="characters_only">\u30ad\u30e3\u30e9\u306e\u307f</option>
          <option value="mixed_shared">\u30ad\u30e3\u30e9\u3068\u88c5\u5099 \u540c\u3058\u30ac\u30c1\u30e3</option>
          <option value="split_catalogs">\u30ad\u30e3\u30e9\u3068\u88c5\u5099 \u5225\u30ac\u30c1\u30e3</option>
        </select>
      `;

      const battleModeLabel = document.createElement("label");
      battleModeLabel.innerHTML =         `
        \u6226\u95d8\u30b7\u30b9\u30c6\u30e0
        <select name="battleMode" id="system-battle-mode-select">
          <option value="fullAuto">\u30d5\u30eb\u30aa\u30fc\u30c8</option>
          <option value="semiAuto">\u30bb\u30df\u30aa\u30fc\u30c8</option>
        </select>
      `;

      const battleVisualLabel = document.createElement("label");
      battleVisualLabel.innerHTML =         `
        \u6226\u95d8\u8868\u793a
        <select name="battleVisualMode" id="system-battle-visual-mode-select">
          <option value="cardIllustration">\u30ab\u30fc\u30c9\u30a4\u30e9\u30b9\u30c8</option>
          <option value="sdCharacter">SD\u30ad\u30e3\u30e9</option>
        </select>
      `;

      const battlePackNote = document.createElement("p");
      battlePackNote.id = "system-battle-pack-note";
      battlePackNote.className = "editor-pack-note";
      battlePackNote.hidden = true;
      battlePackNote.textContent = "Battle Pack がない場合、セミオートは選択できません。";

      preview.before(gachaCatalogLabel, battleModeLabel, battleVisualLabel, battlePackNote);
      void refreshBattlePackUi();
    }

    function ensureEventSystemControls() {
      const form = document.getElementById("system-form");
      const preview = form?.querySelector(".system-preview");
      if (!form || !preview) return;

      if (!document.getElementById("system-battle-pack-note")) {
        const battlePackNote = document.createElement("p");
        battlePackNote.id = "system-battle-pack-note";
        battlePackNote.className = "editor-pack-note";
        battlePackNote.hidden = true;
        battlePackNote.textContent = "Battle Pack がない場合、セミオートは選択できません。";
        preview.before(battlePackNote);
      }

      ensureEventEditorPanel();
      renderEventStoryOptions();
      void refreshBattlePackUi();
      void refreshEventPackUi();
    }

    function ensureEventEditorPanel() {
      const screen = document.getElementById("screen-editor");
      if (!screen || document.getElementById("editor-event")) return;

      const panel = document.createElement("div");
      panel.className = "editor-panel";
      panel.id = "editor-event";
      panel.innerHTML = `
        <p class="editor-desc">イベント導線、交換所、イベント限定カード、ログインボーナスをここで編集します。</p>
        <div id="system-event-pack-fields" class="system-event-window-fields">
          <p id="system-event-panel-note" class="editor-pack-note" hidden>Event Pack がない場合、イベント運用は編集できません。</p>
          <label class="editor-check">
            <input form="system-form" type="checkbox" name="eventEnabled" id="system-event-enabled">
            ホームにイベント導線を表示する
          </label>
          <label>
            イベント名
            <input form="system-form" type="text" name="eventTitle" id="system-event-title" maxlength="80" placeholder="期間限定イベント">
          </label>
          <label>
            補足テキスト
            <input form="system-form" type="text" name="eventSubtitle" id="system-event-subtitle" maxlength="200" placeholder="イベントストーリーや交換所へ遷移できます">
          </label>
          <label>
            導線先ストーリー
            <select form="system-form" name="eventStoryId" id="system-event-story-id"></select>
          </label>
          <label>
            イベント通貨
            <textarea form="system-form" name="eventCurrencies" id="system-event-currencies" rows="4" placeholder="event_medal,イベントメダル,0&#10;event_ticket,イベントチケット,0"></textarea>
          </label>
          <label class="editor-check">
            <input form="system-form" type="checkbox" name="eventExchangeEnabled" id="system-event-exchange-enabled">
            交換所を有効にする
          </label>
          <label>
            交換所ラベル
            <input form="system-form" type="text" name="eventExchangeLabel" id="system-event-exchange-label" maxlength="40" placeholder="イベント交換所">
          </label>
          <label>
            交換所アイテム
            <textarea form="system-form" name="eventExchangeItems" id="system-event-exchange-items" rows="7" placeholder="item-1,育成ポイント補給,gold,5000,growth,resonance,100,1&#10;item-2,記念バッジ,gems,30,event_item,event-badge,1,5&#10;item-3,限定カード,gems,150,card,card-id,1,1"></textarea>
          </label>
          <label>
            表示アイテム
            <textarea form="system-form" name="eventDisplayItems" id="system-event-display-items" rows="5" placeholder="event-badge,記念バッジ,イベント画面に並べるだけの記念アイテム"></textarea>
          </label>
          <label>
            イベント限定カードID
            <textarea form="system-form" name="eventCardIds" id="system-event-card-ids" rows="4" placeholder="card-id-1,イベント限定,交換所で入手&#10;card-id-2,ログイン配布,ログインボーナス7日目で入手"></textarea>
          </label>
          <label class="editor-check">
            <input form="system-form" type="checkbox" name="eventLoginBonusEnabled" id="system-event-login-bonus-enabled">
            ログインボーナスを有効にする
          </label>
          <label>
            ログインボーナス名
            <input form="system-form" type="text" name="eventLoginBonusLabel" id="system-event-login-bonus-label" maxlength="40" placeholder="春ログインボーナス">
          </label>
          <label>
            ログインボーナス報酬
            <textarea form="system-form" name="eventLoginBonusRewards" id="system-event-login-bonus-rewards" rows="7" placeholder="1,gems,50,ジェム x50&#10;2,gold,3000,ゴールド x3000"></textarea>
          </label>
        </div>
      `;
      screen.appendChild(panel);
    }

    function renderSystemForm() {
      const form = document.getElementById("system-form");
      if (!form) return;

      const config = getSystemConfig();
      form.rarityMode.value = config.rarityMode || "classic4";
      if (form.gachaCatalogMode) form.gachaCatalogMode.value = config.gachaCatalogMode || "characters_only";
      form.orientation.value = ["portrait", "landscape", "fullscreen"].includes(config.orientation) ? config.orientation : "portrait";
      if (form.battleMode) form.battleMode.value = config.battleMode || "fullAuto";
      if (form.battleVisualMode) form.battleVisualMode.value = config.battleVisualMode || "cardIllustration";
      renderEventStoryOptions();
      if (form.eventEnabled) form.eventEnabled.checked = config.eventConfig?.enabled === true;
      if (form.eventTitle) form.eventTitle.value = config.eventConfig?.title || "";
      if (form.eventSubtitle) form.eventSubtitle.value = config.eventConfig?.subtitle || "";
      if (form.eventStoryId) form.eventStoryId.value = config.eventConfig?.storyId || "";
      if (form.eventCurrencies) {
        form.eventCurrencies.value = formatEventCurrencies(config.eventConfig?.eventCurrencies);
      }
      if (form.eventExchangeEnabled) form.eventExchangeEnabled.checked = config.eventConfig?.exchangeEnabled === true;
      if (form.eventExchangeLabel) form.eventExchangeLabel.value = config.eventConfig?.exchangeLabel || "";
      if (form.eventExchangeItems) {
        form.eventExchangeItems.value = formatExchangeItems(config.eventConfig?.exchangeItems);
      }
      if (form.eventDisplayItems) {
        form.eventDisplayItems.value = formatDisplayItems(config.eventConfig?.displayItems);
      }
      if (form.eventCardIds) {
        form.eventCardIds.value = formatEventCardIds(config.eventConfig?.eventCardIds);
      }
      if (form.eventLoginBonusEnabled) form.eventLoginBonusEnabled.checked = config.eventConfig?.loginBonusEnabled === true;
      if (form.eventLoginBonusLabel) form.eventLoginBonusLabel.value = config.eventConfig?.loginBonusLabel || "";
      if (form.eventLoginBonusRewards) {
        form.eventLoginBonusRewards.value = formatLoginBonusRewards(config.eventConfig?.loginBonusRewards);
      }
      void refreshBattlePackUi();
      void refreshEventPackUi();
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

    async function refreshBattlePackUi() {
      const battleModeSelect = document.getElementById("system-battle-mode-select");
      const note = document.getElementById("system-battle-pack-note");
      if (!battleModeSelect || !note || typeof getFeatureAccess !== "function") return;
      const access = await getFeatureAccess();
      const hasBattlePack = Boolean(access?.battle);
      note.hidden = hasBattlePack;
      note.textContent = hasBattlePack
        ? ""
        : "\u672a\u6240\u6301\u306e\u5834\u5408\u3001\u6226\u95d8\u8a2d\u5b9a\u306f\u30ed\u30fc\u30ab\u30eb\u306e\u307f\u4fdd\u6301\u3055\u308c\u307e\u3059";
      const semiAutoOption = battleModeSelect.querySelector('option[value="semiAuto"]');
      if (semiAutoOption) semiAutoOption.disabled = false;
      return;
      if (semiAutoOption) semiAutoOption.disabled = !hasBattlePack;
      note.hidden = hasBattlePack;
      if (!hasBattlePack && battleModeSelect.value === "semiAuto") {
        battleModeSelect.value = "fullAuto";
      }
    }

    async function refreshEventPackUi() {
      const eventEnabled = document.getElementById("system-event-enabled");
      const fields = document.getElementById("system-event-pack-fields");
      const panelNote = document.getElementById("system-event-panel-note");
      if (!eventEnabled || !fields || typeof getFeatureAccess !== "function") return;
      const access = await getFeatureAccess();
      const hasEventPack = Boolean(access?.event);
      if (panelNote) {
        panelNote.hidden = hasEventPack;
        panelNote.textContent = hasEventPack
          ? ""
          : "\u672a\u6240\u6301\u306e\u5834\u5408\u3001\u30a4\u30d9\u30f3\u30c8\u8a2d\u5b9a\u306f\u30ed\u30fc\u30ab\u30eb\u306e\u307f\u4fdd\u6301\u3055\u308c\u307e\u3059";
      }
      fields.querySelectorAll("input, select, textarea, button").forEach(element => {
        element.disabled = false;
      });
      return;
      eventEnabled.disabled = !hasEventPack;
      if (panelNote) panelNote.hidden = hasEventPack;
      fields.querySelectorAll("input, select, textarea, button").forEach(element => {
        element.disabled = !hasEventPack;
      });
      if (!hasEventPack) {
        eventEnabled.checked = false;
      }
    }

    function renderEventStoryOptions() {
      const select = document.getElementById("system-event-story-id");
      if (!select) return;
      const stories = Array.isArray(getStories?.()) ? getStories() : [];
      const eventStories = stories.filter(story => String(story?.type || "").trim() === "event");
      const source = eventStories.length > 0 ? eventStories : stories;
      const currentValue = select.value;
      select.innerHTML = `<option value="">イベントストーリーを選択</option>` + source.map(story =>
        `<option value="${escapeHtml(story.id)}">${escapeHtml(story.title || story.id)}</option>`
      ).join("");
      select.value = currentValue;
    }

    function formatLoginBonusRewards(list = []) {
      return (Array.isArray(list) ? list : []).map(item =>
        [
          Math.max(1, Number(item?.day || 0) || 1),
          String(item?.currencyKey || "gems").trim() || "gems",
          Math.max(1, Math.floor(Number(item?.amount || 0) || 1)),
          String(item?.label || "").trim()
        ].join(",")
      ).join("\n");
    }

    function formatEventCurrencies(list = []) {
      return (Array.isArray(list) ? list : []).map(item =>
        [
          String(item?.key || "").trim(),
          String(item?.label || "").trim(),
          Math.max(0, Math.floor(Number(item?.initialAmount || 0) || 0))
        ].join(",")
      ).join("\n");
    }

    function formatExchangeItems(list = []) {
      return (Array.isArray(list) ? list : []).map(item =>
        [
          String(item?.id || "").trim(),
          String(item?.label || "").trim(),
          String(item?.costCurrencyKey || "gold").trim(),
          Math.max(1, Math.floor(Number(item?.costAmount || 0) || 1)),
          String(item?.rewardKind || "currency").trim(),
          String(item?.rewardValue || item?.rewardCurrencyKey || "gems").trim(),
          Math.max(1, Math.floor(Number(item?.rewardAmount || 0) || 1)),
          Math.max(1, Math.floor(Number(item?.stock || 0) || 1))
        ].join(",")
      ).join("\n");
    }

    function parseExchangeItems(value) {
      const lines = String(value || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      if (!lines.length) return [];
      return lines.map((line, index) => {
        const [id, label, costCurrencyKey, costAmount, rewardKind, rewardValue, rewardAmount, stock] = line.split(",").map(part => part.trim());
        return {
          id: String(id || `event-exchange-${index + 1}`).trim(),
          label: String(label || "").trim(),
          costCurrencyKey: normalizeCurrencyKey(costCurrencyKey, "gold"),
          costAmount: Math.max(1, Math.floor(Number(costAmount || 0) || 1)),
          rewardKind: ["currency", "growth", "event_item", "card"].includes(rewardKind) ? rewardKind : "currency",
          rewardValue: String(rewardValue || "").trim(),
          rewardAmount: Math.max(1, Math.floor(Number(rewardAmount || 0) || 1)),
          stock: Math.max(1, Math.floor(Number(stock || 0) || 1))
        };
      }).filter(item => item.id && item.label && item.rewardValue);
    }

    function formatDisplayItems(list = []) {
      return (Array.isArray(list) ? list : []).map(item =>
        [
          String(item?.id || "").trim(),
          String(item?.label || "").trim(),
          String(item?.description || "").trim(),
          String(item?.image || "").trim()
        ].join(",")
      ).join("\n");
    }

    function parseDisplayItems(value) {
      const lines = String(value || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      if (!lines.length) return [];
      return lines.map((line, index) => {
        const [id, label, description = "", image = ""] = line.split(",").map(part => part.trim());
        return {
          id: String(id || `event-item-${index + 1}`).trim(),
          label: String(label || "").trim(),
          description: String(description || "").trim(),
          image: String(image || "").trim()
        };
      }).filter(item => item.id && item.label);
    }

    function formatEventCardIds(list = []) {
      return (Array.isArray(list) ? list : []).map(item => {
        if (typeof item === "string") return String(item || "").trim();
        return [
          String(item?.cardId || item?.id || "").trim(),
          String(item?.label || "").trim(),
          String(item?.acquireText || "").trim()
        ].join(",");
      }).filter(Boolean).join("\n");
    }

    function parseEventCardIds(value) {
      const lines = String(value || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      const seen = new Set();
      return lines.map(line => {
        const [cardIdRaw, label = "", acquireText = ""] = line.split(",").map(part => part.trim());
        const cardId = String(cardIdRaw || "").trim();
        if (!cardId || seen.has(cardId)) return null;
        seen.add(cardId);
        return {
          cardId,
          label: String(label || "").trim(),
          acquireText: String(acquireText || "").trim()
        };
      }).filter(Boolean);
    }

    function parseLoginBonusRewards(value) {
      const lines = String(value || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      if (!lines.length) return [];
      return lines.map((line, index) => {
        const [day, currencyKey, amount, ...labelParts] = line.split(",").map(part => part.trim());
        return {
          day: Math.max(1, Number(day || index + 1) || (index + 1)),
          currencyKey: normalizeCurrencyKey(currencyKey, "gems"),
          amount: Math.max(1, Math.floor(Number(amount || 0) || 1)),
          label: labelParts.join(",").trim()
        };
      });
    }

    function parseEventCurrencies(value) {
      const lines = String(value || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      if (!lines.length) return [];
      return lines.map((line, index) => {
        const [key, label, initialAmount] = line.split(",").map(part => part.trim());
        return {
          key: normalizeCurrencyKey(key, `event_currency_${index + 1}`),
          label: String(label || "").trim(),
          initialAmount: Math.max(0, Math.floor(Number(initialAmount || 0) || 0))
        };
      }).filter(item => item.key && item.label);
    }

    function normalizeCurrencyKey(value, fallback = "gems") {
      const key = String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 40);
      return key || fallback;
    }

    function buildHomeLayoutDraft() {
      const form = document.getElementById("system-form");
      const config = getSystemConfig();
      const mode = form?.homeLayoutMode?.value || config.layoutPresets?.home?.mode || "preset";
      const options = {
        mode,
        layout: form?.homeLayoutPreset?.value || config.layoutPresets?.home?.layout || "single-focus",
        speech: form?.homeSpeechPreset?.value || config.layoutPresets?.home?.speech || "right-bubble"
      };
      return window.SociaLayoutBridge.getEditableHomeLayout({
        options,
        advancedNodes: config.layoutPresets?.home?.advancedNodes || [],
        customParts: homeCustomPartsDraft
      });
    }

    function renderLayoutPresetPreview() {
      return previewController?.renderLayoutPresetPreview?.();
    }

    function ensureHomeRoleSelection() {
      return previewController?.ensureHomeRoleSelection?.();
    }

    function renderAdvancedLayoutControls() {
      return previewController?.renderAdvancedLayoutControls?.();
    }

    function handlePresetOptionChange() {
      return previewController?.handlePresetOptionChange?.();
    }

    function handleLayoutModeChange() {
      return previewController?.handleLayoutModeChange?.();
    }

    function handleHomeNodeSelectionChange(event) {
      return previewController?.handleHomeNodeSelectionChange?.(event);
    }

    function handleHomeNodeFieldInput() {
      return previewController?.handleHomeNodeFieldInput?.();
    }

    async function handleHomeNodeAssetChange(event) {
      return previewController?.handleHomeNodeAssetChange?.(event);
    }

    function handleHomeNodeAssetClear() {
      return previewController?.handleHomeNodeAssetClear?.();
    }

    function upsertHomeLayoutAsset(roleId, src) {
      return assetsController?.upsertHomeLayoutAsset?.(roleId, src) || "";
    }

    function getHomeFolders() {
      return assetsController?.getHomeFolders?.() || [];
    }

    function ensureHomeFolderSelection() {
      return assetsController?.ensureHomeFolderSelection?.();
    }

    function getSelectedHomeFolder() {
      return assetsController?.getSelectedHomeFolder?.() || null;
    }

    function getAssetsForSelectedHomeFolder() {
      return assetsController?.getAssetsForSelectedHomeFolder?.() || [];
    }

    function handleHomeFolderSelectionChange(event) {
      return assetsController?.handleHomeFolderSelectionChange?.(event);
    }

    function renderHomeFolderManager() {
      return assetsController?.renderHomeFolderManager?.();
    }

    function createPersonalHomeFolder() {
      return assetsController?.createPersonalHomeFolder?.();
    }

    function createSharedHomeFolder() {
      return assetsController?.createSharedHomeFolder?.();
    }

    function renameHomeFolder(folderId, nextName) {
      return assetsController?.renameHomeFolder?.(folderId, nextName);
    }

    function deleteHomeFolder(folderId) {
      return assetsController?.deleteHomeFolder?.(folderId);
    }

    function renderHomeAssetLibrary() {
      return assetsController?.renderHomeAssetLibrary?.();
    }

    function applyLibraryAssetToRole(assetId) {
      return assetsController?.applyLibraryAssetToRole?.(assetId);
    }

    function deleteLibraryAsset(assetId) {
      return assetsController?.deleteLibraryAsset?.(assetId);
    }

    function renameLibraryAsset(assetId, nextName) {
      return assetsController?.renameLibraryAsset?.(assetId, nextName);
    }

    function addFreeHomePart() {
      const assets = getAssetsForSelectedHomeFolder();
      const firstAsset = assets[0]?.id ? `asset:${assets[0].id}` : "";
      const nextPart = {
        id: `custom-home-part-${Date.now()}`,
        assetId: firstAsset,
        x: 120,
        y: 120,
        w: 120,
        h: 120,
        z: 60,
        visible: true
      };
      homeCustomPartsDraft = [...homeCustomPartsDraft, nextPart];
      selectedCustomPartId = nextPart.id;
      renderFreePartsEditor();
      renderLayoutPresetPreview();
    }

    function renderFreePartsEditor() {
      const container = document.getElementById("system-home-free-parts");
      if (!container) return;
      const assets = getAssetsForSelectedHomeFolder();
      const assetOptions = assets.map(asset =>
        `<option value="asset:${asset.id}">${escapeHtml(asset.name || asset.id)}</option>`
      ).join("");

      if (homeCustomPartsDraft.length === 0) {
        container.innerHTML = `<p class="layout-asset-library-empty">${escapeHtml(text("editor.emptyFreeParts", "フリーパーツはまだありません"))}</p>`;
        return;
      }

      container.innerHTML = homeCustomPartsDraft.map(part => `
        <article class="layout-free-part-card${part.id === selectedCustomPartId ? " is-active" : ""}" data-free-part-card="${part.id}">
          <div class="layout-free-part-head">
            <strong>${escapeHtml(part.id)}</strong>
            <button type="button" class="btn-secondary" data-free-part-delete="${part.id}">削除</button>
          </div>
          <label>
            アセット
            <select data-free-part-asset="${part.id}">
              <option value="">アセットを選択</option>
              ${assetOptions}
            </select>
          </label>
          <div class="layout-advanced-grid">
            <label>X <input type="number" value="${Math.round(part.x)}" data-free-part-field="${part.id}" data-field="x"></label>
            <label>Y <input type="number" value="${Math.round(part.y)}" data-free-part-field="${part.id}" data-field="y"></label>
            <label>W <input type="number" value="${Math.round(part.w)}" data-free-part-field="${part.id}" data-field="w"></label>
            <label>H <input type="number" value="${Math.round(part.h)}" data-free-part-field="${part.id}" data-field="h"></label>
            <label>奥行き <input type="number" value="${Math.round(part.z)}" data-free-part-field="${part.id}" data-field="z"></label>
          </div>
          <label class="layout-advanced-visibility">
            <input type="checkbox" data-free-part-visible="${part.id}" ${part.visible !== false ? "checked" : ""}>
            表示
          </label>
        </article>
      `).join("");

      container.querySelectorAll("[data-free-part-card]").forEach(card => {
        card.addEventListener("click", () => {
          selectedCustomPartId = card.dataset.freePartCard || "";
          renderFreePartsEditor();
          renderLayoutPresetPreview();
        });
      });
      container.querySelectorAll("[data-free-part-delete]").forEach(button => {
        button.addEventListener("click", event => {
          event.stopPropagation();
          deleteFreeHomePart(button.dataset.freePartDelete);
        });
      });
      container.querySelectorAll("[data-free-part-asset]").forEach(select => {
        const id = select.dataset.freePartAsset;
        const part = homeCustomPartsDraft.find(item => item.id === id);
        if (part) select.value = part.assetId || "";
        select.addEventListener("change", event => updateFreeHomePart(id, { assetId: event.target.value || "" }));
      });
      container.querySelectorAll("[data-free-part-field]").forEach(input => {
        input.addEventListener("input", event => {
          const id = input.dataset.freePartField;
          const field = input.dataset.field;
          updateFreeHomePart(id, { [field]: Number(event.target.value || 0) });
        });
      });
      container.querySelectorAll("[data-free-part-visible]").forEach(input => {
        input.addEventListener("change", () => updateFreeHomePart(input.dataset.freePartVisible, { visible: input.checked }));
      });
    }

    function updateFreeHomePart(id, patch) {
      homeCustomPartsDraft = homeCustomPartsDraft.map(part => {
        if (part.id !== id) return part;
        return {
          ...part,
          ...patch,
          w: Math.max(0, Number((patch.w ?? part.w) || 0)),
          h: Math.max(0, Number((patch.h ?? part.h) || 0))
        };
      });
      selectedCustomPartId = id || selectedCustomPartId;
      renderFreePartsEditor();
      renderLayoutPresetPreview();
    }

    function deleteFreeHomePart(id) {
      homeCustomPartsDraft = homeCustomPartsDraft.filter(part => part.id !== id);
      if (selectedCustomPartId === id) {
        selectedCustomPartId = homeCustomPartsDraft[0]?.id || "";
      }
      renderFreePartsEditor();
      renderLayoutPresetPreview();
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

    function handleSystemModePreview(event) {
      setSystemConfig({
        ...getSystemConfig(),
        rarityMode: event.target.value === "stars5" ? "stars5" : "classic4"
      });

      renderSystemForm();
      if (getCurrentScreen() === "collection") refreshCollection();
    }

    async function handleSystemSubmit(event) {
      event.preventDefault();
      const form = event.target;
      const access = typeof getFeatureAccess === "function" ? await getFeatureAccess() : null;
      const nextConfig = {
        ...getSystemConfig(),
        rarityMode: form.rarityMode.value === "stars5" ? "stars5" : "classic4",
        gachaCatalogMode: ["characters_only", "mixed_shared", "split_catalogs"].includes(form.gachaCatalogMode?.value)
          ? form.gachaCatalogMode.value
          : "characters_only",
        orientation: ["portrait", "landscape", "fullscreen"].includes(form.orientation.value) ? form.orientation.value : "portrait",
        battleMode: ["fullAuto", "semiAuto"].includes(form.battleMode?.value) ? form.battleMode.value : "fullAuto",
        battleVisualMode: ["cardIllustration", "sdCharacter"].includes(form.battleVisualMode?.value)
          ? form.battleVisualMode.value
          : "cardIllustration",
        eventConfig: {
          enabled: form.eventEnabled?.checked === true,
          title: String(form.eventTitle?.value || "").trim(),
          subtitle: String(form.eventSubtitle?.value || "").trim(),
          storyId: String(form.eventStoryId?.value || "").trim(),
          eventCurrencies: parseEventCurrencies(form.eventCurrencies?.value),
          exchangeEnabled: form.eventExchangeEnabled?.checked === true,
          exchangeLabel: String(form.eventExchangeLabel?.value || "").trim(),
          exchangeItems: parseExchangeItems(form.eventExchangeItems?.value),
          displayItems: parseDisplayItems(form.eventDisplayItems?.value),
          eventCardIds: parseEventCardIds(form.eventCardIds?.value),
          loginBonusEnabled: form.eventLoginBonusEnabled?.checked === true,
          loginBonusLabel: String(form.eventLoginBonusLabel?.value || "").trim(),
          loginBonusRewards: parseLoginBonusRewards(form.eventLoginBonusRewards?.value)
        },
        layoutPresets: getSystemConfig().layoutPresets || { home: { mode: "preset", layout: "single-focus", speech: "right-bubble", advancedNodes: [], customParts: [] } },
        layoutAssets: getSystemConfig().layoutAssets || { home: [] },
        assetFolders: getSystemConfig().assetFolders || { home: [] }
      };

      setSystemConfig(nextConfig);
      await saveConfig(nextConfig);
      applyOrientation();
      renderAll();
      if (getCurrentScreen() === "gacha") refreshGacha();
      if (getCurrentScreen() === "collection") refreshCollection();
      showToast("システム設定を保存しました。");
    }

    async function handleSystemSubmit(event) {
      event.preventDefault();
      const form = event.target;
      const access = typeof getFeatureAccess === "function" ? await getFeatureAccess() : null;
      const nextConfig = {
        ...getSystemConfig(),
        rarityMode: form.rarityMode.value === "stars5" ? "stars5" : "classic4",
        gachaCatalogMode: ["characters_only", "mixed_shared", "split_catalogs"].includes(form.gachaCatalogMode?.value)
          ? form.gachaCatalogMode.value
          : "characters_only",
        orientation: ["portrait", "landscape", "fullscreen"].includes(form.orientation.value) ? form.orientation.value : "portrait",
        battleMode: ["fullAuto", "semiAuto"].includes(form.battleMode?.value) ? form.battleMode.value : "fullAuto",
        battleVisualMode: ["cardIllustration", "sdCharacter"].includes(form.battleVisualMode?.value)
          ? form.battleVisualMode.value
          : "cardIllustration",
        eventConfig: {
          enabled: form.eventEnabled?.checked === true,
          title: String(form.eventTitle?.value || "").trim(),
          subtitle: String(form.eventSubtitle?.value || "").trim(),
          storyId: String(form.eventStoryId?.value || "").trim(),
          eventCurrencies: parseEventCurrencies(form.eventCurrencies?.value),
          exchangeEnabled: form.eventExchangeEnabled?.checked === true,
          exchangeLabel: String(form.eventExchangeLabel?.value || "").trim(),
          exchangeItems: parseExchangeItems(form.eventExchangeItems?.value),
          displayItems: parseDisplayItems(form.eventDisplayItems?.value),
          eventCardIds: parseEventCardIds(form.eventCardIds?.value),
          loginBonusEnabled: form.eventLoginBonusEnabled?.checked === true,
          loginBonusLabel: String(form.eventLoginBonusLabel?.value || "").trim(),
          loginBonusRewards: parseLoginBonusRewards(form.eventLoginBonusRewards?.value)
        },
        layoutPresets: getSystemConfig().layoutPresets || { home: { mode: "preset", layout: "single-focus", speech: "right-bubble", advancedNodes: [], customParts: [] } },
        layoutAssets: getSystemConfig().layoutAssets || { home: [] },
        assetFolders: getSystemConfig().assetFolders || { home: [] }
      };

      setSystemConfig(nextConfig);
      await saveConfig(nextConfig);
      applyOrientation();
      renderAll();
      if (getCurrentScreen() === "gacha") refreshGacha();
      if (getCurrentScreen() === "collection") refreshCollection();
      if (!access?.battle && nextConfig.battleMode === "semiAuto") {
        showToast("\u6226\u95d8\u8a2d\u5b9a\u306f\u30ed\u30fc\u30ab\u30eb\u306b\u306e\u307f\u4fdd\u6301\u3055\u308c\u307e\u3057\u305f");
        return;
      }
      if (!access?.event && (
        nextConfig.eventConfig?.enabled ||
        nextConfig.eventConfig?.exchangeEnabled ||
        nextConfig.eventConfig?.loginBonusEnabled
      )) {
        showToast("\u30a4\u30d9\u30f3\u30c8\u8a2d\u5b9a\u306f\u30ed\u30fc\u30ab\u30eb\u306b\u306e\u307f\u4fdd\u6301\u3055\u308c\u307e\u3057\u305f");
        return;
      }
      showToast("\u30b7\u30b9\u30c6\u30e0\u8a2d\u5b9a\u3092\u4fdd\u5b58\u3057\u307e\u3057\u305f");
    }

    return {
      ensureBattleSystemControls,
      ensureEventSystemControls,
      refreshBattlePackUi,
      refreshEventPackUi,
      ensureLayoutPresetControls,
      renderSystemForm,
      renderSystemPreview,
      renderLayoutPresetPreview,
      renderAdvancedLayoutControls,
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

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
