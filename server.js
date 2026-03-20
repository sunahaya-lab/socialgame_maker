const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const port = Number(process.env.PORT || 3000);
const rootDir = __dirname;
const dataDir = path.join(rootDir, "data");

const dataFiles = {
  baseChars: path.join(dataDir, "base-chars.json"),
  entries: path.join(dataDir, "entries.json"),
  stories: path.join(dataDir, "stories.json"),
  gachas: path.join(dataDir, "gachas.json")
};

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webp": "image/webp"
};

ensureDataFiles();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === "/api/base-chars") {
      await handleCollection(req, res, "baseChars", "baseChars");
      return;
    }
    if (url.pathname === "/api/entries") {
      await handleCollection(req, res, "entries", "entries");
      return;
    }
    if (url.pathname === "/api/stories") {
      await handleCollection(req, res, "stories", "stories");
      return;
    }
    if (url.pathname === "/api/gachas") {
      await handleCollection(req, res, "gachas", "gachas");
      return;
    }

    await handleStatic(url.pathname, res);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: error.message }));
  }
});

server.listen(port, () => {
  console.log(`Socia Maker server running at http://localhost:${port}`);
});

async function handleCollection(req, res, fileKey, jsonKey) {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET") {
    const items = await readData(fileKey);
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ [jsonKey]: items }));
    return;
  }

  if (req.method === "POST") {
    const body = await readBody(req);
    const input = JSON.parse(body || "{}");
    const items = await readData(fileKey);

    // Sanitize based on type
    const item = fileKey === "baseChars" ? sanitizeBaseChar(input) :
                 fileKey === "entries" ? sanitizeEntry(input) :
                 fileKey === "stories" ? sanitizeStory(input) :
                 sanitizeGacha(input);

    const existingIndex = items.findIndex(i => i.id === item.id);
    if (existingIndex >= 0) {
      items[existingIndex] = item;
    } else {
      items.unshift(item);
    }

    await writeData(fileKey, items);
    res.writeHead(201, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ [fileKey === "entries" ? "entry" : fileKey.slice(0, -1)]: item }));
    return;
  }

  res.writeHead(405, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ error: "Method not allowed" }));
}

async function handleStatic(requestPath, res) {
  const safePath = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.normalize(path.join(rootDir, safePath));

  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || "application/octet-stream";

  try {
    const content = await fs.promises.readFile(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

function ensureDataFiles() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  for (const file of Object.values(dataFiles)) {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, "[]", "utf8");
    }
  }
}

async function readData(key) {
  const raw = await fs.promises.readFile(dataFiles[key], "utf8");
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : [];
}

async function writeData(key, data) {
  await fs.promises.writeFile(dataFiles[key], JSON.stringify(data, null, 2), "utf8");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5_000_000) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function sanitizeBaseChar(input) {
  const text = (value, maxLength, fallback = "") =>
    String(value || fallback).slice(0, maxLength).trim();
  const color = /^#[0-9a-fA-F]{6}$/.test(input.color) ? input.color : "#a29bfe";
  return {
    id: text(input.id, 80, `${Date.now()}-${Math.random().toString(16).slice(2)}`),
    name: text(input.name, 30, "名称未設定"),
    description: text(input.description, 80, ""),
    color,
    portrait: text(input.portrait, 2_000_000, "")
  };
}

function sanitizeEntry(input) {
  const text = (value, maxLength, fallback = "") =>
    String(value || fallback).slice(0, maxLength).trim();
  const rarity = ["N", "R", "SR", "SSR", "UR"].includes(input.rarity) ? input.rarity : "SR";
  return {
    id: text(input.id, 80, `${Date.now()}-${Math.random().toString(16).slice(2)}`),
    name: text(input.name, 40, "名称未設定"),
    catch: text(input.catch, 120, "説明なし"),
    rarity,
    attribute: text(input.attribute, 24, "未分類"),
    image: text(input.image, 2_000_000, "")
  };
}

function sanitizeStory(input) {
  const text = (value, maxLength, fallback = "") =>
    String(value || fallback).slice(0, maxLength).trim();

  const scenes = Array.isArray(input.scenes) ? input.scenes.slice(0, 100).map(s => ({
    character: s.character ? text(s.character, 40) : null,
    text: text(s.text, 500, "..."),
    image: text(s.image, 2_000_000, "")
  })) : [];

  return {
    id: text(input.id, 80, `${Date.now()}-${Math.random().toString(16).slice(2)}`),
    title: text(input.title, 60, "無題のストーリー"),
    type: ["main", "event"].includes(input.type) ? input.type : "main",
    scenes
  };
}

function sanitizeGacha(input) {
  const text = (value, maxLength, fallback = "") =>
    String(value || fallback).slice(0, maxLength).trim();

  const rates = {};
  for (const r of ["N", "R", "SR", "SSR", "UR"]) {
    rates[r] = Math.max(0, Math.min(100, Number(input.rates?.[r]) || 0));
  }

  return {
    id: text(input.id, 80, `${Date.now()}-${Math.random().toString(16).slice(2)}`),
    title: text(input.title, 40, "無題のガチャ"),
    description: text(input.description, 80, ""),
    bannerImage: text(input.bannerImage, 2_000_000, ""),
    featured: Array.isArray(input.featured) ? input.featured.slice(0, 20).map(f => String(f).slice(0, 80)) : [],
    rates
  };
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
}
