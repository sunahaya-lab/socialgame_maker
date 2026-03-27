const STATIC_UPLOAD_LIMIT_BYTES = 15 * 1024 * 1024;
const STATIC_MAX_EDGE_BY_USAGE = {
  portrait: 1800,
  expression: 1800,
  card: 1600,
  banner: 1600,
  background: 1600,
  generic: 1600
};

const ALLOWED_USAGE_TYPES = new Set([
  "portrait",
  "expression",
  "card",
  "banner",
  "background",
  "generic"
]);

const ALLOWED_ASSET_KINDS = new Set([
  "base-character-portrait",
  "base-character-expression",
  "base-character-variant",
  "card-image",
  "story-background",
  "gacha-banner",
  "generic-image"
]);

export function getAssetBucket(env) {
  return env?.SOCIA_ASSETS || null;
}

export function sanitizeUsageType(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ALLOWED_USAGE_TYPES.has(normalized) ? normalized : "generic";
}

export function sanitizeAssetKind(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ALLOWED_ASSET_KINDS.has(normalized) ? normalized : "generic-image";
}

export function getStaticMaxEdge(usageType) {
  return STATIC_MAX_EDGE_BY_USAGE[sanitizeUsageType(usageType)] || STATIC_MAX_EDGE_BY_USAGE.generic;
}

export function getStaticUploadLimitBytes() {
  return STATIC_UPLOAD_LIMIT_BYTES;
}

export function isSupportedStoredStaticMime(mimeType) {
  return String(mimeType || "").trim().toLowerCase() === "image/webp";
}

export function buildAssetR2Key(projectId, ownerUserId, assetId, extension = "webp") {
  const safeProjectId = String(projectId || "global").trim() || "global";
  const safeOwnerUserId = String(ownerUserId || "unknown").trim() || "unknown";
  const safeAssetId = String(assetId || crypto.randomUUID()).trim();
  return `projects/${safeProjectId}/users/${safeOwnerUserId}/assets/${safeAssetId}.${extension}`;
}

export function buildAssetContentUrl(assetId) {
  return `/api/assets-content?id=${encodeURIComponent(String(assetId || "").trim())}`;
}

export async function insertAssetRecord(env, asset) {
  if (!env?.SOCIA_DB) {
    throw new Error("SOCIA_DB binding is required for asset uploads.");
  }

  await env.SOCIA_DB.prepare(`
    INSERT INTO assets (
      id,
      project_id,
      owner_user_id,
      kind,
      usage_type,
      r2_key,
      mime_type,
      stored_format,
      byte_size,
      quota_bytes,
      width,
      height,
      original_filename,
      source_mime_type,
      source_byte_size,
      source_width,
      source_height,
      normalization_status,
      normalization_version,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    asset.id,
    asset.projectId,
    asset.ownerUserId,
    asset.kind,
    asset.usageType,
    asset.r2Key,
    asset.mimeType,
    asset.storedFormat,
    asset.byteSize,
    asset.quotaBytes,
    asset.width,
    asset.height,
    asset.originalFilename,
    asset.sourceMimeType,
    asset.sourceByteSize,
    asset.sourceWidth,
    asset.sourceHeight,
    asset.normalizationStatus,
    asset.normalizationVersion,
    asset.createdAt,
    asset.updatedAt
  ).run();
}

export async function findAssetRecord(env, assetId) {
  if (!env?.SOCIA_DB) return null;
  return env.SOCIA_DB.prepare(`
    SELECT
      id,
      project_id,
      owner_user_id,
      kind,
      usage_type,
      r2_key,
      mime_type,
      stored_format,
      byte_size,
      quota_bytes,
      width,
      height,
      original_filename,
      source_mime_type,
      source_byte_size,
      source_width,
      source_height,
      normalization_status,
      normalization_version,
      created_at,
      updated_at
    FROM assets
    WHERE id = ?
    LIMIT 1
  `).bind(assetId).first();
}

export function normalizeAssetResponse(row) {
  if (!row?.id) return null;
  return {
    id: String(row.id),
    projectId: String(row.project_id || ""),
    ownerUserId: String(row.owner_user_id || ""),
    kind: String(row.kind || ""),
    usageType: String(row.usage_type || "generic"),
    mimeType: String(row.mime_type || "image/webp"),
    storedFormat: String(row.stored_format || "webp"),
    byteSize: Number(row.byte_size || 0),
    quotaBytes: Number(row.quota_bytes || row.byte_size || 0),
    width: Number(row.width || 0),
    height: Number(row.height || 0),
    originalFilename: String(row.original_filename || ""),
    sourceMimeType: String(row.source_mime_type || ""),
    sourceByteSize: Number(row.source_byte_size || 0),
    sourceWidth: Number(row.source_width || 0),
    sourceHeight: Number(row.source_height || 0),
    normalizationStatus: String(row.normalization_status || "ready"),
    normalizationVersion: String(row.normalization_version || "v1"),
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || ""),
    src: buildAssetContentUrl(row.id)
  };
}
