PRAGMA foreign_keys = ON;

CREATE TABLE system_config_registries (
  scope_key TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
