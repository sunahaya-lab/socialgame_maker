// Pages Functionsのエントリーポイント

// KV namespaceをバインド
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const room = url.searchParams.get("room") || null;
    
    // CORSヘッダーを設定
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    };

    // OPTIONSリクエスト（CORSプリフライト）
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // APIエンドポイント
    if (url.pathname === "/api/base-chars") {
      return handleCollection(request, env, "base-chars", room, corsHeaders);
    }
    if (url.pathname === "/api/entries") {
      return handleCollection(request, env, "entries", room, corsHeaders);
    }
    if (url.pathname === "/api/stories") {
      return handleCollection(request, env, "stories", room, corsHeaders);
    }
    if (url.pathname === "/api/gachas") {
      return handleCollection(request, env, "gachas", room, corsHeaders);
    }
    if (url.pathname === "/api/system") {
      return handleSystem(request, env, room, corsHeaders);
    }

    // 静的ファイルの提供
    return serveStatic(request, env, ctx);
  },
};

// コレクション（base-chars, entries, stories, gachas）のハンドラー
async function handleCollection(request, env, key, room, corsHeaders) {
  const dataKey = room ? `room:${room}:${key}` : key;
  const kv = env.SOCIALGAMEMAKER_DATA;

  if (request.method === "GET") {
    const value = await kv.get(dataKey, "json");
    return new Response(JSON.stringify({ [key]: value || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (request.method === "POST") {
    const body = await request.json();
    const items = await kv.get(dataKey, "json") || [];
    
    // 重複排除
    const existingIndex = items.findIndex(i => i.id === body.id);
    if (existingIndex >= 0) {
      items[existingIndex] = body;
    } else {
      items.unshift(body);
    }

    await kv.put(dataKey, JSON.stringify(items));
    return new Response(JSON.stringify({ [key.slice(0, -1)]: body }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// システム設定のハンドラー
async function handleSystem(request, env, room, corsHeaders) {
  const dataKey = room ? `room:${room}:system` : "system";
  const kv = env.SOCIALGAMEMAKER_DATA;

  if (request.method === "GET") {
    const value = await kv.get(dataKey, "json");
    return new Response(JSON.stringify({ system: value || { rarityMode: "classic4", orientation: "auto" } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (request.method === "POST") {
    const body = await request.json();
    await kv.put(dataKey, JSON.stringify(body));
    return new Response(JSON.stringify({ system: body }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// 静的ファイルの提供
async function serveStatic(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname === "/" ? "/index.html" : url.pathname;
  
  const assetKey = path.slice(1); // 先頭の / を削除
  
  try {
    const asset = await env.ASSETS.get(assetKey);
    
    if (asset) {
      const headers = new Headers();
      const contentType = getContentType(path);
      headers.set("Content-Type", contentType);
      
      return new Response(asset.body, { headers });
    }
  } catch (e) {
    console.error("Asset not found:", e);
  }

  return new Response("Not found", { status: 404 });
}

function getContentType(path) {
  const ext = path.split(".").pop().toLowerCase();
  const types = {
    html: "text/html; charset=utf-8",
    css: "text/css; charset=utf-8",
    js: "application/javascript; charset=utf-8",
    json: "application/json; charset=utf-8",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml; charset=utf-8",
    webp: "image/webp",
  };
  return types[ext] || "application/octet-stream";
}
``*
