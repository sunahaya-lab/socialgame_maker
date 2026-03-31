import { defaultEventConfig } from "./_system-config-defaults.js";

export function sanitizeEventConfig(value) {
  const source = value && typeof value === "object" ? value : {};
  const defaults = defaultEventConfig();
  return {
    enabled: source.enabled === true,
    title: String(source.title || defaults.title).trim().slice(0, 80),
    subtitle: String(source.subtitle || defaults.subtitle).trim().slice(0, 200),
    storyId: String(source.storyId || defaults.storyId).trim().slice(0, 80),
    eventCurrencies: sanitizeEventCurrencies(source.eventCurrencies, defaults.eventCurrencies),
    exchangeEnabled: source.exchangeEnabled === true,
    exchangeLabel: String(source.exchangeLabel || defaults.exchangeLabel).trim().slice(0, 40),
    exchangeItems: sanitizeExchangeItems(source.exchangeItems, defaults.exchangeItems),
    displayItems: sanitizeDisplayItems(source.displayItems, defaults.displayItems),
    eventCardIds: sanitizeEventCardIds(source.eventCardIds, defaults.eventCardIds),
    loginBonusEnabled: source.loginBonusEnabled === true,
    loginBonusLabel: String(source.loginBonusLabel || defaults.loginBonusLabel).trim().slice(0, 40),
    loginBonusRewards: sanitizeLoginBonusRewards(source.loginBonusRewards, defaults.loginBonusRewards)
  };
}

export function sanitizeEventCurrencies(value, fallback = []) {
  const source = Array.isArray(value) && value.length > 0 ? value : fallback;
  return source
    .slice(0, 20)
    .map((item, index) => ({
      key: sanitizeCurrencyKey(item?.key, `event_currency_${index + 1}`),
      label: String(item?.label || "").trim().slice(0, 40),
      initialAmount: Math.max(0, Math.floor(Number(item?.initialAmount || 0) || 0))
    }))
    .filter(item => item.key && item.label);
}

export function sanitizeExchangeItems(value, fallback = []) {
  const source = Array.isArray(value) && value.length > 0 ? value : fallback;
  return source
    .slice(0, 30)
    .map((item, index) => ({
      id: String(item?.id || `event-exchange-${index + 1}`).trim().slice(0, 80),
      label: String(item?.label || "").trim().slice(0, 80),
      costCurrencyKey: sanitizeCurrencyKey(item?.costCurrencyKey, "gold"),
      costAmount: Math.max(1, Math.floor(Number(item?.costAmount || 0) || 0)),
      rewardKind: ["currency", "growth", "event_item", "card"].includes(String(item?.rewardKind || "").trim())
        ? String(item.rewardKind).trim()
        : "currency",
      rewardValue: String(item?.rewardValue || item?.rewardCurrencyKey || "").trim().slice(0, 80),
      rewardAmount: Math.max(1, Math.floor(Number(item?.rewardAmount || 0) || 0)),
      stock: Math.max(1, Math.floor(Number(item?.stock || 0) || 1))
    }))
    .filter(item => item.id && item.label && item.costAmount > 0 && item.rewardAmount > 0 && item.rewardValue);
}

export function sanitizeDisplayItems(value, fallback = []) {
  const source = Array.isArray(value) && value.length > 0 ? value : fallback;
  return source
    .slice(0, 100)
    .map((item, index) => ({
      id: String(item?.id || `event-item-${index + 1}`).trim().slice(0, 80),
      label: String(item?.label || "").trim().slice(0, 80),
      description: String(item?.description || "").trim().slice(0, 200),
      image: String(item?.image || "").trim().slice(0, 2_000_000)
    }))
    .filter(item => item.id && item.label);
}

export function sanitizeEventCardIds(value, fallback = []) {
  const source = Array.isArray(value) && value.length > 0 ? value : fallback;
  const seen = new Set();
  return source
    .map(item => {
      if (typeof item === "string") {
        const cardId = String(item || "").trim().slice(0, 80);
        if (!cardId || seen.has(cardId)) return null;
        seen.add(cardId);
        return {
          cardId,
          label: "",
          acquireText: ""
        };
      }
      const cardId = String(item?.cardId || item?.id || "").trim().slice(0, 80);
      if (!cardId || seen.has(cardId)) return null;
      seen.add(cardId);
      return {
        cardId,
        label: String(item?.label || "").trim().slice(0, 40),
        acquireText: String(item?.acquireText || "").trim().slice(0, 80)
      };
    })
    .filter(Boolean)
    .slice(0, 50);
}

export function sanitizeLoginBonusRewards(value, fallback = []) {
  const source = Array.isArray(value) && value.length > 0 ? value : fallback;
  return source
    .slice(0, 14)
    .map((item, index) => ({
      day: Math.max(1, Math.min(31, Number(item?.day ?? index + 1) || (index + 1))),
      currencyKey: sanitizeCurrencyKey(item?.currencyKey, "gems"),
      amount: Math.max(1, Math.floor(Number(item?.amount || 0) || 0)),
      label: String(item?.label || "").trim().slice(0, 80)
    }))
    .filter(item => item.amount > 0)
    .map(item => ({
      ...item,
      label: item.label || `${item.currencyKey} x${item.amount}`
    }));
}

export function sanitizeCurrencyKey(value, fallback = "gems") {
  const key = String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 40);
  return key || fallback;
}
