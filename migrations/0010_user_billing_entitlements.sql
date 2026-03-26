PRAGMA foreign_keys = ON;

CREATE TABLE user_license_profiles (
  user_id TEXT PRIMARY KEY,
  base_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (base_tier IN ('free', 'publish')),
  granted_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_owned_packs (
  user_id TEXT NOT NULL,
  pack_id TEXT NOT NULL
    CHECK (pack_id IN ('storage_plus', 'story_fx', 'battle', 'defense', 'event')),
  granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  granted_by_user_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, pack_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_user_license_profiles_base_tier
  ON user_license_profiles(base_tier, updated_at DESC);

CREATE INDEX idx_user_owned_packs_pack_id
  ON user_owned_packs(pack_id, updated_at DESC);

INSERT INTO user_license_profiles (
  user_id,
  base_tier,
  granted_at,
  created_at,
  updated_at
)
SELECT
  users.id,
  'free',
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM users
LEFT JOIN user_license_profiles
  ON user_license_profiles.user_id = users.id
WHERE user_license_profiles.user_id IS NULL;

UPDATE user_license_profiles
SET
  base_tier = 'publish',
  granted_at = COALESCE(
    granted_at,
    (
      SELECT MAX(COALESCE(project_license_states.licensed_at, project_license_states.created_at))
      FROM projects
      INNER JOIN project_license_states
        ON project_license_states.project_id = projects.id
      WHERE projects.owner_user_id = user_license_profiles.user_id
        AND project_license_states.public_share_enabled = 1
        AND project_license_states.license_plan = 'paid'
    ),
    CURRENT_TIMESTAMP
  ),
  updated_at = CURRENT_TIMESTAMP
WHERE user_id IN (
  SELECT DISTINCT projects.owner_user_id
  FROM projects
  INNER JOIN project_license_states
    ON project_license_states.project_id = projects.id
  WHERE project_license_states.public_share_enabled = 1
    AND project_license_states.license_plan = 'paid'
);
