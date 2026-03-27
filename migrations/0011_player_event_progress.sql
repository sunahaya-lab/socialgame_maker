CREATE TABLE IF NOT EXISTS player_event_item_balances (
  id TEXT PRIMARY KEY,
  player_profile_id TEXT NOT NULL,
  event_key TEXT NOT NULL,
  item_key TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(player_profile_id, event_key, item_key),
  FOREIGN KEY (player_profile_id) REFERENCES player_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_player_event_item_balances_profile
  ON player_event_item_balances(player_profile_id, event_key);

CREATE TABLE IF NOT EXISTS player_event_login_bonus_progress (
  id TEXT PRIMARY KEY,
  player_profile_id TEXT NOT NULL,
  event_key TEXT NOT NULL,
  claimed_days INTEGER NOT NULL DEFAULT 0,
  last_claimed_on TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(player_profile_id, event_key),
  FOREIGN KEY (player_profile_id) REFERENCES player_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_player_event_login_bonus_progress_profile
  ON player_event_login_bonus_progress(player_profile_id, event_key);

CREATE TABLE IF NOT EXISTS player_event_exchange_purchases (
  id TEXT PRIMARY KEY,
  player_profile_id TEXT NOT NULL,
  event_key TEXT NOT NULL,
  item_id TEXT NOT NULL,
  purchased_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(player_profile_id, event_key, item_id),
  FOREIGN KEY (player_profile_id) REFERENCES player_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_player_event_exchange_purchases_profile
  ON player_event_exchange_purchases(player_profile_id, event_key);
