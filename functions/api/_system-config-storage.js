import {
  defaultSystemConfig
} from "./_system-config-defaults.js";

export async function loadSystemConfig(env, scope, sanitizeSystemConfig) {
  const d1System = await loadSystemConfigFromD1(env, scope.scopeKey, sanitizeSystemConfig);
  if (d1System) {
    return { system: d1System, storage: "d1" };
  }

  const system = sanitizeSystemConfig((await env.SOCIA_DATA.get(scope.key, "json")) || defaultSystemConfig());
  return { system, storage: "kv" };
}

export async function saveSystemConfig(env, scope) {
  const d1System = await saveSystemConfigToD1(env, scope.scopeKey, scope.system);
  if (d1System) {
    return { system: d1System, storage: "d1" };
  }

  await env.SOCIA_DATA.put(scope.key, JSON.stringify(scope.system));
  return { system: scope.system, storage: "kv" };
}

async function loadSystemConfigFromD1(env, scopeKey, sanitizeSystemConfig) {
  if (!env.SOCIA_DB) return null;
  try {
    const result = await env.SOCIA_DB.prepare(`
      SELECT payload_json
      FROM system_config_registries
      WHERE scope_key = ?
    `).bind(scopeKey).first();

    if (!result?.payload_json) {
      return defaultSystemConfig();
    }

    return parseSystemPayload(result.payload_json, sanitizeSystemConfig);
  } catch (error) {
    console.warn("Falling back to KV for system config load:", error);
    return null;
  }
}

async function saveSystemConfigToD1(env, scopeKey, system) {
  if (!env.SOCIA_DB) return null;
  try {
    await env.SOCIA_DB.prepare(`
      INSERT INTO system_config_registries (scope_key, payload_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(scope_key) DO UPDATE SET
        payload_json = excluded.payload_json,
        updated_at = excluded.updated_at
    `).bind(
      scopeKey,
      JSON.stringify(system),
      new Date().toISOString()
    ).run();

    return system;
  } catch (error) {
    console.warn("Falling back to KV for system config save:", error);
    return null;
  }
}

function parseSystemPayload(value, sanitizeSystemConfig) {
  try {
    return sanitizeSystemConfig(JSON.parse(String(value || "{}")));
  } catch {
    return defaultSystemConfig();
  }
}
