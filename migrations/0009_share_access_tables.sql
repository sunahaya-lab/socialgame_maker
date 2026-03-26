PRAGMA foreign_keys = ON;

CREATE TABLE project_collab_shares (
  project_id TEXT PRIMARY KEY,
  active_token TEXT NOT NULL UNIQUE,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled')),
  rotated_by_user_id TEXT,
  rotated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (rotated_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX idx_project_collab_shares_active_token
  ON project_collab_shares(active_token);

CREATE INDEX idx_project_collab_shares_status_updated_at
  ON project_collab_shares(status, updated_at DESC);

CREATE TABLE project_public_shares (
  project_id TEXT PRIMARY KEY,
  active_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'disabled'
    CHECK (status IN ('active', 'disabled')),
  access_mode TEXT NOT NULL DEFAULT 'play_only'
    CHECK (access_mode IN ('play_only')),
  snapshot_version INTEGER CHECK (snapshot_version IS NULL OR snapshot_version >= 1),
  rotated_by_user_id TEXT,
  rotated_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (rotated_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX idx_project_public_shares_active_token
  ON project_public_shares(active_token);

CREATE INDEX idx_project_public_shares_status_updated_at
  ON project_public_shares(status, updated_at DESC);

CREATE TABLE project_license_states (
  project_id TEXT PRIMARY KEY,
  public_share_enabled INTEGER NOT NULL DEFAULT 0
    CHECK (public_share_enabled IN (0, 1)),
  license_plan TEXT NOT NULL DEFAULT 'free'
    CHECK (license_plan IN ('free', 'paid')),
  licensed_at TEXT,
  license_expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_project_license_states_public_share_enabled
  ON project_license_states(public_share_enabled, license_plan);

INSERT INTO project_license_states (
  project_id,
  public_share_enabled,
  license_plan,
  created_at,
  updated_at
)
SELECT
  projects.id,
  0,
  'free',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM projects
LEFT JOIN project_license_states
  ON project_license_states.project_id = projects.id
WHERE project_license_states.project_id IS NULL;
