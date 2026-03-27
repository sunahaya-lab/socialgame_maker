const fs = require("fs");

const path = "public/screens/system-editor.js";
let s = fs.readFileSync(path, "utf8");

if (!s.includes("function text(key, fallback)")) {
  s = s.replace(
    '    let previewDragState = null;\r\n',
    '    let previewDragState = null;\r\n\r\n    function text(key, fallback) {\r\n      return window.UiTextLib?.get?.(key, fallback) || fallback;\r\n    }\r\n'
  );
}

s = s.replace(
  /<p class="layout-advanced-note">[\s\S]*?<\/p>/,
  `<p class="layout-advanced-note">\${escapeHtml(text("editor.advancedNote", "見た目は自前素材で作る前提です ここでは何のボタンか 何を表示する枠か と位置だけを決めます"))}</p>`
);

const emptyReplacements = [
  `\${escapeHtml(text("editor.emptySelectedFolder", "フォルダが選択されていません"))}`,
  `\${escapeHtml(text("editor.emptyPersonalFolders", "個人フォルダはまだありません"))}`,
  `\${escapeHtml(text("editor.emptyUploadedAssets", "アップロード済みアセットはまだありません"))}`,
  `\${escapeHtml(text("editor.emptyFreeParts", "フリーパーツはまだありません"))}`
];

let index = 0;
s = s.replace(/<p class="layout-asset-library-empty">[\s\S]*?<\/p>/g, () => {
  const replacement = emptyReplacements[index] || emptyReplacements[emptyReplacements.length - 1];
  index += 1;
  return `<p class="layout-asset-library-empty">${replacement}</p>`;
});

fs.writeFileSync(path, s, "utf8");
