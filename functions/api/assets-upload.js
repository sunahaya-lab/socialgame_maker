import {
  buildAssetContentUrl,
  buildAssetR2Key,
  getAssetBucket,
  getStaticUploadLimitBytes,
  getStaticMaxEdge,
  insertAssetRecord,
  isSupportedStoredStaticMime,
  normalizeAssetResponse,
  sanitizeAssetKind,
  sanitizeUsageType
} from "./_assets.js";
import {
  createCorsHeaders,
  ensureReadableAccess,
  ensureSharedContentWriteAccess,
  errorJson,
  getRequesterUserId,
  json,
  resolveShareAccess
} from "./_share-auth.js";

export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = createCorsHeaders("POST,OPTIONS");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return errorJson("このメソッドは利用できません。", 405, corsHeaders);
  }

  const access = await resolveShareAccess(request, env);
  const blockedRead = ensureReadableAccess(access, corsHeaders);
  if (blockedRead) return blockedRead;

  const formData = await request.formData();
  const body = {
    projectId: String(formData.get("projectId") || access?.projectId || "").trim(),
    userId: String(formData.get("userId") || "").trim()
  };
  const blockedWrite = await ensureSharedContentWriteAccess(request, env, access, corsHeaders, body);
  if (blockedWrite) return blockedWrite;

  const projectId = String(access?.projectId || body.projectId || "").trim();
  const ownerUserId = getRequesterUserId(request, body);
  if (!projectId) {
    return errorJson("project が必要です。", 400, corsHeaders, { code: "project_required" });
  }
  if (!ownerUserId) {
    return errorJson("user が必要です。", 400, corsHeaders, { code: "user_required" });
  }

  const bucket = getAssetBucket(env);
  if (!bucket) {
    return errorJson("R2 バインディング SOCIA_ASSETS が未設定です。", 503, corsHeaders, {
      code: "asset_bucket_required"
    });
  }
  if (!env?.SOCIA_DB) {
    return errorJson("D1 バインディング SOCIA_DB が必要です。", 500, corsHeaders, {
      code: "d1_required"
    });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return errorJson("画像ファイルが必要です。", 400, corsHeaders, { code: "file_required" });
  }

  if (!isSupportedStoredStaticMime(file.type)) {
    return errorJson("静止画アップロードは WebP 正規化済みファイルが必要です。", 400, corsHeaders, {
      code: "webp_required"
    });
  }

  if (Number(file.size || 0) <= 0) {
    return errorJson("空の画像はアップロードできません。", 400, corsHeaders, {
      code: "empty_file"
    });
  }

  if (Number(file.size || 0) > getStaticUploadLimitBytes()) {
    return errorJson("ファイルサイズが大きすぎます。", 413, corsHeaders, {
      code: "file_too_large",
      maxBytes: getStaticUploadLimitBytes()
    });
  }

  const usageType = sanitizeUsageType(formData.get("usageType"));
  const kind = sanitizeAssetKind(formData.get("kind"));
  const width = Math.max(1, Number(formData.get("width")) || 0);
  const height = Math.max(1, Number(formData.get("height")) || 0);
  const sourceWidth = Math.max(0, Number(formData.get("sourceWidth")) || 0);
  const sourceHeight = Math.max(0, Number(formData.get("sourceHeight")) || 0);
  const sourceMimeType = String(formData.get("sourceMimeType") || "").trim().slice(0, 120);
  const sourceByteSize = Math.max(0, Number(formData.get("sourceByteSize")) || 0);
  const originalFilename = String(formData.get("originalFilename") || file.name || "").trim().slice(0, 255);

  if (!width || !height) {
    return errorJson("画像サイズ情報が不足しています。", 400, corsHeaders, {
      code: "image_dimensions_required"
    });
  }

  const maxEdge = getStaticMaxEdge(usageType);
  if (Math.max(width, height) > maxEdge) {
    return errorJson("アップロード画像が許可サイズを超えています。", 400, corsHeaders, {
      code: "image_too_large_after_normalization",
      maxEdge
    });
  }

  const assetId = crypto.randomUUID();
  const now = new Date().toISOString();
  const r2Key = buildAssetR2Key(projectId, ownerUserId, assetId, "webp");

  try {
    await bucket.put(r2Key, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: "image/webp"
      }
    });

    await insertAssetRecord(env, {
      id: assetId,
      projectId,
      ownerUserId,
      kind,
      usageType,
      r2Key,
      mimeType: "image/webp",
      storedFormat: "webp",
      byteSize: Number(file.size || 0),
      quotaBytes: Number(file.size || 0),
      width,
      height,
      originalFilename,
      sourceMimeType: sourceMimeType || file.type || "",
      sourceByteSize,
      sourceWidth,
      sourceHeight,
      normalizationStatus: "ready",
      normalizationVersion: "v1",
      createdAt: now,
      updatedAt: now
    });

    return json({
      asset: normalizeAssetResponse({
        id: assetId,
        project_id: projectId,
        owner_user_id: ownerUserId,
        kind,
        usage_type: usageType,
        mime_type: "image/webp",
        stored_format: "webp",
        byte_size: Number(file.size || 0),
        quota_bytes: Number(file.size || 0),
        width,
        height,
        original_filename: originalFilename,
        source_mime_type: sourceMimeType || file.type || "",
        source_byte_size: sourceByteSize,
        source_width: sourceWidth,
        source_height: sourceHeight,
        normalization_status: "ready",
        normalization_version: "v1",
        created_at: now,
        updated_at: now
      }),
      limits: {
        maxEdge,
        maxBytes: getStaticUploadLimitBytes()
      },
      url: buildAssetContentUrl(assetId),
      storage: "r2"
    }, 201, corsHeaders);
  } catch (error) {
    console.error("Asset upload failed:", error);
    return errorJson("画像の保存に失敗しました。", 500, corsHeaders, {
      code: "asset_upload_failed"
    });
  }
}
