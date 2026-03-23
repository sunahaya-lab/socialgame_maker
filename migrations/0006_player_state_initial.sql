PRAGMA foreign_keys = ON;

CREATE TABLE player_profiles (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  last_active_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (project_id, user_id)
);

CREATE INDEX idx_player_profiles_project_id ON player_profiles(project_id);
CREATE INDEX idx_player_profiles_user_id ON player_profiles(user_id);

CREATE TABLE player_inventories (
  id TEXT PRIMARY KEY,
  player_profile_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  first_acquired_at TEXT,
  last_acquired_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_profile_id) REFERENCES player_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  UNIQUE (player_profile_id, card_id)
);

CREATE INDEX idx_player_inventories_player_profile_id
  ON player_inventories(player_profile_id);

CREATE TABLE gacha_pull_history (
  id TEXT PRIMARY KEY,
  player_profile_id TEXT NOT NULL,
  gacha_id TEXT NOT NULL,
  pull_group_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  rarity_at_pull TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_profile_id) REFERENCES player_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (gacha_id) REFERENCES gachas(id) ON DELETE CASCADE,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

CREATE INDEX idx_gacha_pull_history_player_profile_created_at
  ON gacha_pull_history(player_profile_id, created_at DESC);

CREATE INDEX idx_gacha_pull_history_pull_group_id
  ON gacha_pull_history(pull_group_id);

CREATE TABLE story_progress (
  id TEXT PRIMARY KEY,
  player_profile_id TEXT NOT NULL,
  story_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'locked'
    CHECK (status IN ('locked', 'unlocked', 'in_progress', 'completed')),
  last_scene_index INTEGER NOT NULL DEFAULT 0 CHECK (last_scene_index >= 0),
  read_at TEXT,
  unlocked_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_profile_id) REFERENCES player_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  UNIQUE (player_profile_id, story_id)
);

CREATE INDEX idx_story_progress_player_profile_id
  ON story_progress(player_profile_id);
