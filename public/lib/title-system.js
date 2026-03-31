(function () {
  function createDefaultTitleStyle(overrides = {}) {
    return {
      backgroundType: "solid",
      colorA: "#666666",
      colorB: "#666666",
      textColor: "#ffffff",
      ...overrides
    };
  }

  function normalizeTitleStyle(style) {
    const source = style && typeof style === "object" ? style : {};
    return createDefaultTitleStyle({
      backgroundType: source.backgroundType === "split" ? "split" : "solid",
      colorA: normalizeColor(source.colorA, "#666666"),
      colorB: normalizeColor(source.colorB, "#666666"),
      textColor: normalizeColor(source.textColor, "#ffffff")
    });
  }

  function normalizeColor(value, fallback) {
    const text = String(value || "").trim();
    return /^#[0-9a-fA-F]{6}$/.test(text) ? text : fallback;
  }

  function normalizeTitleRecord(title) {
    if (!title || typeof title !== "object") return null;
    const id = String(title.id || "").trim();
    const label = String(title.label || "").trim();
    if (!id || !label) return null;
    return {
      id,
      label: label.slice(0, 80),
      category: String(title.category || "default").trim() || "default",
      description: String(title.description || "").trim().slice(0, 160),
      earnedAt: String(title.earnedAt || new Date().toISOString()),
      style: normalizeTitleStyle(title.style || {})
    };
  }

  function normalizeTitleMasterRecord(title) {
    const normalized = normalizeTitleRecord(title);
    if (!normalized) return null;
    const unlockConditionType = normalizeUnlockConditionType(title.unlockConditionType || title.unlockType);
    return {
      ...normalized,
      unlockConditionType,
      unlockConfig: normalizeUnlockConfig(unlockConditionType, title.unlockConfig || {})
    };
  }

  function normalizeUnlockConditionType(value) {
    const normalized = String(value || "").trim();
    if (["always", "project_owner", "project_member", "formation_pair", "formation_squad"].includes(normalized)) {
      return normalized;
    }
    return "always";
  }

  function normalizeUnlockConfig(type, config) {
    const source = config && typeof config === "object" ? config : {};
    if (type === "formation_pair") {
      return {
        leaderBaseCharId: String(source.leaderBaseCharId || "").trim(),
        subLeaderBaseCharId: String(source.subLeaderBaseCharId || "").trim()
      };
    }
    if (type === "formation_squad") {
      const baseCharIds = Array.isArray(source.baseCharIds)
        ? Array.from(new Set(source.baseCharIds.map(value => String(value || "").trim()).filter(Boolean))).slice(0, 8)
        : [];
      return {
        baseCharIds,
        requiredCount: Math.max(3, Number(source.requiredCount || 3) || 3)
      };
    }
    return {};
  }

  function normalizeTitleCollection(list) {
    const map = new Map();
    (Array.isArray(list) ? list : []).forEach(item => {
      const normalized = normalizeTitleRecord(item);
      if (!normalized) return;
      map.set(normalized.id, normalized);
    });
    return Array.from(map.values());
  }

  function normalizeTitleMasterCollection(list) {
    const map = new Map();
    (Array.isArray(list) ? list : []).forEach(item => {
      const normalized = normalizeTitleMasterRecord(item);
      if (!normalized) return;
      map.set(normalized.id, normalized);
    });
    return Array.from(map.values());
  }

  function normalizeUnlockedTitleIds(list) {
    return Array.from(new Set((Array.isArray(list) ? list : []).map(value => String(value || "").trim()).filter(Boolean)));
  }

  function buildProjectTitles(projects, currentUserId) {
    const titles = [];
    if (Array.isArray(projects) && projects.length > 0) {
      titles.push({
        id: "builtin-team-member",
        label: "ソシャゲチーム",
        category: "project",
        description: "何かしらのプロジェクトに参加すると入手",
        unlockConditionType: "project_member",
        style: createDefaultTitleStyle()
      });
    }

    const ownerId = String(currentUserId || "").trim();
    const isOwner = Boolean(ownerId) && (Array.isArray(projects) ? projects : []).some(project => {
      const ownerUserId = String(project?.ownerUserId || project?.owner_user_id || "").trim();
      const memberRole = String(project?.memberRole || project?.member_role || "").trim();
      return ownerUserId === ownerId || memberRole === "owner";
    });
    if (isOwner) {
      titles.push({
        id: "builtin-project-owner",
        label: "ソシャゲオーナー",
        category: "project",
        description: "プロジェクトを自力で立ち上げると入手",
        unlockConditionType: "project_owner",
        style: createDefaultTitleStyle()
      });
    }
    return titles;
  }

  function buildFormationTitles(formation, characters, baseChars) {
    const cardMap = new Map((Array.isArray(characters) ? characters : []).map(card => [String(card.id || ""), card]));
    const baseMap = new Map((Array.isArray(baseChars) ? baseChars : []).map(base => [String(base.id || ""), base]));
    const slots = (Array.isArray(formation) ? formation : []).map(id => cardMap.get(String(id || "")) || null);
    const titles = [];

    const leader = slots[0];
    const subLeader = slots[1];
    const leaderBaseId = String(leader?.baseCharId || "").trim();
    const subBaseId = String(subLeader?.baseCharId || "").trim();
    if (leaderBaseId && subBaseId && leaderBaseId !== subBaseId) {
      const orderedIds = [leaderBaseId, subBaseId].sort();
      const leaderName = getDisplayCharacterName(leader, baseMap);
      const subName = getDisplayCharacterName(subLeader, baseMap);
      titles.push({
        id: `formation-pair:${orderedIds.join("+")}`,
        label: `${leaderName} × ${subName}`,
        category: "formation",
        description: "リーダーとサブリーダーの特定組み合わせで入手",
        unlockConditionType: "formation_pair",
        unlockConfig: {
          leaderBaseCharId: leaderBaseId,
          subLeaderBaseCharId: subBaseId
        },
        style: createDefaultTitleStyle()
      });
    }

    const uniqueBaseIds = [];
    slots.forEach(card => {
      const baseId = String(card?.baseCharId || "").trim();
      if (!baseId || uniqueBaseIds.includes(baseId)) return;
      uniqueBaseIds.push(baseId);
    });
    if (uniqueBaseIds.length >= 3) {
      const titleBaseIds = uniqueBaseIds.slice(0, 3);
      const titleNames = titleBaseIds.map(baseId => {
        const baseChar = baseMap.get(baseId);
        return String(baseChar?.name || "キャラ").trim() || "キャラ";
      });
      titles.push({
        id: `formation-squad:${titleBaseIds.slice().sort().join("+")}`,
        label: `${titleNames.join(" / ")} 出撃`,
        category: "formation",
        description: "特定のキャラ三人以上で出撃すると入手",
        unlockConditionType: "formation_squad",
        unlockConfig: {
          baseCharIds: titleBaseIds,
          requiredCount: 3
        },
        style: createDefaultTitleStyle()
      });
    }

    return titles;
  }

  function getDisplayCharacterName(card, baseMap) {
    const cardName = String(card?.name || "").trim();
    if (cardName) return cardName;
    const baseChar = baseMap.get(String(card?.baseCharId || "").trim());
    return String(baseChar?.name || "キャラ").trim() || "キャラ";
  }

  function resolveTitleCatalog(context = {}) {
    return normalizeTitleMasterCollection([
      ...buildProjectTitles(context.projects, context.currentUserId),
      ...buildFormationTitles(context.formation, context.characters, context.baseChars),
      ...(Array.isArray(context.titleMasters) ? context.titleMasters : [])
    ]);
  }

  function isTitleUnlocked(master, context = {}) {
    const type = normalizeUnlockConditionType(master?.unlockConditionType);
    const formationBaseIds = getFormationBaseIds(context.formation, context.characters);
    if (type === "always") return true;
    if (type === "project_member") return Array.isArray(context.projects) && context.projects.length > 0;
    if (type === "project_owner") {
      const userId = String(context.currentUserId || "").trim();
      return Boolean(userId) && (Array.isArray(context.projects) ? context.projects : []).some(project => {
        const ownerUserId = String(project?.ownerUserId || project?.owner_user_id || "").trim();
        const memberRole = String(project?.memberRole || project?.member_role || "").trim();
        return ownerUserId === userId || memberRole === "owner";
      });
    }
    if (type === "formation_pair") {
      const config = normalizeUnlockConfig(type, master?.unlockConfig);
      const leaderBaseId = formationBaseIds[0] || "";
      const subLeaderBaseId = formationBaseIds[1] || "";
      const currentKey = [leaderBaseId, subLeaderBaseId].filter(Boolean).sort().join("+");
      const configKey = [config.leaderBaseCharId, config.subLeaderBaseCharId].filter(Boolean).sort().join("+");
      return Boolean(configKey) && currentKey === configKey;
    }
    if (type === "formation_squad") {
      const config = normalizeUnlockConfig(type, master?.unlockConfig);
      const requiredIds = Array.isArray(config.baseCharIds) ? config.baseCharIds : [];
      const requiredCount = Math.max(3, Number(config.requiredCount || 3) || 3);
      if (!requiredIds.length) return formationBaseIds.length >= requiredCount;
      return requiredIds.every(id => formationBaseIds.includes(id)) && formationBaseIds.length >= requiredCount;
    }
    return false;
  }

  function getFormationBaseIds(formation, characters) {
    const cardMap = new Map((Array.isArray(characters) ? characters : []).map(card => [String(card.id || ""), card]));
    const ids = [];
    (Array.isArray(formation) ? formation : []).forEach(cardId => {
      const card = cardMap.get(String(cardId || "").trim());
      const baseId = String(card?.baseCharId || "").trim();
      if (!baseId || ids.includes(baseId)) return;
      ids.push(baseId);
    });
    return ids;
  }

  function syncProfileTitles(profile, context = {}) {
    const source = profile && typeof profile === "object" ? profile : {};
    const legacyTitles = normalizeTitleCollection(source.titles);
    const catalog = resolveTitleCatalog(context);
    const unlockedTitleIds = normalizeUnlockedTitleIds([
      ...(source.unlockedTitleIds || []),
      ...legacyTitles.map(item => item.id)
    ]);

    const addedTitles = [];
    catalog.forEach(master => {
      if (unlockedTitleIds.includes(master.id)) return;
      if (!isTitleUnlocked(master, context)) return;
      unlockedTitleIds.push(master.id);
      addedTitles.push(master);
    });

    const catalogMap = new Map(catalog.map(item => [item.id, normalizeTitleRecord(item)]));
    const titles = unlockedTitleIds
      .map(id => catalogMap.get(id))
      .filter(Boolean);

    const activeTitleId = titles.some(item => item.id === source.activeTitleId)
      ? String(source.activeTitleId)
      : String(titles[0]?.id || "");

    const nextProfile = {
      ...source,
      unlockedTitleIds,
      titles,
      activeTitleId
    };

    return {
      profile: nextProfile,
      titles,
      unlockedTitleIds,
      activeTitleId,
      addedTitles,
      changed: addedTitles.length > 0
        || activeTitleId !== String(source.activeTitleId || "")
        || unlockedTitleIds.join("::") !== normalizeUnlockedTitleIds(source.unlockedTitleIds).join("::")
    };
  }

  function getActiveTitle(profile, context = {}) {
    const titles = Array.isArray(profile?.titles) && profile.titles.length
      ? normalizeTitleCollection(profile.titles)
      : syncProfileTitles(profile, context).titles;
    const activeTitleId = String(profile?.activeTitleId || "").trim();
    return titles.find(item => item.id === activeTitleId) || titles[0] || null;
  }

  window.TitleSystemLib = {
    createDefaultTitleStyle,
    normalizeTitleRecord,
    normalizeTitleCollection,
    normalizeTitleMasterRecord,
    normalizeTitleMasterCollection,
    normalizeUnlockedTitleIds,
    resolveTitleCatalog,
    syncProfileTitles,
    getActiveTitle
  };
})();
