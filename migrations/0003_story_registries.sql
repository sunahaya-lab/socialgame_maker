PRAGMA foreign_keys = ON;

CREATE TABLE story_registries (
  scope_key TEXT NOT NULL,
  story_id TEXT NOT NULL,
  title TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (scope_key, story_id)
);

CREATE INDEX idx_story_registries_scope_updated_at
  ON story_registries(scope_key, updated_at DESC, created_at DESC);
