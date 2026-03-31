(function () {
  function createSystemEditorEventController(deps) {
    const {
      getStories,
      getFeatureAccess
    } = deps;

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
          : "未所持の場合、イベント設定はローカルにのみ保持されます";
      }
      fields.querySelectorAll("input, select, textarea, button").forEach(element => {
        element.disabled = false;
      });
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

    function syncEventForm(config) {
      const form = document.getElementById("system-form");
      if (!form) return;
      renderEventStoryOptions();
      if (form.eventEnabled) form.eventEnabled.checked = config.eventConfig?.enabled === true;
      if (form.eventTitle) form.eventTitle.value = config.eventConfig?.title || "";
      if (form.eventSubtitle) form.eventSubtitle.value = config.eventConfig?.subtitle || "";
      if (form.eventStoryId) form.eventStoryId.value = config.eventConfig?.storyId || "";
      if (form.eventCurrencies) form.eventCurrencies.value = formatEventCurrencies(config.eventConfig?.eventCurrencies);
      if (form.eventExchangeEnabled) form.eventExchangeEnabled.checked = config.eventConfig?.exchangeEnabled === true;
      if (form.eventExchangeLabel) form.eventExchangeLabel.value = config.eventConfig?.exchangeLabel || "";
      if (form.eventExchangeItems) form.eventExchangeItems.value = formatExchangeItems(config.eventConfig?.exchangeItems);
      if (form.eventDisplayItems) form.eventDisplayItems.value = formatDisplayItems(config.eventConfig?.displayItems);
      if (form.eventCardIds) form.eventCardIds.value = formatEventCardIds(config.eventConfig?.eventCardIds);
      if (form.eventLoginBonusEnabled) form.eventLoginBonusEnabled.checked = config.eventConfig?.loginBonusEnabled === true;
      if (form.eventLoginBonusLabel) form.eventLoginBonusLabel.value = config.eventConfig?.loginBonusLabel || "";
      if (form.eventLoginBonusRewards) form.eventLoginBonusRewards.value = formatLoginBonusRewards(config.eventConfig?.loginBonusRewards);
    }

    function collectEventConfig(form) {
      return {
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
      };
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

    return {
      ensureEventSystemControls,
      syncEventForm,
      refreshEventPackUi,
      renderEventStoryOptions,
      collectEventConfig
    };
  }

  window.SystemEditorEventLib = {
    create: createSystemEditorEventController
  };
})();
