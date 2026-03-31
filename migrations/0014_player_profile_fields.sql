PRAGMA foreign_keys = ON;

ALTER TABLE player_profiles
  ADD COLUMN birthday TEXT NOT NULL DEFAULT '';
