PRAGMA foreign_keys = ON;

CREATE TABLE entry_registries (
  scope_key TEXT NOT NULL,
  entry_id TEXT NOT NULL,
  name TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (scope_key, entry_id)
);

CREATE INDEX idx_entry_registries_scope_updated_at
  ON entry_registries(scope_key, updated_at DESC, created_at DESC);
