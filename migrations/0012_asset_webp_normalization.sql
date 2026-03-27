ALTER TABLE assets ADD COLUMN owner_user_id TEXT;
ALTER TABLE assets ADD COLUMN stored_format TEXT DEFAULT 'unknown';
ALTER TABLE assets ADD COLUMN usage_type TEXT DEFAULT 'generic';
ALTER TABLE assets ADD COLUMN quota_bytes INTEGER DEFAULT 0;
ALTER TABLE assets ADD COLUMN source_mime_type TEXT;
ALTER TABLE assets ADD COLUMN source_byte_size INTEGER;
ALTER TABLE assets ADD COLUMN source_width INTEGER;
ALTER TABLE assets ADD COLUMN source_height INTEGER;
ALTER TABLE assets ADD COLUMN normalization_status TEXT DEFAULT 'pending';
ALTER TABLE assets ADD COLUMN normalization_version TEXT DEFAULT 'v1';

CREATE INDEX IF NOT EXISTS idx_assets_owner_user_id
  ON assets(owner_user_id);

CREATE INDEX IF NOT EXISTS idx_assets_usage_type
  ON assets(usage_type);

CREATE INDEX IF NOT EXISTS idx_assets_project_usage_type
  ON assets(project_id, usage_type);

CREATE INDEX IF NOT EXISTS idx_assets_normalization_status
  ON assets(normalization_status);
