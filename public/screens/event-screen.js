(function () {
  function setupEventScreen(deps) {
    const api = createEventScreen(deps);

    document.getElementById("event-open-story")?.addEventListener("click", () => {
      api.openEventStory();
    });
    document.getElementById("event-open-exchange")?.addEventListener("click", () => {
      api.renderEventScreen();
    });
    document.getElementById("event-open-login-bonus")?.addEventListener("click", () => {
      api.claimLoginBonus();
    });

    return api;
  }

  function createEventScreen(deps) {
    const {
      getSystemConfig,
      getCharacters,
      getStories,
      getOwnedCount,
      showCardDetail,
      getGrowthResources,
      getPlayerCurrencyAmount,
      getEventItemCounts,
      setCurrentStoryType,
      renderStoryScreen,
      openStoryReader,
      getEventExchangeStatus,
      purchaseEventExchangeItem,
      getEventLoginBonusStatus,
      claimEventLoginBonus,
      navigateTo,
      showToast
    } = deps;

    function getEventConfig() {
      return getSystemConfig?.()?.eventConfig || {};
    }

    function getEventStory() {
      const config = getEventConfig();
      const stories = Array.isArray(getStories?.()) ? getStories() : [];
      if (config.storyId) {
        return stories.find(story => story.id === config.storyId) || null;
      }
      return stories.find(story => String(story?.type || "").trim() === "event") || null;
    }

    function getEventCards(config = getEventConfig()) {
      const source = Array.isArray(config?.eventCardIds) ? config.eventCardIds : [];
      const characters = Array.isArray(getCharacters?.()) ? getCharacters() : [];
      return source.map(item => {
        const cardId = typeof item === "string" ? item : (item?.cardId || item?.id || "");
        const card = characters.find(char => char.id === cardId) || null;
        if (!card) return null;
        return {
          ...card,
          eventLabel: typeof item === "string" ? "" : String(item?.label || "").trim(),
          eventAcquireText: typeof item === "string" ? "" : String(item?.acquireText || "").trim()
        };
      }).filter(Boolean);
    }

    function getConfiguredCurrencyMap(config = getEventConfig()) {
      const source = Array.isArray(config?.eventCurrencies) ? config.eventCurrencies : [];
      return new Map(source.map(item => [item.key, item.label || item.key]));
    }

    function getCurrencyLabel(key, config = getEventConfig()) {
      const configuredLabel = getConfiguredCurrencyMap(config).get(String(key || "").trim());
      if (configuredLabel) return configuredLabel;
      if (key === "stamina") return "スタミナ";
      if (key === "gold") return "ゴールド";
      if (key === "gems") return "ジェム";
      return String(key || "").trim() || "通貨";
    }

    function renderEventScreen() {
      const config = getEventConfig();
      const eventStory = getEventStory();
      const eventCards = getEventCards(config);
      const exchangeStatus = getEventExchangeStatus?.(config) || { items: [] };
      const loginBonusStatus = getEventLoginBonusStatus?.(config) || null;
      const isEnabled = Boolean(
        config.enabled &&
        (
          config.title ||
          config.subtitle ||
          eventStory ||
          config.exchangeEnabled ||
          config.loginBonusEnabled ||
          config.displayItems?.length ||
          config.eventCurrencies?.length ||
          eventCards.length
        )
      );

      const title = document.getElementById("event-screen-title");
      const subtitle = document.getElementById("event-screen-subtitle");
      const empty = document.getElementById("event-screen-empty");
      const grid = document.querySelector("#event-screen .event-screen-grid");
      const storyBadge = document.getElementById("event-story-badge");
      const storyCopy = document.getElementById("event-story-copy");
      const storyButton = document.getElementById("event-open-story");
      const exchangeBadge = document.getElementById("event-exchange-badge");
      const exchangeCopy = document.getElementById("event-exchange-copy");
      const exchangeList = document.getElementById("event-exchange-list");
      const currenciesBadge = document.getElementById("event-currencies-badge");
      const currenciesCopy = document.getElementById("event-currencies-copy");
      const currenciesList = document.getElementById("event-currency-list");
      const loginBonusBadge = document.getElementById("event-login-bonus-badge");
      const loginBonusCopy = document.getElementById("event-login-bonus-copy");
      const loginBonusStatusEl = document.getElementById("event-login-bonus-status");
      const loginBonusList = document.getElementById("event-login-bonus-list");
      const loginBonusButton = document.getElementById("event-open-login-bonus");

      if (title) title.textContent = config.title || "イベント準備中";
      if (subtitle) {
        subtitle.textContent = config.subtitle || "イベントストーリーや交換所など、期間導線をここにまとめます。";
      }

      if (empty) empty.hidden = isEnabled;
      if (grid) grid.hidden = !isEnabled;

      renderDisplayItemsPanel(config);
      renderLimitedCardsPanel(eventCards);
      renderCurrencyPanel(config, currenciesBadge, currenciesCopy, currenciesList);

      if (storyBadge) storyBadge.textContent = eventStory ? "公開中" : "未設定";
      if (storyCopy) {
        storyCopy.textContent = eventStory
          ? `${eventStory.title} をこの画面から開けます。`
          : "導線先のイベントストーリーを設定すると、ここから直接読めます。";
      }
      if (storyButton) storyButton.disabled = !eventStory;

      if (exchangeBadge) exchangeBadge.textContent = config.exchangeEnabled ? "公開中" : "OFF";
      if (exchangeCopy) {
        exchangeCopy.textContent = config.exchangeEnabled
          ? `${config.exchangeLabel || "イベント交換所"} の交換品です。`
          : "交換所はまだ公開されていません。";
      }
      renderExchangePanel(config, exchangeStatus, exchangeList);

      if (loginBonusBadge) loginBonusBadge.textContent = config.loginBonusEnabled ? "公開中" : "OFF";
      if (loginBonusCopy) {
        loginBonusCopy.textContent = config.loginBonusEnabled
          ? `${config.loginBonusLabel || "ログインボーナス"} の今日の報酬を受け取れます。`
          : "ログインボーナスはまだ公開されていません。";
      }
      renderLoginBonusPanel(config, loginBonusStatus, loginBonusStatusEl, loginBonusList, loginBonusButton);
    }

    function renderDisplayItemsPanel(config) {
      const badge = document.getElementById("event-display-items-badge");
      const copy = document.getElementById("event-display-items-copy");
      const list = document.getElementById("event-display-item-list");
      const items = Array.isArray(config?.displayItems) ? config.displayItems : [];
      const counts = getEventItemCounts?.() || {};
      if (badge) badge.textContent = `${items.length}件`;
      if (copy) copy.textContent = items.length > 0 ? "イベント画面に並べるだけの装飾アイテムです。" : "装飾アイテムはまだ設定されていません。";
      if (!list) return;
      if (!items.length) {
        list.innerHTML = `<p class="event-display-empty">表示アイテムはまだありません。</p>`;
        return;
      }
      list.innerHTML = items.map(item => `
        <div class="event-display-item">
          <div class="event-display-item-visual"${item.image ? ` style="background-image:url('${escapeHtml(item.image)}')"` : ""}></div>
          <div class="event-display-item-body">
            <strong>${escapeHtml(item.label)}</strong>
            <span>${escapeHtml(item.description || "説明なし")}</span>
            <span>所持 ${Math.max(0, Number(counts[item.id] || 0)).toLocaleString()}</span>
          </div>
        </div>
      `).join("");
    }

    function renderLimitedCardsPanel(cards) {
      const badge = document.getElementById("event-limited-cards-badge");
      const copy = document.getElementById("event-limited-cards-copy");
      const list = document.getElementById("event-limited-card-list");
      if (badge) badge.textContent = `${cards.length}件`;
      if (copy) copy.textContent = cards.length > 0 ? "イベントで訴求したい限定カードを並べます。" : "イベント限定カードはまだ設定されていません。";
      if (!list) return;
      if (!cards.length) {
        list.innerHTML = `<p class="event-display-empty">イベント限定カードはまだありません。</p>`;
        return;
      }
      list.innerHTML = cards.map(card => `
        <button type="button" class="event-limited-card" data-event-card-id="${escapeHtml(card.id)}">
          <strong>${escapeHtml(card.name)}</strong>
          <span>${escapeHtml(card.eventLabel || "イベント限定")}</span>
          <span>${escapeHtml(card.eventAcquireText || "入手方法未設定")}</span>
          <span>${Math.max(0, Number(getOwnedCount?.(card.id) || 0)) > 0 ? "所持済み" : "未所持"}</span>
        </button>
      `).join("");
      list.querySelectorAll("[data-event-card-id]").forEach(button => {
        button.addEventListener("click", () => {
          const card = cards.find(item => item.id === button.dataset.eventCardId);
          if (card) showCardDetail?.(card);
        });
      });
    }

    function renderCurrencyPanel(config, badge, copy, list) {
      const currencies = Array.isArray(config?.eventCurrencies) ? config.eventCurrencies : [];
      if (badge) badge.textContent = `${currencies.length}種`;
      if (copy) {
        copy.textContent = currencies.length > 0
          ? "交換所やログインボーナスで使うイベント専用通貨です。"
          : "イベント専用通貨はまだ設定されていません。";
      }
      if (!list) return;
      if (!currencies.length) {
        list.innerHTML = `<p class="event-display-empty">イベント通貨はまだありません。</p>`;
        return;
      }
      list.innerHTML = currencies.map(currency => `
        <div class="event-currency-item">
          <strong>${escapeHtml(currency.label || currency.key)}</strong>
          <span>ID: ${escapeHtml(currency.key)}</span>
          <span>所持 ${Number(getPlayerCurrencyAmount?.(currency.key) || 0).toLocaleString()}</span>
        </div>
      `).join("");
    }

    function renderExchangePanel(config, status, listEl) {
      if (!listEl) return;
      if (!config.exchangeEnabled) {
        listEl.innerHTML = `<p class="event-exchange-empty">交換所はまだ公開されていません。</p>`;
        return;
      }
      if (!status.items.length) {
        listEl.innerHTML = `<p class="event-exchange-empty">交換アイテムがまだ設定されていません。</p>`;
        return;
      }
      listEl.innerHTML = status.items.map(item => `
        <div class="event-exchange-item">
          <div class="event-exchange-item-main">
            <strong>${escapeHtml(item.label)}</strong>
            <span>${escapeHtml(getCurrencyLabel(item.costCurrencyKey, config))} ${Number(item.costAmount || 0).toLocaleString()} で ${escapeHtml(getRewardLabel(item, config))}</span>
            <span>${escapeHtml(getExchangeMetaLabel(item))}</span>
          </div>
          <button type="button" class="btn-secondary" data-exchange-item-id="${escapeHtml(item.id)}"${item.canPurchase ? "" : " disabled"}>交換</button>
        </div>
      `).join("");

      listEl.querySelectorAll("[data-exchange-item-id]").forEach(button => {
        button.addEventListener("click", () => {
          purchaseExchangeItem(button.dataset.exchangeItemId);
        });
      });
    }

    function renderLoginBonusPanel(config, status, statusEl, listEl, buttonEl) {
      const rewards = Array.isArray(config?.loginBonusRewards) ? config.loginBonusRewards : [];
      const isEnabled = config?.loginBonusEnabled === true;
      if (statusEl) {
        if (!isEnabled) {
          statusEl.textContent = "ログインボーナスはまだ公開されていません。";
        } else if (!rewards.length) {
          statusEl.textContent = "報酬がまだ設定されていません。";
        } else if (status?.canClaimToday) {
          const reward = status.currentReward;
          statusEl.textContent = `Day ${reward?.day || 1} を受け取れます。`;
        } else {
          statusEl.textContent = "今日は受け取り済みです。次回ログインで続きの報酬を受け取れます。";
        }
      }
      if (listEl) {
        listEl.innerHTML = rewards.map((reward, index) => {
          const isCurrent = status?.currentIndex === index;
          return `
            <div class="event-login-bonus-item${isCurrent ? " is-current" : ""}">
              <span class="event-login-bonus-day">Day ${reward.day || (index + 1)}</span>
              <span class="event-login-bonus-reward">${escapeHtml(reward.label || `${getCurrencyLabel(reward.currencyKey, config)} x${reward.amount}`)}</span>
            </div>
          `;
        }).join("");
      }
      if (buttonEl) {
        buttonEl.disabled = !isEnabled || !status?.currentReward || !status.canClaimToday;
        buttonEl.textContent = status?.canClaimToday ? "今日の報酬を受け取る" : "今日は受取済み";
      }
    }

    function openEventStory() {
      const story = getEventStory();
      if (!story) {
        showToast("イベントストーリーがまだ設定されていません。");
        return;
      }
      setCurrentStoryType?.("event");
      navigateTo?.("story");
      renderStoryScreen?.();
      openStoryReader?.(story);
    }

    async function purchaseExchangeItem(itemId) {
      const config = getEventConfig();
      const result = await purchaseEventExchangeItem?.(config, itemId);
      if (!result?.ok) {
        if (result?.code === "exchange_currency_shortage") {
          showToast("交換に必要な通貨が足りません。");
        } else if (result?.code === "exchange_out_of_stock") {
          showToast("この交換品は上限に達しています。");
        } else {
          showToast("交換できませんでした。");
        }
        renderEventScreen();
        return;
      }
      showToast(`${result.item?.label || "交換品"} を受け取りました。`);
      renderEventScreen();
    }

    async function claimLoginBonus() {
      const config = getEventConfig();
      if (!config.loginBonusEnabled) {
        showToast("ログインボーナスはまだ公開されていません。");
        return;
      }
      const result = await claimEventLoginBonus?.(config);
      if (!result?.ok) {
        if (result?.code === "login_bonus_already_claimed") {
          showToast("今日はすでに受け取り済みです。");
        } else {
          showToast("ログインボーナスを受け取れませんでした。");
        }
        renderEventScreen();
        return;
      }
      showToast(`${result.reward?.label || "ログインボーナス"} を受け取りました。`);
      renderEventScreen();
    }

    function getExchangeMetaLabel(item) {
      if (item.rewardKind === "growth") {
        const resources = getGrowthResources?.() || {};
        return `残り ${item.remainingStock} / ${item.stock}  現在 ${Number(resources.resonance || 0).toLocaleString()}pt`;
      }
      if (item.rewardKind === "event_item") {
        return `残り ${item.remainingStock} / ${item.stock}  所持 ${Number(item.ownedRewardCount || 0).toLocaleString()}`;
      }
      return `残り ${item.remainingStock} / ${item.stock}  所持 ${Number(item.ownedCurrency || 0).toLocaleString()}`;
    }

    function getRewardLabel(item, config) {
      if (item.rewardKind === "growth") {
        return `育成ポイント ${Number(item.rewardAmount || 0).toLocaleString()}`;
      }
      if (item.rewardKind === "event_item") {
        const displayItem = (Array.isArray(config?.displayItems) ? config.displayItems : []).find(entry => entry.id === item.rewardValue);
        return `${displayItem?.label || item.rewardValue} x${Number(item.rewardAmount || 0).toLocaleString()}`;
      }
      if (item.rewardKind === "card") {
        const card = getEventCards(config).find(entry => entry.id === item.rewardValue)
          || (Array.isArray(getCharacters?.()) ? getCharacters() : []).find(entry => entry.id === item.rewardValue);
        return `${card?.name || item.rewardValue} x${Number(item.rewardAmount || 0).toLocaleString()}`;
      }
      return `${getCurrencyLabel(item.rewardValue, config)} ${Number(item.rewardAmount || 0).toLocaleString()}`;
    }

    return {
      renderEventScreen,
      openEventStory,
      claimLoginBonus
    };
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  window.EventScreen = {
    setupEventScreen,
    createEventScreen
  };
})();
