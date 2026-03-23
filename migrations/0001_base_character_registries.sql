PRAGMA foreign_keys = ON;

CREATE TABLE base_character_registries (
  scope_key TEXT NOT NULL,
  base_character_id TEXT NOT NULL,
  name TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (scope_key, base_character_id)
);

CREATE INDEX idx_base_character_registries_scope_updated_at
  ON base_character_registries(scope_key, updated_at DESC, created_at DESC);
