const fs = require("fs");
const path = "public/screens/editor-screen.js";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, text) {
  fs.writeFileSync(path, text, "utf8");
}

let s = read(path);

if (!s.includes("function text(key, fallback)")) {
  s = s.replace(
    "    const editorWindowState = new Map();\r\n",
    "    const editorWindowState = new Map();\r\n\r\n    function text(key, fallback) {\r\n      return window.UiTextLib?.get?.(key, fallback) || fallback;\r\n    }\r\n"
  );
}

const renderFolderManager = `    function renderFolderManager() {
      const modal = document.getElementById("editor-folder-manager");
      if (!modal || modal.hidden) return;
      const folderWrap = document.getElementById("editor-folder-manager-folders");
      const itemWrap = document.getElementById("editor-folder-manager-items");
      const title = document.getElementById("editor-folder-manager-title");
      const subtitle = document.getElementById("editor-folder-manager-subtitle");
      const itemsTitle = document.getElementById("editor-folder-manager-items-title");
      if (!folderWrap || !itemWrap) return;

      modal.querySelectorAll("[data-folder-kind]").forEach(button => {
        button.classList.toggle("is-active", button.dataset.folderKind === activeFolderManagerKind);
      });

      if (activeFolderManagerKind === "ui") {
        renderUiFolderManager({ folderWrap, itemWrap, title, subtitle, itemsTitle, modal });
        return;
      }

      if (activeFolderManagerKind === "music") {
        if (title) title.textContent = "Music Folders";
        if (subtitle) subtitle.textContent = "Music folder management will live here.";
        if (itemsTitle) itemsTitle.textContent = "Music Assets";
        folderWrap.innerHTML = \`<p class="editor-record-empty">\${esc(text("editor.emptyMusicFolders", "音楽フォルダはまだ未対応です"))}</p>\`;
        itemWrap.innerHTML = \`<p class="editor-record-empty">\${esc(text("editor.emptyMusicAssets", "音楽アセットはまだありません"))}</p>\`;
        modal.querySelector("#editor-folder-manager-create")?.toggleAttribute("hidden", true);
        return;
      }

      modal.querySelector("#editor-folder-manager-create")?.removeAttribute("hidden");
      const isStory = activeFolderManagerKind === "story";
      const folders = isStory ? getStoryFolders() : getCardFolders();
      const items = isStory ? getStories() : getCharacters();
      const groups = buildFolderGroups(items, folders);

      if (title) title.textContent = isStory ? "ストーリーフォルダ" : "カードフォルダ";
      if (subtitle) subtitle.textContent = isStory ? "ストーリーをまとめるフォルダです" : "カードをまとめるフォルダです";
      if (itemsTitle) itemsTitle.textContent = isStory ? "ストーリー一覧" : "カード一覧";

      folderWrap.innerHTML = groups
        .filter(group => group.id)
        .map(group => renderFolderCard(group, isStory))
        .join("") || \`<p class="editor-record-empty">\${esc(text("editor.emptyFolders", "まだありません"))}</p>\`;
      itemWrap.innerHTML = items.map(item => renderFolderItem(item, folders, isStory)).join("");

      folderWrap.querySelectorAll("[data-folder-rename]").forEach(input => {
        input.addEventListener("change", event => {
          renameFolder(activeFolderManagerKind, input.dataset.folderRename, event.target.value);
        });
      });
      itemWrap.querySelectorAll("[data-folder-assign]").forEach(select => {
        select.addEventListener("change", event => {
          const itemId = select.dataset.folderAssign || "";
          const folderId = event.target.value || null;
          if (isStory) storyEditor.assignStoryFolder(itemId, folderId);
          else entryEditor.assignCharacterFolder(itemId, folderId);
          window.setTimeout(renderEditorScreen, 0);
        });
      });
    }`;

const renderUiFolderManager = `    function renderUiFolderManager({ folderWrap, itemWrap, title, subtitle, itemsTitle, modal }) {
      const folderData = getUiFolderData();
      if (title) title.textContent = "UIフォルダ";
      if (subtitle) subtitle.textContent = "ホーム素材フォルダと登録済みアセットを確認できます";
      if (itemsTitle) itemsTitle.textContent = "UIアセット";
      modal.querySelector("#editor-folder-manager-create")?.removeAttribute("hidden");

      folderWrap.innerHTML = folderData.folders.map(folder => renderUiFolderCard(folder, folderData.assetsByFolder)).join("")
        || \`<p class="editor-record-empty">\${esc(text("editor.emptyUiFolders", "UIフォルダがありません"))}</p>\`;
      itemWrap.innerHTML = folderData.assets.map(asset => renderUiAssetCard(asset, folderData.folders)).join("")
        || \`<p class="editor-record-empty">\${esc(text("editor.emptyUiAssets", "UIアセットがありません"))}</p>\`;

      folderWrap.querySelectorAll("[data-folder-rename]").forEach(input => {
        input.addEventListener("change", event => renameUiFolder(input.dataset.folderRename, event.target.value));
      });
    }`;

const renderBaseCharList = `    function renderBaseCharList() {
      const list = document.getElementById("base-char-list");
      list.innerHTML = "";
      const baseChars = getBaseChars();
      if (baseChars.length === 0) {
        list.innerHTML = \`<p class="editor-record-empty">\${esc(text("editor.emptyBaseChars", "ベースキャラがありません"))}</p>\`;
        return;
      }

      baseChars.forEach(baseChar => {
        const item = document.createElement("div");
        item.className = "base-char-item";
        item.innerHTML = \`
          <img class="base-char-portrait" src="\${baseChar.portrait}" alt="\${esc(baseChar.name)}">
          <div class="base-char-info">
            <p class="base-char-info-name" style="color:\${baseChar.color}">\${esc(baseChar.name)}</p>
            <p class="base-char-info-desc">\${esc(baseChar.description || "")}</p>
          </div>
          <span class="base-char-color-dot" style="background:\${baseChar.color}"></span>
          <div class="editor-record-actions">
            <button class="editor-inline-btn" type="button" data-action="edit">Edit</button>
            <button class="base-char-delete" type="button" data-action="delete">Delete</button>
          </div>
        \`;
        item.querySelector('[data-action="edit"]').addEventListener("click", () => baseCharEditor.beginBaseCharEdit(baseChar.id));
        item.querySelector('[data-action="delete"]').addEventListener("click", () => baseCharEditor.deleteBaseChar(baseChar.id));
        list.appendChild(item);
      });
    }`;

const renderEditorCharacterList = `    function renderEditorCharacterList() {
      const list = document.getElementById("editor-character-list");
      list.innerHTML = "";
      list.insertAdjacentHTML("beforeend", '<div class="editor-list-toolbar"><button type="button" class="btn-secondary" data-open-folder-manager="card">Folders</button></div>');
      const groups = buildFolderGroups(getCharacters(), getCardFolders());
      if (groups.every(group => group.items.length === 0)) {
        list.insertAdjacentHTML("beforeend", \`<p class="editor-record-empty">\${esc(text("editor.emptyCards", "カードがありません"))}</p>\`);
        list.querySelector('[data-open-folder-manager="card"]')?.addEventListener("click", () => openFolderManager("card"));
        return;
      }

      list.insertAdjacentHTML("beforeend", \`<p class="editor-list-hint">\${esc(text("editor.folderHint", "フォルダ管理は別ウィンドウです Folders から名前変更やサムネイル確認ができます"))}</p>\`);

      groups.forEach(group => {
        if (group.items.length === 0) return;
        const section = document.createElement("details");
        section.className = "editor-folder-group";
        section.open = true;
        section.innerHTML = \`
          <summary>\${esc(group.name)} <span>\${group.items.length}</span></summary>
          <div class="editor-folder-group-body"></div>
        \`;
        const body = section.querySelector(".editor-folder-group-body");

        group.items.forEach(char => {
          const item = document.createElement("div");
          item.className = \`editor-record-card \${getRarityCssClass(char.rarity)}\`;
          item.innerHTML = \`
            <img src="\${char.image || makeFallbackImage(char.name, char.rarity)}" alt="\${esc(char.name)}">
            <div class="editor-record-card-body">
              <div class="editor-record-item-top">
                <span class="editor-record-badge \${getRarityCssClass(char.rarity)}">\${esc(getRarityLabel(char.rarity))}</span>
                <span class="editor-record-meta">\${esc(char.attribute || "-")}</span>
              </div>
              <h5>\${esc(char.name)}</h5>
              <p>\${esc(char.catch || "")}</p>
              <p class="editor-record-folder-chip">\${esc(getFolderName(getCardFolders(), char.folderId))}</p>
              <div class="editor-record-actions">
                <button class="editor-inline-btn" type="button" data-action="edit">Edit</button>
                <button class="editor-inline-btn" type="button" data-action="detail">Detail</button>
                <button class="editor-inline-btn" type="button" data-action="folders">Folders</button>
              </div>
            </div>
          \`;
          item.querySelector('[data-action="edit"]').addEventListener("click", () => entryEditor.beginCharacterEdit(char.id));
          item.querySelector('[data-action="detail"]').addEventListener("click", () => collectionScreen.showCardDetail(char));
          item.querySelector('[data-action="folders"]').addEventListener("click", () => openFolderManager("card"));
          body.appendChild(item);
        });

        list.appendChild(section);
      });

      list.querySelector('[data-open-folder-manager="card"]')?.addEventListener("click", () => openFolderManager("card"));
    }`;

const renderEditorStoryList = `    function renderEditorStoryList() {
      const list = document.getElementById("editor-story-list");
      list.innerHTML = "";
      list.insertAdjacentHTML("beforeend", '<div class="editor-list-toolbar"><button type="button" class="btn-secondary" data-open-folder-manager="story">Folders</button></div>');
      const groups = buildFolderGroups(getStories(), getStoryFolders());
      if (groups.every(group => group.items.length === 0)) {
        list.insertAdjacentHTML("beforeend", \`<p class="editor-record-empty">\${esc(text("editor.emptyStories", "ストーリーがありません"))}</p>\`);
        list.querySelector('[data-open-folder-manager="story"]')?.addEventListener("click", () => openFolderManager("story"));
        return;
      }

      list.insertAdjacentHTML("beforeend", \`<p class="editor-list-hint">\${esc(text("editor.folderHint", "フォルダ管理は別ウィンドウです Folders から名前変更やサムネイル確認ができます"))}</p>\`);

      let draggedStoryId = null;

      groups.forEach(group => {
        if (group.items.length === 0) return;
        const section = document.createElement("details");
        section.className = "editor-folder-group";
        section.open = true;
        section.innerHTML = \`
          <summary>\${esc(group.name)} <span>\${group.items.length}</span></summary>
          <div class="editor-folder-group-body editor-story-group-body"></div>
        \`;
        const body = section.querySelector(".editor-folder-group-body");
        body.addEventListener("dragover", event => event.preventDefault());
        body.addEventListener("drop", event => {
          event.preventDefault();
          if (!draggedStoryId) return;
          storyEditor.reorderStoriesInFolder(group.id, draggedStoryId, null);
          draggedStoryId = null;
        });

        group.items.forEach(story => {
          const linkedCard = story.entryId ? getCharacters().find(char => char.id === story.entryId) : null;
          const item = document.createElement("div");
          item.className = "editor-record-item editor-story-record";
          item.draggable = true;
          item.dataset.storyId = story.id;
          item.innerHTML = \`
            <div class="editor-record-item-top">
              <span class="editor-record-badge">\${story.type === "main" ? "MAIN" : story.type === "event" ? "EVENT" : "CHARA"}</span>
              <span class="editor-record-meta">#\${Number(story.sortOrder) || 0} / \${story.scenes?.length || 0} scenes</span>
            </div>
            <h5>\${esc(story.title)}</h5>
            <p>\${esc(linkedCard ? \`\${linkedCard.name} / \${buildStorySummary(story)}\` : buildStorySummary(story))}</p>
            <p class="editor-record-folder-chip">\${esc(getFolderName(getStoryFolders(), story.folderId))}</p>
            <div class="editor-record-actions">
              <button class="editor-inline-btn" type="button" data-action="edit">Edit</button>
              <button class="editor-inline-btn" type="button" data-action="read">Read</button>
              <button class="editor-inline-btn" type="button" data-action="folders">Folders</button>
            </div>
          \`;
          item.addEventListener("dragstart", () => {
            draggedStoryId = story.id;
            item.classList.add("is-dragging");
          });
          item.addEventListener("dragend", () => {
            draggedStoryId = null;
            item.classList.remove("is-dragging");
          });
          item.addEventListener("dragover", event => event.preventDefault());
          item.addEventListener("drop", event => {
            event.preventDefault();
            if (!draggedStoryId || draggedStoryId === story.id) return;
            storyEditor.reorderStoriesInFolder(group.id, draggedStoryId, story.id);
            draggedStoryId = null;
          });
          item.querySelector('[data-action="edit"]').addEventListener("click", () => storyEditor.beginStoryEdit(story.id));
          item.querySelector('[data-action="read"]').addEventListener("click", () => storyScreen.openStoryReader(story));
          item.querySelector('[data-action="folders"]').addEventListener("click", () => openFolderManager("story"));
          body.appendChild(item);
        });

        list.appendChild(section);
      });

      list.querySelector('[data-open-folder-manager="story"]')?.addEventListener("click", () => openFolderManager("story"));
    }`;

const renderEditorGachaList = `    function renderEditorGachaList() {
      const list = document.getElementById("editor-gacha-list");
      list.innerHTML = "";
      const gachas = getGachas();
      if (gachas.length === 0) {
        list.innerHTML = \`<p class="editor-record-empty">\${esc(text("editor.emptyGachas", "ガチャがありません"))}</p>\`;
        return;
      }

      gachas.forEach((gacha, index) => {
        const item = document.createElement("div");
        item.className = "editor-record-item";
        item.innerHTML = \`
          <div class="editor-record-item-top">
            <span class="editor-record-badge">GACHA</span>
            <span class="editor-record-meta">pickup \${gacha.featured?.length || 0}</span>
          </div>
          <h5>\${esc(gacha.title)}</h5>
          <p>\${esc(gacha.description || buildGachaRateSummary(gacha.rates))}</p>
          <div class="editor-record-actions">
            <button class="editor-inline-btn" type="button" data-action="edit">Edit</button>
            <button class="editor-inline-btn" type="button" data-action="open">Open</button>
          </div>
        \`;
        item.querySelector('[data-action="edit"]').addEventListener("click", () => beginGachaEdit(gacha.id));
        item.querySelector('[data-action="open"]').addEventListener("click", () => {
          setActiveGacha(index);
          navigateTo("gacha");
        });
        list.appendChild(item);
      });
    }`;

s = s.replace(new RegExp(String.raw`    function renderFolderManager\(\) \{[\s\S]*?    function renderFolderCard\(`), `${renderFolderManager}\r\n\r\n${renderUiFolderManager}\r\n\r\n    function renderFolderCard(`);
s = s.replace(new RegExp(String.raw`    function renderBaseCharList\(\) \{[\s\S]*?    function renderGachaPoolChars\(`), `${renderBaseCharList}\r\n\r\n${renderEditorCharacterList}\r\n\r\n${renderEditorStoryList}\r\n\r\n${renderEditorGachaList}\r\n\r\n    function renderGachaPoolChars(`);

write(path, s);
