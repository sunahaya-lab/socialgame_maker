PRAGMA foreign_keys = ON;

CREATE TABLE project_registries (
  scope_key TEXT NOT NULL,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (scope_key, project_id)
);

CREATE INDEX idx_project_registries_scope_updated_at
  ON project_registries(scope_key, updated_at DESC, created_at DESC);
