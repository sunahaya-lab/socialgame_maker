(function () {
  function createAppEditorModule(deps) {
    const {
      getRoomId,
      getCurrentPlayerId,
      getCurrentProjectId,
      getEditState,
      getGachas,
      setGachas,
      getStories,
      getCharacters,
      getBaseChars,
      getSystemConfig,
      setSystemConfig,
      getEditStateObject,
      getBaseCharEditor,
      getEntryEditor,
      getStoryEditor,
      getSystemEditor,
      getEditorScreen,
      readFileAsDataUrl,
      getDefaultRates,
      getRarityModeConfig,
      getRarityLabel,
      getBaseCharById,
      apiUrl,
      API,
      postJSON,
      saveLocal,
      renderHome,
      renderEditorScreen,
      renderGachaPoolChars,
      showToast,
      esc
    } = deps;

    function setupForms() {
      document.getElementById("gacha-form")?.addEventListener("submit", handleGachaSubmit);
      document.querySelector("#gacha-form select[name='gachaType']")?.addEventListener("change", updateGachaFormMode);

      getBaseCharEditor()?.renderBaseCharVoiceLineFields?.();
      getBaseCharEditor()?.renderBaseCharHomeVoiceLineFields?.();
      getEntryEditor()?.renderCardVoiceLineFields?.();
      getEntryEditor()?.renderCardHomeVoiceLineFields?.();
      getStoryEditor()?.renderStoryVariantDefaults?.();
      getSystemEditor()?.renderSystemForm?.();
      const sceneList = document.getElementById("scene-list");
      if (sceneList) sceneList.innerHTML = "";
      getStoryEditor()?.addSceneInput?.();

      document.getElementById("share-btn")?.addEventListener("click", handleShare);
      ensureSharePanel();
    }

    function handleShare() {
      const currentProjectId = getCurrentProjectId();
      if (!currentProjectId) {
        showToast("\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u304c\u9078\u629e\u3055\u308c\u3066\u3044\u307e\u305b\u3093");
        return;
      }
      openSharePanel(currentProjectId);
    }

    async function rotateCollaborativeShare(projectId) {
      const confirmed = window.confirm("\u5171\u540c\u7de8\u96c6URL\u3092\u518d\u767a\u884c\u3057\u307e\u3059\u304b\uff1f \u4ee5\u524d\u306eURL\u306f\u4f7f\u3048\u306a\u304f\u306a\u308a\u307e\u3059");
      if (!confirmed) return;
      try {
        setSharePanelBusy(true);
        const response = await postJSON(
          apiUrl(API.collabShareRotate, {
            includeProject: false,
            query: { project: projectId }
          }),
          { projectId, userId: getCurrentPlayerId() }
        );
        const token = String(response?.collabShare?.token || "").trim();
        if (!token) throw new Error("missing_collab_token");
        copyShareUrl(buildSharedUrl(projectId, { collab: token }));
        renderSharePanelStatus("\u5171\u540c\u7de8\u96c6URL\u3092\u518d\u767a\u884c\u3057\u3001\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f");
      } catch (error) {
        console.error("Failed to rotate collaborative share:", error);
        showToast("\u5171\u540c\u7de8\u96c6URL\u306e\u767a\u884c\u306b\u5931\u6557\u3057\u307e\u3057\u305f");
        renderSharePanelStatus("\u5171\u540c\u7de8\u96c6URL\u306e\u767a\u884c\u306b\u5931\u6557\u3057\u307e\u3057\u305f", true);
      } finally {
        setSharePanelBusy(false);
      }
    }

    async function createPublicShare(projectId) {
      try {
        setSharePanelBusy(true);
        const response = await postJSON(
          apiUrl(API.publicShareCreate, {
            includeProject: false,
            query: { project: projectId }
          }),
          { projectId, userId: getCurrentPlayerId() }
        );
        const token = String(response?.publicShare?.token || "").trim();
        if (!token) throw new Error("missing_public_token");
        copyShareUrl(buildSharedUrl(projectId, { share: token }));
        renderSharePanelStatus("\u516c\u958b\u30d7\u30ec\u30a4\u5c02\u7528URL\u3092\u767a\u884c\u3057\u3001\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f");
      } catch (error) {
        console.error("Failed to create public share:", error);
        showToast("\u3053\u306e\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u3067\u306f\u516c\u958b\u5171\u6709\u3092\u5229\u7528\u3067\u304d\u307e\u305b\u3093");
        renderSharePanelStatus("\u3053\u306e\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u3067\u306f\u516c\u958b\u5171\u6709\u3092\u5229\u7528\u3067\u304d\u307e\u305b\u3093", true);
      } finally {
        setSharePanelBusy(false);
      }
    }
    function buildSharedUrl(projectId, shareParams = {}) {
      const url = new URL(location.href);
      url.searchParams.delete("room");
      url.searchParams.delete("collab");
      url.searchParams.delete("share");
      url.searchParams.delete("user");
      if (projectId) url.searchParams.set("project", projectId);
      Object.entries(shareParams).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
      });
      return url.toString();
    }

    function copyShareUrl(url) {
      navigator.clipboard.writeText(url).then(() => {
        showToast("\u5171\u6709URL\u3092\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f");
      }).catch(() => {
        prompt("\u5171\u6709URL:", url);
      });
    }

    function ensureSharePanel() {
      const screen = document.getElementById("screen-home");
      if (!screen || document.getElementById("share-panel")) return;
      const panel = document.createElement("div");
      panel.className = "share-panel";
      panel.id = "share-panel";
      panel.hidden = true;
      panel.innerHTML = `
        <div class="share-panel-head">
          <h4>\u5171\u6709</h4>
          <button type="button" class="share-panel-close" data-share-close aria-label="\u9589\u3058\u308b">&times;</button>
        </div>
        <p class="share-panel-copy">
          \u73fe\u5728\u306e\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u7528\u306b\u3001\u5171\u540c\u7de8\u96c6URL\u307e\u305f\u306f\u516c\u958b\u30d7\u30ec\u30a4\u5c02\u7528URL\u3092\u767a\u884c\u3067\u304d\u307e\u3059
        </p>
        <div class="share-panel-actions">
          <button type="button" class="btn-primary" data-share-action="collab">\u5171\u540c\u7de8\u96c6URL</button>
          <button type="button" class="btn-secondary" data-share-action="public">\u516c\u958bURL</button>
        </div>
        <p class="share-panel-plan" id="share-panel-plan"></p>
        <p class="share-panel-note">
          \u5171\u540c\u7de8\u96c6URL: \u7121\u6599\u7248\u3067\u5229\u7528\u53ef\u80fd\u3067\u3059\u3002\u7de8\u96c6\u3067\u304d\u3001\u518d\u767a\u884c\u3059\u308b\u3068\u4ee5\u524d\u306eURL\u306f\u5931\u52b9\u3057\u307e\u3059
        </p>
        <p class="share-panel-note">
          \u516c\u958bURL: \u6709\u6599\u7248\u9650\u5b9a\u3067\u3059\u3002\u30d7\u30ec\u30a4\u5c02\u7528\u3067\u3001\u7de8\u96c6\u306f\u3067\u304d\u307e\u305b\u3093
        </p>
        <p class="share-panel-status" id="share-panel-status"></p>
      `;
      screen.appendChild(panel);
      panel.querySelector("[data-share-close]")?.addEventListener("click", closeSharePanel);
      panel.querySelectorAll("[data-share-action]").forEach(button => {
        button.addEventListener("click", () => {
          const action = button.dataset.shareAction;
          const projectId = getCurrentProjectId();
          if (!projectId) {
            renderSharePanelStatus("\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u304c\u9078\u629e\u3055\u308c\u3066\u3044\u307e\u305b\u3093", true);
            return;
          }
          if (action === "collab") {
            rotateCollaborativeShare(projectId);
            return;
          }
          if (action === "public") {
            createPublicShare(projectId);
          }
        });
      });
    }

    function openSharePanel(projectId) {
      ensureSharePanel();
      const panel = document.getElementById("share-panel");
      if (!panel) return;
      panel.hidden = false;
      panel.classList.add("active");
      renderSharePanelStatus(projectId ? `\u30d7\u30ed\u30b8\u30a7\u30af\u30c8: ${projectId}` : "");
      loadSharePanelLicense(projectId);
    }

    function closeSharePanel() {
      const panel = document.getElementById("share-panel");
      if (!panel) return;
      panel.hidden = true;
      panel.classList.remove("active");
      setSharePanelBusy(false);
    }

    function setSharePanelBusy(isBusy) {
      const panel = document.getElementById("share-panel");
      if (!panel) return;
      panel.classList.toggle("is-busy", isBusy);
      panel.querySelectorAll("button").forEach(button => {
        if (button.dataset.shareClose !== undefined) return;
        button.disabled = isBusy;
      });
    }

    function renderSharePanelStatus(message, isError = false) {
      const status = document.getElementById("share-panel-status");
      if (!status) return;
      status.textContent = String(message || "");
      status.classList.toggle("is-error", Boolean(isError));
    }

    async function loadSharePanelLicense(projectId) {
      const planEl = document.getElementById("share-panel-plan");
      const publicButton = document.querySelector("#share-panel [data-share-action='public']");
      if (planEl) {
        planEl.textContent = "\u30d7\u30e9\u30f3\u60c5\u5831\u3092\u78ba\u8a8d\u3057\u3066\u3044\u307e\u3059...";
        planEl.classList.remove("is-paid", "is-free");
      }
      if (publicButton) publicButton.disabled = true;

      try {
        const response = await postJSON(
          apiUrl(API.projectLicense, {
            includeProject: false,
            query: { project: projectId, user: getCurrentPlayerId() }
          }),
          { projectId, userId: getCurrentPlayerId() }
        );
        const license = response?.license || {};
        const isPaid = String(license.licensePlan || "free") === "paid" && Number(license.publicShareEnabled || 0) === 1;
        if (planEl) {
          planEl.textContent = isPaid
            ? "\u30d7\u30e9\u30f3: \u6709\u6599\u7248\u3002\u516c\u958b\u30d7\u30ec\u30a4\u5c02\u7528\u5171\u6709\u3092\u5229\u7528\u3067\u304d\u307e\u3059"
            : "\u30d7\u30e9\u30f3: \u7121\u6599\u7248\u3002\u516c\u958b\u30d7\u30ec\u30a4\u5c02\u7528\u5171\u6709\u306f\u5229\u7528\u3067\u304d\u307e\u305b\u3093";
          planEl.classList.toggle("is-paid", isPaid);
          planEl.classList.toggle("is-free", !isPaid);
        }
        if (publicButton) publicButton.disabled = !isPaid;
      } catch (error) {
        console.error("Failed to load project license:", error);
        if (planEl) {
          planEl.textContent = "\u30d7\u30e9\u30f3\u60c5\u5831\u306e\u78ba\u8a8d\u306b\u5931\u6557\u3057\u307e\u3057\u305f";
          planEl.classList.remove("is-paid");
          planEl.classList.add("is-free");
        }
        if (publicButton) publicButton.disabled = true;
      }
    }
    function normalizeGachaCatalogMode(value) {
      if (value === "mixed_shared") return "mixed_shared";
      if (value === "split_catalogs") return "split_catalogs";
      return "characters_only";
    }

    function normalizeGachaType(value) {
      if (value === "equipment") return "equipment";
      if (value === "mixed") return "mixed";
      return "character";
    }

    function getResolvedGachaType(inputType = "character") {
      const mode = normalizeGachaCatalogMode(getSystemConfig()?.gachaCatalogMode);
      const type = normalizeGachaType(inputType);
      if (mode === "mixed_shared") return "mixed";
      if (mode === "split_catalogs") return type === "mixed" ? "character" : type;
      return "character";
    }

    function updateGachaFormMode() {
      const form = document.getElementById("gacha-form");
      if (!form) return;
      const mode = normalizeGachaCatalogMode(getSystemConfig()?.gachaCatalogMode);
      const select = form.gachaType;
      const requestedType = normalizeGachaType(select?.value);
      const gachaType = getResolvedGachaType(requestedType);
      const poolWrap = document.getElementById("gacha-pool-selector");
      const poolTitle = document.getElementById("gacha-pool-title");
      const typeNote = document.getElementById("gacha-type-note");
      if (select) {
        Array.from(select.options).forEach(option => {
          const value = normalizeGachaType(option.value);
          const allowed = mode === "split_catalogs"
            ? value === "character" || value === "equipment"
            : mode === "mixed_shared"
              ? value === "mixed"
              : value === "character";
          option.hidden = !allowed;
          option.disabled = !allowed;
        });
        select.value = gachaType;
      }
      if (poolWrap) poolWrap.hidden = gachaType === "equipment";
      if (poolTitle) {
        poolTitle.textContent = gachaType === "equipment"
          ? "\u88c5\u5099\u30d4\u30c3\u30af\u30a2\u30c3\u30d7"
          : gachaType === "mixed"
            ? "\u30ad\u30e3\u30e9 / \u88c5\u5099\u30d4\u30c3\u30af\u30a2\u30c3\u30d7"
            : "\u30ad\u30e3\u30e9\u30d4\u30c3\u30af\u30a2\u30c3\u30d7";
      }
      if (typeNote) {
        typeNote.textContent = gachaType === "equipment"
          ? "\u88c5\u5099\u30ac\u30c1\u30e3\u3067\u3059 \u88c5\u5099\u30ab\u30fc\u30c9\u3092\u6392\u51fa\u5bfe\u8c61\u306b\u3057\u307e\u3059"
          : gachaType === "mixed"
            ? "\u6df7\u5408\u30ac\u30c1\u30e3\u3067\u3059 \u30ad\u30e3\u30e9\u3068\u88c5\u5099\u3092\u540c\u3058\u30ac\u30c1\u30e3\u304b\u3089\u6392\u51fa\u3057\u307e\u3059"
            : "\u30ad\u30e3\u30e9\u30ac\u30c1\u30e3\u3067\u3059 \u30d4\u30c3\u30af\u30a2\u30c3\u30d7\u5019\u88dc\u306e\u30ab\u30fc\u30c9\u3092\u9078\u3079\u307e\u3059";
      }
    }

    async function handleGachaSubmit(event) {
      event.preventDefault();
      const form = event.target;
      const editState = getEditState();
      const gachas = getGachas();
      const existing = editState.gachaId ? gachas.find(item => item.id === editState.gachaId) : null;
      const bannerFile = form.bannerImage.files[0];
      const heroImage2File = form.heroImage2?.files?.[0];
      const heroImage3File = form.heroImage3?.files?.[0];
      const bannerImage = bannerFile ? await readFileAsDataUrl(bannerFile) : (existing?.bannerImage || existing?.heroImages?.[0] || "");
      const heroImage2 = heroImage2File ? await readFileAsDataUrl(heroImage2File) : (existing?.heroImages?.[1] || "");
      const heroImage3 = heroImage3File ? await readFileAsDataUrl(heroImage3File) : (existing?.heroImages?.[2] || "");
      const gachaType = getResolvedGachaType(form.gachaType?.value);
      const featured = gachaType === "equipment"
        ? []
        : Array.from(document.querySelectorAll(".gacha-pool-char.selected")).map(el => el.dataset.charId);
      const gacha = {
        id: editState.gachaId || crypto.randomUUID(),
        title: form.title.value.trim(),
        gachaType,
        description: form.description.value.trim(),
        bannerImage,
        displayMode: form.displayMode?.value === "manualImages" ? "manualImages" : "featuredCards",
        heroImages: [bannerImage, heroImage2, heroImage3].filter(Boolean),
        featured,
        rates: getRarityModeConfig().tiers.reduce((acc, tier) => {
          acc[tier.value] = Number(form.querySelector(`[name="rate-${tier.value}"]`)?.value) || 0;
          return acc;
        }, {})
      };
      const next = existing
        ? gachas.map(item => item.id === gacha.id ? gacha : item)
        : [...gachas, gacha];
      setGachas(next);
      saveLocal("socia-gachas", next);
      try {
        await postJSON(apiUrl(API.gachas), gacha);
      } catch (error) {
        console.error("Failed to save gacha:", error);
        showToast("ガチャの保存に失敗しました。");
      }
      resetGachaForm();
      renderHome();
      getEditorScreen()?.renderEditorGachaList?.();
      showToast(`${gacha.title}を${existing ? "更新" : "保存"}しました。`);
    }

    function updateSceneExpressions(sceneItem) {
      updateSceneCharacterOptions(sceneItem);
    }

    function updateSceneCharacterOptions(sceneItem) {
      const charId = sceneItem.querySelector("[name='scene-character-id']").value;
      const variantSelect = sceneItem.querySelector("[name='scene-variant']");
      const exprSelect = sceneItem.querySelector("[name='scene-expression']");
      const baseChar = charId ? getBaseCharById(charId) : null;
      variantSelect.innerHTML = '<option value="">未設定</option>';
      exprSelect.innerHTML = '<option value="">未設定</option>';
      if (baseChar?.variants?.length) {
        baseChar.variants.forEach(v => {
          const opt = document.createElement("option");
          opt.value = v.name;
          opt.textContent = v.name;
          variantSelect.appendChild(opt);
        });
      }
      if (baseChar?.expressions?.length) {
        baseChar.expressions.forEach(e => {
          const opt = document.createElement("option");
          opt.value = e.name;
          opt.textContent = e.name;
          exprSelect.appendChild(opt);
        });
      }
    }

    function setupPreviews() {
      const portraitInput = document.querySelector("#base-char-form input[name='portrait']");
      portraitInput?.addEventListener("change", () => previewImage(portraitInput, "base-char-preview", "base-char-preview-img"));
      const imageInput = document.querySelector("#character-form input[name='image']");
      imageInput?.addEventListener("change", () => previewImage(imageInput, "char-preview", "char-preview-img"));
    }

    function previewImage(input, previewId, imgId) {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        document.getElementById(previewId).hidden = false;
        document.getElementById(imgId).src = reader.result;
      };
      reader.readAsDataURL(file);
    }

    function beginGachaEdit(id) {
      const gacha = getGachas().find(item => item.id === id);
      if (!gacha) return;
      const editState = getEditState();
      editState.gachaId = id;
      const form = document.getElementById("gacha-form");
      form.title.value = gacha.title || "";
      form.description.value = gacha.description || "";
      if (form.gachaType) form.gachaType.value = getResolvedGachaType(gacha.gachaType);
      if (form.displayMode) {
        form.displayMode.value = gacha.displayMode === "manualImages" ? "manualImages" : "featuredCards";
      }
      getSystemEditor()?.renderGachaRateInputs?.(gacha.rates);
      renderGachaPoolChars(gacha.featured || []);
      updateGachaFormMode();
      updateEditorSubmitLabels();
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function resetGachaForm() {
      const editState = getEditState();
      editState.gachaId = null;
      const form = document.getElementById("gacha-form");
      form?.reset();
      if (form?.displayMode) form.displayMode.value = "featuredCards";
      if (form?.gachaType) form.gachaType.value = getResolvedGachaType("character");
      getSystemEditor()?.renderGachaRateInputs?.(getDefaultRates());
      renderGachaPoolChars();
      updateGachaFormMode();
      updateEditorSubmitLabels();
    }

    function updateEditorSubmitLabels() {
      const editState = getEditState();
      setSubmitLabel("base-char-form", editState.baseCharId ? "更新" : "追加");
      setSubmitLabel("character-form", editState.characterId ? "更新" : "追加");
      setSubmitLabel("story-form", editState.storyId ? "更新" : "追加");
      setSubmitLabel("gacha-form", editState.gachaId ? "更新" : "追加");
    }

    function setSubmitLabel(formId, label) {
      const button = document.querySelector(`#${formId} button[type="submit"]`);
      if (button) button.textContent = label;
    }

    function getEditingFeaturedIds() {
      const editState = getEditState();
      if (!editState.gachaId) return [];
      return getGachas().find(gacha => gacha.id === editState.gachaId)?.featured || [];
    }

    function populateBaseCharSelects() {
      const baseChars = getBaseChars();
      const characters = getCharacters();
      const stories = getStories();

      const cardSelect = document.getElementById("card-base-char-select");
      if (cardSelect) {
        const currentValue = cardSelect.value;
        cardSelect.innerHTML = '<option value="">-- ベースキャラを選択 --</option>' +
          baseChars.map(baseChar => `<option value="${esc(baseChar.id)}">${esc(baseChar.name)}</option>`).join("");
        cardSelect.value = currentValue;
      }

      document.querySelectorAll("select[name='scene-character-id']").forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">キャラを選択</option>' +
          baseChars.map(baseChar => `<option value="${esc(baseChar.id)}">${esc(baseChar.name)}</option>`).join("");
        select.value = currentValue;
      });

      const storyCardSelect = document.getElementById("story-character-select");
      if (storyCardSelect) {
        const currentValue = storyCardSelect.value;
        storyCardSelect.innerHTML = '<option value="">カードを選択</option>' +
          characters.map(char => `<option value="${esc(char.id)}">${esc(getRarityLabel(char.rarity))} ${esc(char.name)}</option>`).join("");
        storyCardSelect.value = currentValue;
      }

      const currentAssignments = getEditState().storyId
        ? (stories.find(story => story.id === getEditState().storyId)?.variantAssignments || [])
        : getStoryEditor()?.collectStoryVariantAssignments?.() || [];
      getStoryEditor()?.renderStoryVariantDefaults?.(currentAssignments);

      document.querySelectorAll("#home-opinion-list select[name='home-opinion-target'], #home-conversation-list select[name='home-conversation-target'], #home-birthday-list select[name='home-birthday-target'], #card-home-opinion-list select[name='card-home-opinion-target'], #card-home-conversation-list select[name='card-home-conversation-target'], #card-home-birthday-list select[name='card-home-birthday-target']").forEach(select => {
        const currentValue = select.value;
        const placeholder = select.name.endsWith("birthday-target") ? "誕生日対象を選択" : "対象を選択";
        select.innerHTML = `<option value="">${placeholder}</option>` +
          baseChars.map(baseChar => `<option value="${esc(baseChar.id)}">${esc(baseChar.name)}</option>`).join("");
        select.value = currentValue;
      });
    }

    function normalizeFolderRecord(folder, index = 0) {
      const id = String(folder?.id || "").trim().slice(0, 80);
      const name = String(folder?.name || "").trim().slice(0, 40);
      if (!id || !name) return null;
      return {
        id,
        name,
        sortOrder: Math.max(0, Number(folder?.sortOrder ?? index) || 0)
      };
    }

    function normalizeFolderList(list) {
      return (Array.isArray(list) ? list : [])
        .map((folder, index) => normalizeFolderRecord(folder, index))
        .filter(Boolean)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ja"));
    }

    function populateFolderSelects() {
      populateFolderSelect("card-folder-select", getSystemConfig().cardFolders, "フォルダなし");
      populateFolderSelect("story-folder-select", getSystemConfig().storyFolders, "フォルダなし");
    }

    function populateFolderSelect(elementId, folders, placeholder) {
      const select = document.getElementById(elementId);
      if (!select) return;
      const currentValue = select.value;
      select.innerHTML = `<option value="">${esc(placeholder)}</option>` +
        normalizeFolderList(folders).map(folder => `<option value="${esc(folder.id)}">${esc(folder.name)}</option>`).join("");
      select.value = currentValue;
    }

    async function persistSystemConfigState() {
      saveLocal("socia-system", getSystemConfig());
      try {
        const response = await postJSON(apiUrl(API.system), getSystemConfig());
        if (response?.system) {
          setSystemConfig({
            ...deps.getDefaultSystemConfig(),
            ...response.system,
            cardFolders: normalizeFolderList(response.system.cardFolders),
            storyFolders: normalizeFolderList(response.system.storyFolders)
          });
          saveLocal("socia-system", getSystemConfig());
        }
      } catch (error) {
        console.error("Failed to save system config:", error);
        const code = String(error?.data?.code || "");
        const requiredPack = String(error?.data?.requiredPack || "").trim();
        if (code === "billing_feature_required" && requiredPack === "battle") {
          showToast("このシステム設定を保存するには Battle Pack が必要です。");
          return;
        }
        if (code === "billing_feature_required" && requiredPack === "event") {
          showToast("このイベント設定を保存するには Event Pack が必要です。");
          return;
        }
        if (code === "billing_feature_required" && requiredPack) {
          showToast(`${requiredPack} が必要なため保存できませんでした。`);
          return;
        }
        showToast("システム設定の保存に失敗しました。");
      }
    }

    async function createContentFolder(kind) {
      const name = window.prompt(kind === "story" ? "ストーリーフォルダ名" : "カードフォルダ名");
      const trimmed = String(name || "").trim().slice(0, 40);
      if (!trimmed) return null;

      const key = kind === "story" ? "storyFolders" : "cardFolders";
      const current = normalizeFolderList(getSystemConfig()[key]);
      const folder = {
        id: crypto.randomUUID(),
        name: trimmed,
        sortOrder: current.length
      };

      setSystemConfig({
        ...getSystemConfig(),
        [key]: [...current, folder]
      });

      await persistSystemConfigState();
      populateFolderSelects();
      renderEditorScreen();
      showToast(`${trimmed}を作成しました。`);
      return folder;
    }

    function ensureEditorFolderControls() {
      ensureFolderControlRow({
        formId: "character-form",
        anchorSelector: "#card-base-char-select",
        selectId: "card-folder-select",
        createButtonId: "create-card-folder-btn",
        label: "カードフォルダ"
      });
      ensureFolderControlRow({
        formId: "story-form",
        anchorSelector: "#story-character-select-wrap, #story-form select[name='type']",
        selectId: "story-folder-select",
        createButtonId: "create-story-folder-btn",
        label: "ストーリーフォルダ"
      });
    }

    function ensureFolderControlRow({ formId, anchorSelector, selectId, createButtonId, label }) {
      if (document.getElementById(selectId)) return;
      const form = document.getElementById(formId);
      if (!form) return;
      const anchor = form.querySelector(anchorSelector);
      if (!anchor) return;

      const wrap = document.createElement("div");
      wrap.className = "editor-folder-row";
      wrap.innerHTML = `
        <label>
          ${esc(label)}
          <select name="folderId" id="${esc(selectId)}">
            <option value="">フォルダなし</option>
          </select>
        </label>
        <button type="button" class="btn-secondary editor-folder-create-btn" id="${esc(createButtonId)}">+ 新規フォルダ</button>
      `;
      anchor.closest("label, div")?.after(wrap);
    }

    function resetEditorForms() {
      getBaseCharEditor()?.resetBaseCharForm?.();
      getEntryEditor()?.resetCharacterForm?.();
      getStoryEditor()?.resetStoryForm?.();
      resetGachaForm();
    }

    return {
      ensureEditorFolderControls,
      ensureFolderControlRow,
      setupForms,
      handleShare,
      handleGachaSubmit,
      updateSceneExpressions,
      updateSceneCharacterOptions,
      setupPreviews,
      previewImage,
      beginGachaEdit,
      resetGachaForm,
      updateEditorSubmitLabels,
      setSubmitLabel,
      getEditingFeaturedIds,
      populateBaseCharSelects,
      normalizeFolderList,
      normalizeFolderRecord,
      populateFolderSelects,
      populateFolderSelect,
      persistSystemConfigState,
      createContentFolder,
      resetEditorForms
    };
  }

  window.AppEditorLib = {
    create: createAppEditorModule
  };
})();
