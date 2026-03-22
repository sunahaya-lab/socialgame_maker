(function () {
  const rarityPalettes = {
    1: ["#1a1a1a", "#b2bec3", "#dfe6e9"],
    2: ["#0a1a2d", "#74b9ff", "#a0d8ff"],
    3: ["#1a1040", "#a29bfe", "#c8c3ff"],
    4: ["#2d2200", "#ffd447", "#ffe680"],
    5: ["#2d0a0a", "#ff6b6b", "#ff9999"]
  };

  const rarityModes = {
    classic4: {
      id: "classic4",
      tiers: [
        { value: "N", rank: 1, label: "N" },
        { value: "R", rank: 2, label: "R" },
        { value: "SR", rank: 3, label: "SR" },
        { value: "SSR", rank: 4, label: "SSR" }
      ],
      fallback: "SR",
      defaultRates: { N: 40, R: 30, SR: 20, SSR: 10 }
    },
    stars5: {
      id: "stars5",
      tiers: [
        { value: "STAR1", rank: 1, label: "★" },
        { value: "STAR2", rank: 2, label: "★★" },
        { value: "STAR3", rank: 3, label: "★★★" },
        { value: "STAR4", rank: 4, label: "★★★★" },
        { value: "STAR5", rank: 5, label: "★★★★★" }
      ],
      fallback: "STAR3",
      defaultRates: { STAR1: 40, STAR2: 30, STAR3: 15, STAR4: 10, STAR5: 5 }
    }
  };

  const rarityRankMap = {
    N: 1,
    R: 2,
    SR: 3,
    SSR: 4,
    UR: 5,
    STAR1: 1,
    STAR2: 2,
    STAR3: 3,
    STAR4: 4,
    STAR5: 5,
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5
  };

  function getDefaultRarityMode() {
    return "classic4";
  }

  function getRarityModeConfig(mode) {
    return rarityModes[mode] || rarityModes[getDefaultRarityMode()];
  }

  function getRarityRank(value) {
    return rarityRankMap[String(value || "").toUpperCase()] || 1;
  }

  function getRarityValueByRank(rank, mode) {
    const config = getRarityModeConfig(mode);
    const maxRank = config.tiers[config.tiers.length - 1].rank;
    const safeRank = Math.max(1, Math.min(maxRank, rank));
    return config.tiers.find(tier => tier.rank === safeRank)?.value || config.fallback;
  }

  function normalizeRarityValue(value, mode) {
    return getRarityValueByRank(getRarityRank(value), mode);
  }

  function getRarityLabel(value, mode) {
    const config = getRarityModeConfig(mode);
    const normalized = normalizeRarityValue(value, mode);
    return config.tiers.find(tier => tier.value === normalized)?.label || normalized;
  }

  function getRarityCssClass(value, mode) {
    return `rarity-tier-${getRarityRank(normalizeRarityValue(value, mode))}`;
  }

  function getDefaultRates(mode) {
    return { ...getRarityModeConfig(mode).defaultRates };
  }

  function normalizeRates(rates, mode) {
    const config = getRarityModeConfig(mode);
    const normalized = {};
    config.tiers.forEach(tier => {
      normalized[tier.value] = 0;
    });
    Object.entries(rates || {}).forEach(([key, value]) => {
      const mapped = normalizeRarityValue(key, mode);
      normalized[mapped] = (normalized[mapped] || 0) + (Number(value) || 0);
    });
    return normalized;
  }

  function getPaletteForRarity(value, mode) {
    const rank = getRarityRank(normalizeRarityValue(value, mode));
    return rarityPalettes[rank] || rarityPalettes[1];
  }

  window.RarityLib = {
    rarityPalettes,
    rarityModes,
    getDefaultRarityMode,
    getRarityModeConfig,
    getRarityRank,
    getRarityValueByRank,
    normalizeRarityValue,
    getRarityLabel,
    getRarityCssClass,
    getDefaultRates,
    normalizeRates,
    getPaletteForRarity
  };
})();
