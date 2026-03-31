(function () {
  function setupTitleEditor(deps) {
    return createTitleEditor(deps);
  }

  function createTitleEditor(deps) {
    const titleText = window.TitleEditorTextLib || null;
    const text = (key, fallback = "") => titleText?.get?.(key, fallback) || fallback;

    const {
      getPlayerState,
      getBaseChars,
      getSystemConfig,
      setSystemConfig,
      persistSystemConfigState,
      showToast,
      esc
    } = deps;

    function getTitleMasters() {
      return window.TitleSystemLib?.normalizeTitleMasterCollection?.(getSystemConfig?.()?.titleMasters) || [];
    }

    function getUnlockedTitles() {
      return window.TitleSystemLib?.normalizeTitleCollection?.(getPlayerState?.()?.profile?.titles) || [];
    }

    function getBaseCharOptionsMarkup(selectedValue = "") {
      const currentValue = String(selectedValue || "").trim();
      const baseChars = Array.isArray(getBaseChars?.()) ? getBaseChars() : [];
      return [`<option value="">${esc(text("unsetSelection", "未指定"))}</option>`]
        .concat(baseChars.map(baseChar => `
          <option value="${esc(baseChar.id)}"${String(baseChar.id || "").trim() === currentValue ? " selected" : ""}>${esc(baseChar.name || baseChar.id)}</option>
        `))
        .join("");
    }

    function syncConditionControls() {
      const form = document.getElementById("title-form");
      if (!form) return;
      const unlockConditionType = String(form.unlockConditionType?.value || "always").trim() || "always";
      const pairFields = document.getElementById("title-condition-pair-fields");
      const squadFields = document.getElementById("title-condition-squad-fields");
      if (pairFields) pairFields.hidden = unlockConditionType !== "formation_pair";
      if (squadFields) squadFields.hidden = unlockConditionType !== "formation_squad";
    }

    function populateConditionSelects(config = {}) {
      const leaderSelect = document.getElementById("title-leader-base-char-select");
      const subLeaderSelect = document.getElementById("title-sub-leader-base-char-select");
      const squadSelect1 = document.getElementById("title-squad-base-char-select-1");
      const squadSelect2 = document.getElementById("title-squad-base-char-select-2");
      const squadSelect3 = document.getElementById("title-squad-base-char-select-3");
      const squadSelect4 = document.getElementById("title-squad-base-char-select-4");
      const squadSelect5 = document.getElementById("title-squad-base-char-select-5");
      const baseCharIds = Array.isArray(config.baseCharIds) ? config.baseCharIds : [];

      if (leaderSelect) leaderSelect.innerHTML = getBaseCharOptionsMarkup(config.leaderBaseCharId || "");
      if (subLeaderSelect) subLeaderSelect.innerHTML = getBaseCharOptionsMarkup(config.subLeaderBaseCharId || "");
      if (squadSelect1) squadSelect1.innerHTML = getBaseCharOptionsMarkup(baseCharIds[0] || "");
      if (squadSelect2) squadSelect2.innerHTML = getBaseCharOptionsMarkup(baseCharIds[1] || "");
      if (squadSelect3) squadSelect3.innerHTML = getBaseCharOptionsMarkup(baseCharIds[2] || "");
      if (squadSelect4) squadSelect4.innerHTML = getBaseCharOptionsMarkup(baseCharIds[3] || "");
      if (squadSelect5) squadSelect5.innerHTML = getBaseCharOptionsMarkup(baseCharIds[4] || "");
    }

    function getPreviewMarkup(title) {
      const style = window.TitleSystemLib?.createDefaultTitleStyle?.(title?.style || {});
      const background = style.backgroundType === "split"
        ? `linear-gradient(90deg, ${style.colorA} 0 50%, ${style.colorB} 50% 100%)`
        : style.colorA;
      const label = String(title?.label || "").trim() || text("previewLabel", "称号プレビュー");
      return `
        <span class="title-chip-preview" style="background:${esc(background)};color:${esc(style.textColor)};">
          ${esc(label)}
        </span>
      `;
    }

    function readDraftFromForm() {
      const form = document.getElementById("title-form");
      if (!form) return {};
      const unlockConditionType = String(form.unlockConditionType?.value || "always").trim() || "always";
      const unlockConfig = buildUnlockConfigFromForm(form, unlockConditionType);
      return {
        label: String(form.label?.value || "").trim(),
        style: {
          backgroundType: String(form.backgroundType?.value || "solid").trim() || "solid",
          colorA: String(form.colorA?.value || "#666666").trim() || "#666666",
          colorB: String(form.colorB?.value || "#666666").trim() || "#666666",
          textColor: String(form.textColor?.value || "#ffffff").trim() || "#ffffff"
        },
        unlockConditionType,
        unlockConfig
      };
    }

    function buildUnlockConfigFromForm(form, unlockConditionType) {
      if (unlockConditionType === "formation_pair") {
        return {
          leaderBaseCharId: String(form.leaderBaseCharId?.value || "").trim(),
          subLeaderBaseCharId: String(form.subLeaderBaseCharId?.value || "").trim()
        };
      }
      if (unlockConditionType === "formation_squad") {
        const baseCharIds = [
          String(form.squadBaseCharId1?.value || "").trim(),
          String(form.squadBaseCharId2?.value || "").trim(),
          String(form.squadBaseCharId3?.value || "").trim(),
          String(form.squadBaseCharId4?.value || "").trim(),
          String(form.squadBaseCharId5?.value || "").trim()
        ].filter(Boolean);
        return {
          baseCharIds,
          requiredCount: 3
        };
      }
      return {};
    }

    function renderMasterRows() {
      const activeTitleId = String(getPlayerState?.()?.profile?.activeTitleId || "").trim();
      const unlockedIds = new Set((getPlayerState?.()?.profile?.unlockedTitleIds || []).map(value => String(value || "").trim()));
      const masters = getTitleMasters();
      if (!masters.length) {
        return `<p class="editor-record-empty">${esc(text("emptyMasters", "まだ共有称号マスタがありません"))}</p>`;
      }
      return masters.map(title => {
        const isActive = title.id === activeTitleId;
        const isUnlocked = unlockedIds.has(title.id);
        return `
          <article class="editor-record-item editor-title-record" data-title-id="${esc(title.id)}">
            <div class="editor-record-item-top">
              <h5>${esc(title.label)}</h5>
              <span class="editor-record-badge">${esc(title.unlockConditionType || text("always", "always"))}</span>
            </div>
            <div class="editor-title-preview-row">
              ${getPreviewMarkup(title)}
              ${isUnlocked ? `<span class="editor-record-badge">${esc(text("unlocked", "解放済み"))}</span>` : `<span class="editor-record-badge">${esc(text("locked", "未解放"))}</span>`}
              ${isActive ? `<span class="editor-record-badge">${esc(text("equipped", "装備中"))}</span>` : ""}
            </div>
            <p>${esc(title.description || text("emptyDescription", "説明はまだありません"))}</p>
            <div class="editor-record-actions">
              <button type="button" class="editor-inline-btn" data-title-edit="${esc(title.id)}">${text("edit", "編集")}</button>
              <button type="button" class="editor-inline-btn" data-title-delete="${esc(title.id)}">${text("remove", "削除")}</button>
            </div>
          </article>
        `;
      }).join("");
    }

    function renderUnlockedRows() {
      const titles = getUnlockedTitles();
      if (!titles.length) {
        return `<p class="editor-record-empty">${esc(text("emptyUnlockedTitles", "このプレイヤーが解放済みの称号はまだありません"))}</p>`;
      }
      return titles.map(title => `
        <article class="editor-record-item editor-title-record">
          <div class="editor-record-item-top">
            <h5>${esc(title.label)}</h5>
            <span class="editor-record-badge">${esc(title.category || text("defaultCategory", "default"))}</span>
          </div>
          <div class="editor-title-preview-row">${getPreviewMarkup(title)}</div>
          <p>${esc(title.description || text("emptyDescription", "説明はまだありません"))}</p>
        </article>
      `).join("");
    }

    function renderTitleEditor() {
      const preview = document.getElementById("title-style-preview");
      const list = document.getElementById("title-list");
      const unlockedList = document.getElementById("title-unlocked-list");
      const form = document.getElementById("title-form");
      if (form) {
        syncConditionControls();
      }
      if (preview) preview.innerHTML = getPreviewMarkup(readDraftFromForm());
      if (list) list.innerHTML = renderMasterRows();
      if (unlockedList) unlockedList.innerHTML = renderUnlockedRows();
      bindListActions();
    }

    function renderDraftPreview() {
      const preview = document.getElementById("title-style-preview");
      if (preview) preview.innerHTML = getPreviewMarkup(readDraftFromForm());
    }

    function refreshConditionFieldsFromForm() {
      const form = document.getElementById("title-form");
      if (!form) return;
      const unlockConditionType = String(form.unlockConditionType?.value || "always").trim() || "always";
      populateConditionSelects(buildUnlockConfigFromForm(form, unlockConditionType));
      syncConditionControls();
    }

    function fillForm(title = null) {
      const form = document.getElementById("title-form");
      if (!form) return;
      form.reset();
      form.titleId.value = title?.id || "";
      form.label.value = title?.label || "";
      form.description.value = title?.description || "";
      form.backgroundType.value = title?.style?.backgroundType || "solid";
      form.colorA.value = title?.style?.colorA || "#666666";
      form.colorB.value = title?.style?.colorB || "#666666";
      form.textColor.value = title?.style?.textColor || "#ffffff";
      form.unlockConditionType.value = title?.unlockConditionType || "always";
      populateConditionSelects(title?.unlockConfig || {});
      syncConditionControls();
      const submit = document.getElementById("title-save-btn");
      if (submit) {
        submit.textContent = title
          ? text("saveButtonUpdate", "称号マスタを更新")
          : text("saveButtonCreate", "称号マスタを保存");
      }
      renderTitleEditor();
    }

    async function saveTitleForm(form) {
      if (!form) return;
      const titleId = String(form.titleId?.value || "").trim();
      const label = String(form.label?.value || "").trim();
      if (!label) {
        showToast?.(text("labelRequired", "称号名を入力してください。"));
        return;
      }

      const masters = getTitleMasters();
      const existing = masters.find(item => item.id === titleId) || null;
      const nextMaster = window.TitleSystemLib?.normalizeTitleMasterRecord?.({
        id: titleId || `title-master:${Date.now()}`,
        label,
        category: "custom",
        description: String(form.description?.value || "").trim(),
        style: {
          backgroundType: String(form.backgroundType?.value || "solid").trim() || "solid",
          colorA: String(form.colorA?.value || "#666666").trim() || "#666666",
          colorB: String(form.colorB?.value || "#666666").trim() || "#666666",
          textColor: String(form.textColor?.value || "#ffffff").trim() || "#ffffff"
        },
        unlockConditionType: String(form.unlockConditionType?.value || "always").trim() || "always",
        unlockConfig: buildUnlockConfigFromForm(form, String(form.unlockConditionType?.value || "always").trim() || "always")
      });
      if (!nextMaster) {
        showToast?.(text("saveFailed", "称号マスタの保存に失敗しました。"));
        return;
      }

      const nextSystemConfig = {
        ...getSystemConfig(),
        titleMasters: window.TitleSystemLib?.normalizeTitleMasterCollection?.([
          ...masters.filter(item => item.id !== titleId),
          nextMaster
        ]) || masters
      };
      setSystemConfig(nextSystemConfig);
      await persistSystemConfigState?.();
      fillForm(nextMaster);
      showToast?.(existing
        ? text("saveUpdated", "称号マスタを更新しました。")
        : text("saveCreated", "称号マスタを保存しました。"));
    }

    async function handleTitleSubmit(event) {
      event.preventDefault();
      await saveTitleForm(event.currentTarget);
    }

    async function deleteTitle(titleId) {
      const targetId = String(titleId || "").trim();
      if (!targetId) return;
      const nextSystemConfig = {
        ...getSystemConfig(),
        titleMasters: getTitleMasters().filter(item => item.id !== targetId)
      };
      setSystemConfig(nextSystemConfig);
      await persistSystemConfigState?.();
      fillForm(null);
      showToast?.(text("deleteSuccess", "称号マスタを削除しました。"));
    }

    function bindListActions() {
      const list = document.getElementById("title-list");
      if (!list || list.dataset.bound === "1") return;
      list.addEventListener("click", event => {
        const editId = event.target?.closest?.("[data-title-edit]")?.dataset?.titleEdit;
        if (editId) {
          const title = getTitleMasters().find(item => item.id === editId);
          fillForm(title || null);
          return;
        }
        const deleteId = event.target?.closest?.("[data-title-delete]")?.dataset?.titleDelete;
        if (deleteId) {
          deleteTitle(deleteId);
        }
      });
      list.dataset.bound = "1";
    }

    function setupTitleEditor() {
      const form = document.getElementById("title-form");
      if (!form || form.dataset.bound === "1") return;
      const saveButton = document.getElementById("title-save-btn");
      form.addEventListener("submit", handleTitleSubmit);
      saveButton?.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        void saveTitleForm(form);
      });
      form.addEventListener("reset", () => {
        window.setTimeout(() => fillForm(null), 0);
      });
      form.querySelectorAll("input, select, textarea").forEach(node => {
        if (node.name === "unlockConditionType") {
          node.addEventListener("change", refreshConditionFieldsFromForm);
        }
        node.addEventListener("input", () => {
          renderDraftPreview();
        });
        node.addEventListener("change", () => {
          renderDraftPreview();
        });
      });
      form.dataset.bound = "1";
      fillForm(null);
    }

    return {
      setupTitleEditor,
      renderTitleEditor
    };
  }

  window.TitleEditor = {
    setupTitleEditor,
    createTitleEditor
  };
})();
