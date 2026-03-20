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
    const room = url.searchParams.get("room") || null;

    if (url.pathname === "/api/base-chars") {
      await handleCollection(req, res, "baseChars", "baseChars", room);
      return;
    }
    if (url.pathname === "/api/entries") {
      await handleCollection(req, res, "entries", "entries", room);
      return;
    }
    if (url.pathname === "/api/stories") {
      await handleCollection(req, res, "stories", "stories", room);
      return;
    }
    if (url.pathname === "/api/gachas") {
      await handleCollection(req, res, "gachas", "gachas", room);
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

async function handleCollection(req, res, fileKey, jsonKey, room) {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const dataPath = resolveDataPath(fileKey, room);

  if (req.method === "GET") {
    const raw = await fs.promises.readFile(dataPath, "utf8");
    const items = (() => { try { const d = JSON.parse(raw); return Array.isArray(d) ? d : []; } catch { return []; } })();
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ [jsonKey]: items }));
    return;
  }

  if (req.method === "POST") {
    const body = await readBody(req);
    const input = JSON.parse(body || "{}");
    const raw = await fs.promises.readFile(dataPath, "utf8");
    const items = (() => { try { const d = JSON.parse(raw); return Array.isArray(d) ? d : []; } catch { return []; } })();

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

    await fs.promises.writeFile(dataPath, JSON.stringify(items, null, 2), "utf8");
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
  const voiceLineKeys = [
    "gain", "evolve", "levelUp1", "levelUp2", "levelUp3",
    "leaderAssign", "subLeaderAssign", "normalAssign",
    "battleStart1", "battleStart2", "battleWave1", "battleWave2",
    "mainSkill1", "mainSkill2", "mainSkill3",
    "subSkill1", "subSkill2", "subSkill3",
    "special1", "special2", "special3",
    "retreat1", "retreat2", "retreat3",
    "victory1", "victory2", "victory3"
  ];
  const voiceLines = {};
  for (const key of voiceLineKeys) {
    voiceLines[key] = text(input.voiceLines?.[key], 200, "");
  }
  const homeVoiceLineKeys = [
    "talk1", "talk2", "talk3",
    "evolutionTalk1", "evolutionTalk2", "evolutionTalk3",
    "bond1", "bond2", "bond3", "bond4", "bond5",
    "bond6", "bond7", "bond8", "bond9", "bond10",
    "eventActive", "newYear", "birthday", "homeEnter"
  ];
  const homeVoices = {};
  for (const key of homeVoiceLineKeys) {
    homeVoices[key] = text(input.homeVoices?.[key], 200, "");
  }
  return {
    id: text(input.id, 80, `${Date.now()}-${Math.random().toString(16).slice(2)}`),
    name: text(input.name, 30, "名称未設定"),
    description: text(input.description, 80, ""),
    color,
    portrait: text(input.portrait, 2_000_000, ""),
    voiceLines,
    homeVoices,
    homeOpinions: Array.isArray(input.homeOpinions) ? input.homeOpinions.slice(0, 20).map(item => ({
      targetBaseCharId: item.targetBaseCharId ? text(item.targetBaseCharId, 80) : null,
      text: text(item.text, 200, "")
    })).filter(item => item.targetBaseCharId && item.text) : [],
    homeConversations: Array.isArray(input.homeConversations) ? input.homeConversations.slice(0, 20).map(item => ({
      targetBaseCharId: item.targetBaseCharId ? text(item.targetBaseCharId, 80) : null,
      selfText: text(item.selfText, 200, ""),
      partnerText: text(item.partnerText, 200, "")
    })).filter(item => item.targetBaseCharId && (item.selfText || item.partnerText)) : [],
    variants: Array.isArray(input.variants) ? input.variants.slice(0, 20).map(v => ({
      name: text(v.name, 30, "イベント差分"),
      image: text(v.image, 2_000_000, "")
    })) : [],
    expressions: Array.isArray(input.expressions) ? input.expressions.slice(0, 20).map(e => ({
      name: text(e.name, 30, "通常"),
      image: text(e.image, 2_000_000, "")
    })) : []
  };
}

function sanitizeEntry(input) {
  const text = (value, maxLength, fallback = "") =>
    String(value || fallback).slice(0, maxLength).trim();
  const rarity = ["N", "R", "SR", "SSR", "UR"].includes(input.rarity) ? input.rarity : "SR";
  return {
    id: text(input.id, 80, `${Date.now()}-${Math.random().toString(16).slice(2)}`),
    name: text(input.name, 40, "名称未設定"),
    baseCharId: input.baseCharId ? text(input.baseCharId, 80) : null,
    catch: text(input.catch, 120, "説明なし"),
    rarity,
    attribute: text(input.attribute, 24, "未分類"),
    image: text(input.image, 2_000_000, ""),
    lines: Array.isArray(input.lines) ? input.lines.slice(0, 20).map(l => text(l, 120, "")) .filter(Boolean) : []
  };
}

function sanitizeStory(input) {
  const text = (value, maxLength, fallback = "") =>
    String(value || fallback).slice(0, maxLength).trim();

  const scenes = Array.isArray(input.scenes) ? input.scenes.slice(0, 100).map(s => ({
    characterId: s.characterId ? text(s.characterId, 80) : null,
    character: s.character ? text(s.character, 40) : null,
    variantName: s.variantName ? text(s.variantName, 30) : null,
    expressionName: s.expressionName ? text(s.expressionName, 30) : null,
    text: text(s.text, 500, "..."),
    image: text(s.image, 2_000_000, ""),
    bgm: s.bgm ? text(s.bgm, 500) : null,
    background: s.background ? text(s.background, 2_000_000) : null
  })) : [];

  return {
    id: text(input.id, 80, `${Date.now()}-${Math.random().toString(16).slice(2)}`),
    title: text(input.title, 60, "無題のストーリー"),
    type: ["main", "event", "character"].includes(input.type) ? input.type : "main",
    entryId: input.entryId ? text(input.entryId, 80) : null,
    bgm: text(input.bgm, 500, ""),
    variantAssignments: Array.isArray(input.variantAssignments) ? input.variantAssignments.slice(0, 50).map(v => ({
      characterId: v.characterId ? text(v.characterId, 80) : null,
      variantName: v.variantName ? text(v.variantName, 30) : null
    })).filter(v => v.characterId && v.variantName) : [],
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

function resolveDataPath(fileKey, room) {
  if (!room) return dataFiles[fileKey];
  const safeRoom = room.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
  if (!safeRoom) return dataFiles[fileKey];
  const roomDir = path.join(dataDir, safeRoom);
  if (!fs.existsSync(roomDir)) fs.mkdirSync(roomDir, { recursive: true });
  const fileNames = { baseChars: "base-chars.json", entries: "entries.json", stories: "stories.json", gachas: "gachas.json" };
  const filePath = path.join(roomDir, fileNames[fileKey]);
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "[]", "utf8");
  return filePath;
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
}
