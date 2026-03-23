PRAGMA foreign_keys = ON;

CREATE TABLE player_currency_balances (
  id TEXT PRIMARY KEY,
  player_profile_id TEXT NOT NULL,
  currency_key TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0),
  max_amount INTEGER CHECK (max_amount IS NULL OR max_amount >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_profile_id) REFERENCES player_profiles(id) ON DELETE CASCADE,
  UNIQUE (player_profile_id, currency_key)
);

CREATE INDEX idx_player_currency_balances_player_profile_id
  ON player_currency_balances(player_profile_id);

INSERT INTO player_currency_balances (
  id, player_profile_id, currency_key, amount, max_amount, created_at, updated_at
)
SELECT
  lower(hex(randomblob(16))),
  player_profiles.id,
  defaults.currency_key,
  defaults.amount,
  defaults.max_amount,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM player_profiles
CROSS JOIN (
  SELECT 'stamina' AS currency_key, 120 AS amount, 120 AS max_amount
  UNION ALL
  SELECT 'gems' AS currency_key, 9999 AS amount, NULL AS max_amount
  UNION ALL
  SELECT 'gold' AS currency_key, 85000 AS amount, NULL AS max_amount
) AS defaults
LEFT JOIN player_currency_balances
  ON player_currency_balances.player_profile_id = player_profiles.id
  AND player_currency_balances.currency_key = defaults.currency_key
WHERE player_currency_balances.id IS NULL;
