PRAGMA foreign_keys = ON;

CREATE TABLE player_home_preferences (
  id TEXT PRIMARY KEY,
  player_profile_id TEXT NOT NULL,
  mode INTEGER NOT NULL DEFAULT 1 CHECK (mode IN (1, 2)),
  card_1_id TEXT,
  card_2_id TEXT,
  scale_1 INTEGER NOT NULL DEFAULT 100,
  x_1 REAL NOT NULL DEFAULT -10,
  y_1 REAL NOT NULL DEFAULT 0,
  scale_2 INTEGER NOT NULL DEFAULT 100,
  x_2 REAL NOT NULL DEFAULT 10,
  y_2 REAL NOT NULL DEFAULT 0,
  front INTEGER NOT NULL DEFAULT 2 CHECK (front IN (1, 2)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_profile_id) REFERENCES player_profiles(id) ON DELETE CASCADE,
  UNIQUE (player_profile_id)
);

CREATE INDEX idx_player_home_preferences_player_profile_id
  ON player_home_preferences(player_profile_id);
