import { findAssetRecord, getAssetBucket } from "./_assets.js";
import { createCorsHeaders, errorJson } from "./_share-auth.js";

export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = createCorsHeaders("GET,OPTIONS");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "GET") {
    return errorJson("このメソッドは利用できません。", 405, corsHeaders);
  }

  const assetId = String(new URL(request.url).searchParams.get("id") || "").trim();
  if (!assetId) {
    return errorJson("asset id が必要です。", 400, corsHeaders, { code: "asset_id_required" });
  }

  const bucket = getAssetBucket(env);
  if (!bucket) {
    return errorJson("R2 バインディング SOCIA_ASSETS が未設定です。", 503, corsHeaders, {
      code: "asset_bucket_required"
    });
  }

  try {
    const asset = await findAssetRecord(env, assetId);
    if (!asset?.r2_key) {
      return errorJson("対象のアセットが見つかりません。", 404, corsHeaders, {
        code: "asset_not_found"
      });
    }

    const object = await bucket.get(String(asset.r2_key));
    if (!object) {
      return errorJson("アセット本体が見つかりません。", 404, corsHeaders, {
        code: "asset_blob_not_found"
      });
    }

    return new Response(object.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": String(asset.mime_type || object.httpMetadata?.contentType || "application/octet-stream"),
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch (error) {
    console.error("Failed to serve asset content:", error);
    return errorJson("アセットの読み込みに失敗しました。", 500, corsHeaders, {
      code: "asset_read_failed"
    });
  }
}
