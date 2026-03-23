PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  auth_subject TEXT NOT NULL UNIQUE,
  email TEXT,
  display_name TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_projects_owner_user_id ON projects(owner_user_id);

CREATE TABLE project_members (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (project_id, user_id)
);

CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);

CREATE TABLE publish_states (
  project_id TEXT PRIMARY KEY,
  is_published INTEGER NOT NULL DEFAULT 0 CHECK (is_published IN (0, 1)),
  public_slug TEXT UNIQUE,
  published_snapshot_version INTEGER NOT NULL DEFAULT 0,
  last_published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  byte_size INTEGER,
  width INTEGER,
  height INTEGER,
  original_filename TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_assets_project_id ON assets(project_id);
CREATE INDEX idx_assets_kind ON assets(kind);

CREATE TABLE base_characters (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  birthday TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#a29bfe',
  portrait_asset_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (portrait_asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

CREATE INDEX idx_base_characters_project_id ON base_characters(project_id);
CREATE INDEX idx_base_characters_project_sort_order ON base_characters(project_id, sort_order);

CREATE TABLE base_character_expressions (
  id TEXT PRIMARY KEY,
  base_character_id TEXT NOT NULL,
  name TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (base_character_id) REFERENCES base_characters(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE RESTRICT,
  UNIQUE (base_character_id, name)
);

CREATE TABLE base_character_variants (
  id TEXT PRIMARY KEY,
  base_character_id TEXT NOT NULL,
  name TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (base_character_id) REFERENCES base_characters(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE RESTRICT,
  UNIQUE (base_character_id, name)
);

CREATE TABLE base_character_voice_lines (
  id TEXT PRIMARY KEY,
  base_character_id TEXT NOT NULL,
  voice_key TEXT NOT NULL,
  text_value TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (base_character_id) REFERENCES base_characters(id) ON DELETE CASCADE,
  UNIQUE (base_character_id, voice_key)
);

CREATE TABLE base_character_home_voice_lines (
  id TEXT PRIMARY KEY,
  base_character_id TEXT NOT NULL,
  voice_key TEXT NOT NULL,
  text_value TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (base_character_id) REFERENCES base_characters(id) ON DELETE CASCADE,
  UNIQUE (base_character_id, voice_key)
);

CREATE TABLE base_character_home_opinions (
  id TEXT PRIMARY KEY,
  base_character_id TEXT NOT NULL,
  target_base_character_id TEXT NOT NULL,
  text_value TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (base_character_id) REFERENCES base_characters(id) ON DELETE CASCADE,
  FOREIGN KEY (target_base_character_id) REFERENCES base_characters(id) ON DELETE CASCADE
);

CREATE TABLE base_character_home_conversations (
  id TEXT PRIMARY KEY,
  base_character_id TEXT NOT NULL,
  target_base_character_id TEXT NOT NULL,
  self_text TEXT NOT NULL DEFAULT '',
  partner_text TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (base_character_id) REFERENCES base_characters(id) ON DELETE CASCADE,
  FOREIGN KEY (target_base_character_id) REFERENCES base_characters(id) ON DELETE CASCADE
);

CREATE TABLE base_character_home_birthdays (
  id TEXT PRIMARY KEY,
  base_character_id TEXT NOT NULL,
  target_base_character_id TEXT NOT NULL,
  text_value TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (base_character_id) REFERENCES base_characters(id) ON DELETE CASCADE,
  FOREIGN KEY (target_base_character_id) REFERENCES base_characters(id) ON DELETE CASCADE
);

CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  base_character_id TEXT,
  name TEXT NOT NULL,
  catch_text TEXT NOT NULL DEFAULT '',
  rarity TEXT NOT NULL,
  attribute TEXT NOT NULL DEFAULT '',
  image_asset_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (base_character_id) REFERENCES base_characters(id) ON DELETE SET NULL,
  FOREIGN KEY (image_asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

CREATE INDEX idx_cards_project_id ON cards(project_id);
CREATE INDEX idx_cards_project_base_character_id ON cards(project_id, base_character_id);

CREATE TABLE card_voice_lines (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  voice_key TEXT NOT NULL,
  text_value TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  UNIQUE (card_id, voice_key)
);

CREATE TABLE card_home_voice_lines (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  voice_key TEXT NOT NULL,
  text_value TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  UNIQUE (card_id, voice_key)
);

CREATE TABLE card_home_opinions (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  target_base_character_id TEXT NOT NULL,
  text_value TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  FOREIGN KEY (target_base_character_id) REFERENCES base_characters(id) ON DELETE CASCADE
);

CREATE TABLE card_home_conversations (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  target_base_character_id TEXT NOT NULL,
  self_text TEXT NOT NULL DEFAULT '',
  partner_text TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  FOREIGN KEY (target_base_character_id) REFERENCES base_characters(id) ON DELETE CASCADE
);

CREATE TABLE card_home_birthdays (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  target_base_character_id TEXT NOT NULL,
  text_value TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  FOREIGN KEY (target_base_character_id) REFERENCES base_characters(id) ON DELETE CASCADE
);

CREATE TABLE stories (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('main', 'event', 'character')),
  title TEXT NOT NULL,
  target_card_id TEXT,
  bgm_asset_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (target_card_id) REFERENCES cards(id) ON DELETE SET NULL,
  FOREIGN KEY (bgm_asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

CREATE INDEX idx_stories_project_id ON stories(project_id);
CREATE INDEX idx_stories_project_type ON stories(project_id, type);

CREATE TABLE story_variant_defaults (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL,
  base_character_id TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  FOREIGN KEY (base_character_id) REFERENCES base_characters(id) ON DELETE CASCADE,
  UNIQUE (story_id, base_character_id)
);

CREATE TABLE story_scenes (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  base_character_id TEXT,
  expression_name TEXT,
  variant_name TEXT,
  text_value TEXT NOT NULL DEFAULT '',
  background_asset_id TEXT,
  bgm_asset_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  FOREIGN KEY (base_character_id) REFERENCES base_characters(id) ON DELETE SET NULL,
  FOREIGN KEY (background_asset_id) REFERENCES assets(id) ON DELETE SET NULL,
  FOREIGN KEY (bgm_asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

CREATE INDEX idx_story_scenes_story_id_sort_order ON story_scenes(story_id, sort_order);

CREATE TABLE gachas (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  banner_asset_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (banner_asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

CREATE INDEX idx_gachas_project_id ON gachas(project_id);

CREATE TABLE gacha_featured_cards (
  id TEXT PRIMARY KEY,
  gacha_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gacha_id) REFERENCES gachas(id) ON DELETE CASCADE,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  UNIQUE (gacha_id, card_id)
);

CREATE TABLE gacha_rates (
  id TEXT PRIMARY KEY,
  gacha_id TEXT NOT NULL,
  rarity_key TEXT NOT NULL,
  rate_value REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gacha_id) REFERENCES gachas(id) ON DELETE CASCADE,
  UNIQUE (gacha_id, rarity_key)
);

CREATE TABLE system_configs (
  project_id TEXT PRIMARY KEY,
  rarity_mode TEXT NOT NULL DEFAULT 'classic4',
  orientation TEXT NOT NULL DEFAULT 'auto',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
