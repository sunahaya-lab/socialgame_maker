const fs = require("fs");
const path = require("path");

const repoRoot = process.cwd();
const roots = ["public", "docs", "AGENTS.md"];
const exts = new Set([".js", ".html", ".css", ".md"]);
const suspicious = ["Ã", "Â", "ã", "æ", "ç", "œ", "�"];

function walk(target, out) {
  const full = path.join(repoRoot, target);
  if (!fs.existsSync(full)) return;
  const stat = fs.statSync(full);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(full)) {
      walk(path.join(target, entry), out);
    }
    return;
  }
  if (exts.has(path.extname(full).toLowerCase())) out.push(full);
}

const files = [];
for (const root of roots) walk(root, files);

let failed = false;
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!suspicious.some(token => line.includes(token))) return;
    console.log(`${path.relative(repoRoot, file)}:${index + 1}:${line}`);
    failed = true;
  });
}

if (failed) process.exit(1);
