import { createCorsHeaders, json, loadPlayerCurrencyBalances } from "./_player-state";
import { loadPlayerEventState, loadProjectEventConfig } from "./_player-event.js";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const projectId = url.searchParams.get("project") || null;
  const userId = url.searchParams.get("user") || null;
  const corsHeaders = createCorsHeaders("GET,OPTIONS");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "GET") {
    return json({ error: "\u3053\u306e\u30e1\u30bd\u30c3\u30c9\u306f\u5229\u7528\u3067\u304d\u307e\u305b\u3093" }, 405, corsHeaders);
  }

  if (!projectId || !userId) {
    return json({ error: "project \u307e\u305f\u306f user \u304c\u4e0d\u8db3\u3057\u3066\u3044\u307e\u3059" }, 400, corsHeaders);
  }

  const bootstrap = await loadPlayerBootstrap(env, { projectId, userId });
  return json({ bootstrap, storage: env.SOCIA_DB ? "d1" : "none" }, 200, corsHeaders);
}

async function loadPlayerBootstrap(env, scope) {
  if (!env.SOCIA_DB) {
    return makeEmptyBootstrap(scope);
  }

  const profile = await env.SOCIA_DB.prepare(`
    SELECT id, project_id, user_id, display_name, last_active_at, created_at, updated_at
    FROM player_profiles
    WHERE project_id = ? AND user_id = ?
  `).bind(scope.projectId, scope.userId).first();

  if (!profile) {
    return makeEmptyBootstrap(scope);
  }

  const eventConfig = await loadProjectEventConfig(env, scope.projectId);
  const [inventoryResult, historyResult, progressResult, homePreferencesResult, currencies, eventState] = await Promise.all([
    env.SOCIA_DB.prepare(`
      SELECT id, card_id, quantity, first_acquired_at, last_acquired_at, created_at, updated_at
      FROM player_inventories
      WHERE player_profile_id = ?
      ORDER BY last_acquired_at DESC, created_at DESC
    `).bind(profile.id).all(),
    env.SOCIA_DB.prepare(`
      SELECT id, gacha_id, pull_group_id, card_id, rarity_at_pull, created_at
      FROM gacha_pull_history
      WHERE player_profile_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `).bind(profile.id).all(),
    env.SOCIA_DB.prepare(`
      SELECT id, story_id, status, last_scene_index, read_at, unlocked_at, created_at, updated_at
      FROM story_progress
      WHERE player_profile_id = ?
      ORDER BY updated_at DESC, created_at DESC
    `).bind(profile.id).all(),
    getHomePreferencesRow(env, profile.id),
    loadPlayerCurrencyBalances(env, profile.id),
    loadPlayerEventState(env, profile.id, eventConfig)
  ]);

  return {
    profile: mapProfile(profile),
    inventory: (inventoryResult.results || []).map(mapInventory),
    gachaHistory: (historyResult.results || []).map(mapGachaHistory),
    storyProgress: (progressResult.results || []).map(mapStoryProgress),
    homePreferences: mapHomePreferences(homePreferencesResult),
    currencies,
    loginBonuses: eventState.loginBonuses || {},
    eventExchangePurchases: eventState.eventExchangePurchases || {},
    eventItems: eventState.eventItems || {}
  };
}

function makeEmptyBootstrap(scope) {
  return {
    profile: {
      id: null,
      projectId: scope.projectId,
      userId: scope.userId,
      displayName: "",
      lastActiveAt: null,
      createdAt: null,
      updatedAt: null
    },
    inventory: [],
    gachaHistory: [],
    storyProgress: [],
    homePreferences: null,
    currencies: [],
    loginBonuses: {},
    eventExchangePurchases: {},
    eventItems: {}
  };
}

function mapProfile(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    displayName: row.display_name || "",
    lastActiveAt: row.last_active_at || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null
  };
}

function mapInventory(row) {
  return {
    id: row.id,
    cardId: row.card_id,
    quantity: Number(row.quantity || 0),
    firstAcquiredAt: row.first_acquired_at || null,
    lastAcquiredAt: row.last_acquired_at || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null
  };
}

function mapGachaHistory(row) {
  return {
    id: row.id,
    gachaId: row.gacha_id,
    pullGroupId: row.pull_group_id,
    cardId: row.card_id,
    rarityAtPull: row.rarity_at_pull,
    createdAt: row.created_at || null
  };
}

function mapStoryProgress(row) {
  return {
    id: row.id,
    storyId: row.story_id,
    status: row.status,
    lastSceneIndex: Number(row.last_scene_index || 0),
    readAt: row.read_at || null,
    unlockedAt: row.unlocked_at || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null
  };
}

function mapHomePreferences(row) {
  if (!row) return null;
  return {
    mode: Number(row.mode || 1) === 2 ? 2 : 1,
    card1: row.card_1_id || "",
    card2: row.card_2_id || "",
    scale1: Number(row.scale_1 || 100),
    x1: Number(row.x_1 ?? -10),
    y1: Number(row.y_1 ?? 0),
    scale2: Number(row.scale_2 || 100),
    x2: Number(row.x_2 ?? 10),
    y2: Number(row.y_2 ?? 0),
    front: Number(row.front || 2) === 1 ? 1 : 2
  };
}

async function getHomePreferencesRow(env, playerProfileId) {
  try {
    return await env.SOCIA_DB.prepare(`
      SELECT mode, card_1_id, card_2_id, scale_1, x_1, y_1, scale_2, x_2, y_2, front
      FROM player_home_preferences
      WHERE player_profile_id = ?
    `).bind(playerProfileId).first();
  } catch (error) {
    console.warn("Player home preferences table unavailable:", error);
    return null;
  }
}
