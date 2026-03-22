(function () {
  function setupEditorScreen(deps) {
    const api = createEditorScreen(deps);

    document.querySelectorAll('.editor-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.editor-tab').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.editor-panel').forEach(panel => panel.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`editor-${tab.dataset.editorTab}`).classList.add('active');
        if (tab.dataset.editorTab === 'gacha') api.renderGachaPoolChars(deps.getEditingFeaturedIds());
        if (tab.dataset.editorTab === 'system') deps.systemEditor.renderSystemForm();
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
      updateEditorSubmitLabels();
    }

    function renderBaseCharList() {
      const list = document.getElementById('base-char-list');
      list.innerHTML = '';
      const baseChars = getBaseChars();
      if (baseChars.length === 0) {
        list.innerHTML = '<p class="editor-record-empty">ベースキャラはまだ登録されていません。</p>';
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
      const characters = getCharacters();
      if (characters.length === 0) {
        list.innerHTML = '<p class="editor-record-empty">カードはまだ登録されていません。</p>';
        return;
      }

      characters.forEach(char => {
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
            <div class="editor-record-actions">
              <button class="editor-inline-btn" type="button" data-action="edit">編集</button>
              <button class="editor-inline-btn" type="button" data-action="detail">詳細</button>
            </div>
          </div>
        `;
        item.querySelector('[data-action="edit"]').addEventListener('click', () => entryEditor.beginCharacterEdit(char.id));
        item.querySelector('[data-action="detail"]').addEventListener('click', () => collectionScreen.showCardDetail(char));
        list.appendChild(item);
      });
    }

    function renderEditorStoryList() {
      const list = document.getElementById('editor-story-list');
      list.innerHTML = '';
      const stories = getStories();
      const characters = getCharacters();
      if (stories.length === 0) {
        list.innerHTML = '<p class="editor-record-empty">ストーリーはまだ登録されていません。</p>';
        return;
      }

      stories.forEach(story => {
        const linkedCard = story.entryId ? characters.find(char => char.id === story.entryId) : null;
        const item = document.createElement('div');
        item.className = 'editor-record-item';
        item.innerHTML = `
          <div class="editor-record-item-top">
            <span class="editor-record-badge">${story.type === 'main' ? 'MAIN' : story.type === 'event' ? 'EVENT' : 'CHARA'}</span>
            <span class="editor-record-meta">${story.scenes?.length || 0} scenes</span>
          </div>
          <h5>${esc(story.title)}</h5>
          <p>${esc(linkedCard ? `${linkedCard.name} / ${buildStorySummary(story)}` : buildStorySummary(story))}</p>
          <div class="editor-record-actions">
            <button class="editor-inline-btn" type="button" data-action="edit">編集</button>
            <button class="editor-inline-btn" type="button" data-action="read">読む</button>
          </div>
        `;
        item.querySelector('[data-action="edit"]').addEventListener('click', () => storyEditor.beginStoryEdit(story.id));
        item.querySelector('[data-action="read"]').addEventListener('click', () => storyScreen.openStoryReader(story));
        list.appendChild(item);
      });
    }

    function renderEditorGachaList() {
      const list = document.getElementById('editor-gacha-list');
      list.innerHTML = '';
      const gachas = getGachas();
      if (gachas.length === 0) {
        list.innerHTML = '<p class="editor-record-empty">ガチャはまだ登録されていません。</p>';
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

    return {
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