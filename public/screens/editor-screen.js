(function () {
  function setupEditorScreen(deps) {
    const api = createEditorScreen(deps);

    document.querySelectorAll('.editor-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        api.activateEditorTab(tab.dataset.editorTab);
      });
    });

    return api;
  }

  function createEditorScreen(deps) {
    const {
      getBaseChars,
      getCharacters,
      getStories,
      getGachas,
      getCardFolders,
      getStoryFolders,
      getEditingFeaturedIds,
      getRarityCssClass,
      getRarityLabel,
      makeFallbackImage,
      buildStorySummary,
      buildGachaRateSummary,
      esc,
      baseCharEditor,
      entryEditor,
      storyEditor,
      storyScreen,
      systemEditor,
      beginGachaEdit,
      navigateTo,
      setActiveGacha,
      collectionScreen,
      populateBaseCharSelects,
      populateFolderSelects,
      updateEditorSubmitLabels
    } = deps;

    function renderEditorScreen() {
      renderBaseCharList();
      renderEditorCharacterList();
      renderEditorStoryList();
      renderEditorGachaList();
      systemEditor.renderSystemForm();
      renderGachaPoolChars(getEditingFeaturedIds());
      collectionScreen.renderCollectionFilters('all');
      populateBaseCharSelects();
      populateFolderSelects();
      updateEditorSubmitLabels();
    }

    function activateEditorTab(tabName) {
      const nextTab = tabName || 'base-char';
      document.querySelectorAll('.editor-tab').forEach(item => {
        item.classList.toggle('active', item.dataset.editorTab === nextTab);
      });
      document.querySelectorAll('.editor-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `editor-${nextTab}`);
      });
      if (nextTab === 'gacha') renderGachaPoolChars(getEditingFeaturedIds());
      if (nextTab === 'system') deps.systemEditor.renderSystemForm();
    }

    function renderBaseCharList() {
      const list = document.getElementById('base-char-list');
      list.innerHTML = '';
      const baseChars = getBaseChars();
      if (baseChars.length === 0) {
        list.innerHTML = '<p class="editor-record-empty">ベースキャラを登録するとここに表示されます。</p>';
        return;
      }

      baseChars.forEach(baseChar => {
        const item = document.createElement('div');
        item.className = 'base-char-item';
        item.innerHTML = `
          <img class="base-char-portrait" src="${baseChar.portrait}" alt="${esc(baseChar.name)}">
          <div class="base-char-info">
            <p class="base-char-info-name" style="color:${baseChar.color}">${esc(baseChar.name)}</p>
            <p class="base-char-info-desc">${esc(baseChar.description || '')}</p>
          </div>
          <span class="base-char-color-dot" style="background:${baseChar.color}"></span>
          <div class="editor-record-actions">
            <button class="editor-inline-btn" type="button" data-action="edit">編集</button>
            <button class="base-char-delete" type="button" data-action="delete">削除</button>
          </div>
        `;
        item.querySelector('[data-action="edit"]').addEventListener('click', () => baseCharEditor.beginBaseCharEdit(baseChar.id));
        item.querySelector('[data-action="delete"]').addEventListener('click', () => baseCharEditor.deleteBaseChar(baseChar.id));
        list.appendChild(item);
      });
    }

    function renderEditorCharacterList() {
      const list = document.getElementById('editor-character-list');
      list.innerHTML = '';
      const groups = buildFolderGroups(getCharacters(), getCardFolders());
      if (groups.every(group => group.items.length === 0)) {
        list.innerHTML = '<p class="editor-record-empty">カードを登録するとここに表示されます。</p>';
        return;
      }

      list.insertAdjacentHTML(
        'beforeend',
        '<p class="editor-list-hint">フォルダ見出しを押すと折りたためます。カードは一覧内のフォルダ選択から移動できます。</p>'
      );

      groups.forEach(group => {
        if (group.items.length === 0) return;
        const section = document.createElement('details');
        section.className = 'editor-folder-group';
        section.open = true;
        section.innerHTML = `
          <summary>${esc(group.name)} <span>${group.items.length}</span></summary>
          <div class="editor-folder-group-body"></div>
        `;
        const body = section.querySelector('.editor-folder-group-body');

        group.items.forEach(char => {
          const item = document.createElement('div');
          item.className = `editor-record-card ${getRarityCssClass(char.rarity)}`;
          item.innerHTML = `
            <img src="${char.image || makeFallbackImage(char.name, char.rarity)}" alt="${esc(char.name)}">
            <div class="editor-record-card-body">
              <div class="editor-record-item-top">
                <span class="editor-record-badge ${getRarityCssClass(char.rarity)}">${esc(getRarityLabel(char.rarity))}</span>
                <span class="editor-record-meta">${esc(char.attribute || '-')}</span>
              </div>
              <h5>${esc(char.name)}</h5>
              <p>${esc(char.catch || '')}</p>
              <label class="editor-inline-select">
                <span>フォルダ</span>
                <select data-action="folder-move">${renderFolderOptions(getCardFolders(), char.folderId)}</select>
              </label>
              <div class="editor-record-actions">
                <button class="editor-inline-btn" type="button" data-action="edit">編集</button>
                <button class="editor-inline-btn" type="button" data-action="detail">詳細</button>
              </div>
            </div>
          `;
          item.querySelector('[data-action="folder-move"]').addEventListener('change', event => {
            entryEditor.assignCharacterFolder(char.id, event.target.value || null);
          });
          item.querySelector('[data-action="edit"]').addEventListener('click', () => entryEditor.beginCharacterEdit(char.id));
          item.querySelector('[data-action="detail"]').addEventListener('click', () => collectionScreen.showCardDetail(char));
          body.appendChild(item);
        });

        list.appendChild(section);
      });
    }

    function renderEditorStoryList() {
      const list = document.getElementById('editor-story-list');
      list.innerHTML = '';
      const groups = buildFolderGroups(getStories(), getStoryFolders());
      if (groups.every(group => group.items.length === 0)) {
        list.innerHTML = '<p class="editor-record-empty">ストーリーを登録するとここに表示されます。</p>';
        return;
      }

      list.insertAdjacentHTML(
        'beforeend',
        '<p class="editor-list-hint">フォルダ見出しを押すと折りたためます。ストーリーはドラッグで表示順を変更できます。</p>'
      );

      let draggedStoryId = null;

      groups.forEach(group => {
        if (group.items.length === 0) return;
        const section = document.createElement('details');
        section.className = 'editor-folder-group';
        section.open = true;
        section.innerHTML = `
          <summary>${esc(group.name)} <span>${group.items.length}</span></summary>
          <div class="editor-folder-group-body editor-story-group-body"></div>
        `;
        const body = section.querySelector('.editor-folder-group-body');
        body.addEventListener('dragover', event => event.preventDefault());
        body.addEventListener('drop', event => {
          event.preventDefault();
          if (!draggedStoryId) return;
          storyEditor.reorderStoriesInFolder(group.id, draggedStoryId, null);
          draggedStoryId = null;
        });

        group.items.forEach(story => {
          const linkedCard = story.entryId ? getCharacters().find(char => char.id === story.entryId) : null;
          const item = document.createElement('div');
          item.className = 'editor-record-item editor-story-record';
          item.draggable = true;
          item.dataset.storyId = story.id;
          item.innerHTML = `
            <div class="editor-record-item-top">
              <span class="editor-record-badge">${story.type === 'main' ? 'MAIN' : story.type === 'event' ? 'EVENT' : 'CHARA'}</span>
              <span class="editor-record-meta">#${Number(story.sortOrder) || 0} / ${story.scenes?.length || 0} scenes</span>
            </div>
            <h5>${esc(story.title)}</h5>
            <p>${esc(linkedCard ? `${linkedCard.name} / ${buildStorySummary(story)}` : buildStorySummary(story))}</p>
            <label class="editor-inline-select">
              <span>フォルダ</span>
              <select data-action="folder-move">${renderFolderOptions(getStoryFolders(), story.folderId)}</select>
            </label>
            <div class="editor-record-actions">
              <button class="editor-inline-btn" type="button" data-action="edit">編集</button>
              <button class="editor-inline-btn" type="button" data-action="read">読む</button>
            </div>
          `;
          item.addEventListener('dragstart', () => {
            draggedStoryId = story.id;
            item.classList.add('is-dragging');
          });
          item.addEventListener('dragend', () => {
            draggedStoryId = null;
            item.classList.remove('is-dragging');
          });
          item.addEventListener('dragover', event => event.preventDefault());
          item.addEventListener('drop', event => {
            event.preventDefault();
            if (!draggedStoryId || draggedStoryId === story.id) return;
            storyEditor.reorderStoriesInFolder(group.id, draggedStoryId, story.id);
            draggedStoryId = null;
          });
          item.querySelector('[data-action="folder-move"]').addEventListener('change', event => {
            storyEditor.assignStoryFolder(story.id, event.target.value || null);
          });
          item.querySelector('[data-action="edit"]').addEventListener('click', () => storyEditor.beginStoryEdit(story.id));
          item.querySelector('[data-action="read"]').addEventListener('click', () => storyScreen.openStoryReader(story));
          body.appendChild(item);
        });

        list.appendChild(section);
      });
    }

    function renderEditorGachaList() {
      const list = document.getElementById('editor-gacha-list');
      list.innerHTML = '';
      const gachas = getGachas();
      if (gachas.length === 0) {
        list.innerHTML = '<p class="editor-record-empty">ガチャを登録するとここに表示されます。</p>';
        return;
      }

      gachas.forEach((gacha, index) => {
        const item = document.createElement('div');
        item.className = 'editor-record-item';
        item.innerHTML = `
          <div class="editor-record-item-top">
            <span class="editor-record-badge">GACHA</span>
            <span class="editor-record-meta">pickup ${gacha.featured?.length || 0}</span>
          </div>
          <h5>${esc(gacha.title)}</h5>
          <p>${esc(gacha.description || buildGachaRateSummary(gacha.rates))}</p>
          <div class="editor-record-actions">
            <button class="editor-inline-btn" type="button" data-action="edit">編集</button>
            <button class="editor-inline-btn" type="button" data-action="open">開く</button>
          </div>
        `;
        item.querySelector('[data-action="edit"]').addEventListener('click', () => beginGachaEdit(gacha.id));
        item.querySelector('[data-action="open"]').addEventListener('click', () => {
          setActiveGacha(index);
          navigateTo('gacha');
        });
        list.appendChild(item);
      });
    }

    function renderGachaPoolChars(selectedIds = []) {
      const container = document.getElementById('gacha-pool-chars');
      container.innerHTML = '';
      getCharacters().forEach(char => {
        const item = document.createElement('div');
        item.className = 'gacha-pool-char';
        if (selectedIds.includes(char.id)) item.classList.add('selected');
        item.dataset.charId = char.id;
        item.innerHTML = `
          <img src="${char.image || makeFallbackImage(char.name, char.rarity)}" alt="${esc(char.name)}">
          <span>${esc(getRarityLabel(char.rarity))} ${esc(char.name)}</span>
        `;
        item.addEventListener('click', () => item.classList.toggle('selected'));
        container.appendChild(item);
      });
    }

    function buildFolderGroups(items, folders) {
      const normalizedFolders = (Array.isArray(folders) ? folders : [])
        .slice()
        .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0) || a.name.localeCompare(b.name, 'ja'));
      const groups = normalizedFolders.map(folder => ({
        id: folder.id,
        name: folder.name,
        items: items
          .filter(item => (item.folderId || '') === folder.id)
          .slice()
          .sort(sortEditorItems)
      }));
      groups.unshift({
        id: '',
        name: '未分類',
        items: items
          .filter(item => !item.folderId)
          .slice()
          .sort(sortEditorItems)
      });
      return groups;
    }

    function sortEditorItems(a, b) {
      const aOrder = Number(a.sortOrder);
      const bOrder = Number(b.sortOrder);
      if (!Number.isNaN(aOrder) || !Number.isNaN(bOrder)) {
        return (Number.isNaN(aOrder) ? 0 : aOrder) - (Number.isNaN(bOrder) ? 0 : bOrder) ||
          String(a.title || a.name || '').localeCompare(String(b.title || b.name || ''), 'ja');
      }
      return String(a.title || a.name || '').localeCompare(String(b.title || b.name || ''), 'ja');
    }

    function renderFolderOptions(folders, selectedId) {
      return [`<option value="">未分類</option>`]
        .concat((Array.isArray(folders) ? folders : []).map(folder =>
          `<option value="${esc(folder.id)}"${folder.id === selectedId ? ' selected' : ''}>${esc(folder.name)}</option>`
        ))
        .join('');
    }

    return {
      activateEditorTab,
      renderEditorScreen,
      renderBaseCharList,
      renderEditorCharacterList,
      renderEditorStoryList,
      renderEditorGachaList,
      renderGachaPoolChars
    };
  }

  window.EditorScreen = {
    setupEditorScreen,
    createEditorScreen
  };
})();
