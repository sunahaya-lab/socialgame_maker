/* Transitional shared editor module.
 * Role: still carries mixed editor-side behavior from `public/lib/` while the
 * editor mainline is being reduced toward `public/editor/`.
 * Current strategy: keep behavior stable, chapterize responsibilities, and
 * extract section-local/runtime-specific logic out over time.
 */
(function () {
  function createAppEditorModule(deps) {
    // SECTION 01: dependency intake
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
      fetchJSON,
      postJSON,
      createProjectMembersRuntime,
      saveLocal,
      renderHome,
      renderEditorScreen,
      renderGachaPoolChars,
      showToast,
      esc
    } = deps;
    let sharePanelRuntimeApi = null;
    let gachaEditorFormRuntimeApi = null;
    let gachaSelectionRuntimeApi = null;
    let editorBaseCharOptionSyncRuntimeApi = null;
    let editorFormSetupRuntimeApi = null;
    let editorFormSyncRuntimeApi = null;
    let editorPreviewRuntimeApi = null;
    let editorFolderRuntimeApi = null;

    // SECTION 02: editor screen bridge + shared setup
    // `getEditorApiMethod` is intentionally kept here as a thin compatibility
    // bridge to the legacy editor screen surface. Do not move it to shared
    // helpers unless the legacy editor screen dependency disappears.
    function getEditorApiMethod(name) {
      const screen = getEditorScreen?.();
      const direct = screen?.[name];
      if (typeof direct === "function") {
        return direct.bind(screen);
      }
      return null;
    }

    function setupForms() {
      return ensureEditorFormSetupRuntimeApi()?.setupForms?.();
    }

    // SECTION 03: share panel + project member runtime
    function ensureSharePanelRuntimeApi() {
      if (!sharePanelRuntimeApi) {
        sharePanelRuntimeApi = window.SociaSharePanelRuntime?.create?.({
          getCurrentProjectId,
          getCurrentPlayerId,
          apiUrl,
          API,
          fetchJSON,
          postJSON,
          createProjectMembersRuntime,
          showToast,
          esc
        }) || null;
      }
      return sharePanelRuntimeApi;
    }

    function callSharePanelRuntime(name, args = [], fallback) {
      const method = ensureSharePanelRuntimeApi()?.[name];
      if (typeof method === "function") {
        return method(...args);
      }
      return fallback;
    }

    function handleShare() {
      return callSharePanelRuntime("handleShare");
    }

    async function listProjectMembers(projectId) {
      return callSharePanelRuntime("listProjectMembers", [projectId], []);
    }

    async function inviteProjectMember(projectId, targetUserId, role = "viewer") {
      return callSharePanelRuntime("inviteProjectMember", [projectId, targetUserId, role], []);
    }

    async function updateProjectMemberRole(projectId, targetUserId, role = "viewer") {
      return callSharePanelRuntime("updateProjectMemberRole", [projectId, targetUserId, role], []);
    }

    async function rotateCollaborativeShare(projectId) {
      return callSharePanelRuntime("rotateCollaborativeShare", [projectId], { ok: false, message: "" });
    }

    async function createPublicShare(projectId) {
      return callSharePanelRuntime("createPublicShare", [projectId], { ok: false, message: "" });
    }

    async function getShareManagementSummary(projectId) {
      return callSharePanelRuntime("getShareManagementSummary", [projectId], {
        isPaid: false,
        licensePlan: "free",
        canCreatePublicShare: false,
        message: ""
      });
    }

    function ensureGachaEditorFormRuntimeApi() {
      if (!gachaEditorFormRuntimeApi) {
        gachaEditorFormRuntimeApi = window.SociaGachaEditorFormRuntime?.create?.({
          getEditState,
          getGachas,
          setGachas,
          getSystemConfig,
          getDefaultRates,
          getRarityModeConfig,
          readFileAsDataUrl,
          saveLocal,
          postJSON,
          apiUrl,
          API,
          renderHome,
          renderGachaPoolChars,
          renderEditorGachaList: () => getEditorApiMethod("renderEditorGachaList")?.(),
          renderGachaRateInputs: rates => getSystemEditor()?.renderGachaRateInputs?.(rates),
          updateEditorSubmitLabels,
          showToast
        }) || null;
      }
      return gachaEditorFormRuntimeApi;
    }

    function ensureGachaSelectionRuntimeApi() {
      if (!gachaSelectionRuntimeApi) {
        gachaSelectionRuntimeApi = window.SociaGachaSelectionRuntime?.create?.({
          getEditState,
          getGachas
        }) || null;
      }
      return gachaSelectionRuntimeApi;
    }

    function ensureEditorBaseCharOptionSyncRuntimeApi() {
      if (!editorBaseCharOptionSyncRuntimeApi) {
        editorBaseCharOptionSyncRuntimeApi = window.SociaEditorBaseCharOptionSyncRuntime?.create?.({
          getBaseChars,
          getCharacters,
          getStories,
          getEditState,
          getStoryEditor,
          getRarityLabel,
          esc
        }) || null;
      }
      return editorBaseCharOptionSyncRuntimeApi;
    }

    function ensureEditorFormSetupRuntimeApi() {
      if (!editorFormSetupRuntimeApi) {
        editorFormSetupRuntimeApi = window.SociaEditorFormSetupRuntime?.create?.({
          handleGachaSubmit,
          updateGachaFormMode,
          getBaseCharEditor,
          getEntryEditor,
          getStoryEditor,
          getSystemEditor,
          setupShareBindings: () => ensureSharePanelRuntimeApi()?.setupShareBindings?.()
        }) || null;
      }
      return editorFormSetupRuntimeApi;
    }

    function ensureEditorFormSyncRuntimeApi() {
      if (!editorFormSyncRuntimeApi) {
        editorFormSyncRuntimeApi = window.SociaEditorFormSyncRuntime?.create?.({
          getEditState
        }) || null;
      }
      return editorFormSyncRuntimeApi;
    }

    function ensureEditorPreviewRuntimeApi() {
      if (!editorPreviewRuntimeApi) {
        editorPreviewRuntimeApi = window.SociaEditorPreviewRuntime?.create?.() || null;
      }
      return editorPreviewRuntimeApi;
    }

    function ensureEditorFolderRuntimeApi() {
      if (!editorFolderRuntimeApi) {
        editorFolderRuntimeApi = window.SociaEditorFolderRuntime?.create?.({
          getSystemConfig,
          setSystemConfig,
          getDefaultSystemConfig: deps.getDefaultSystemConfig,
          saveLocal,
          postJSON,
          apiUrl,
          API,
          renderEditorScreen,
          showToast,
          esc
        }) || null;
      }
      return editorFolderRuntimeApi;
    }
    // SECTION 04: gacha editor form helpers
    function updateGachaFormMode() {
      return ensureGachaEditorFormRuntimeApi()?.updateGachaFormMode?.();
    }

    function updateSceneExpressions(sceneItem) {
      updateSceneCharacterOptions(sceneItem);
    }

    function updateSceneCharacterOptions(sceneItem) {
      const PLAYER_CHARACTER_ID = "__player__";
      const charId = sceneItem.querySelector("[name='scene-character-id']").value;
      const variantSelect = sceneItem.querySelector("[name='scene-variant']");
      const exprSelect = sceneItem.querySelector("[name='scene-expression']");
      const baseChar = charId && charId !== PLAYER_CHARACTER_ID ? getBaseCharById(charId) : null;
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
      return ensureEditorPreviewRuntimeApi()?.setupPreviews?.();
    }

    function previewImage(input, previewId, imgId) {
      return ensureEditorPreviewRuntimeApi()?.previewImage?.(input, previewId, imgId);
    }

    // SECTION 04B: active gacha helper delegation overrides
    async function handleGachaSubmit(event) {
      return ensureGachaEditorFormRuntimeApi()?.handleGachaSubmit?.(event);
    }

    function beginGachaEdit(id) {
      return ensureGachaEditorFormRuntimeApi()?.beginGachaEdit?.(id);
    }

    function resetGachaForm() {
      return ensureGachaEditorFormRuntimeApi()?.resetGachaForm?.();
    }

    // SECTION 05: shared editor wiring helpers
    // These helpers are still active shared wiring, not retired legacy bodies.
    // SECTION 05A: submit-label sync

    function updateEditorSubmitLabels() {
      return ensureEditorFormSyncRuntimeApi()?.updateEditorSubmitLabels?.();
    }

    function setSubmitLabel(formId, label) {
      return ensureEditorFormSyncRuntimeApi()?.setSubmitLabel?.(formId, label);
    }

    function getEditingFeaturedIds() {
      return ensureGachaSelectionRuntimeApi()?.getEditingFeaturedIds?.() || [];
    }

    // SECTION 05C: cross-form base character option sync

    function populateBaseCharSelects() {
      return ensureEditorBaseCharOptionSyncRuntimeApi()?.populateBaseCharSelects?.();
    }

    // SECTION 06A: folder helper cleanup boundary
    // Legacy bodies were removed. Only the delegation boundary remains here.

    // `populateFolderSelect` also resolves through the active helper delegation
    // in SECTION 06B.
    // SECTION 06B: active folder/runtime helper delegation overrides
    // This is the active path. SECTION 06A above is now legacy and can be
    // removed in small byte-safe passes because all callers should flow here.
    function normalizeFolderRecord(folder, index = 0) {
      return ensureEditorFolderRuntimeApi()?.normalizeFolderRecord?.(folder, index) || null;
    }

    function normalizeFolderList(list) {
      return ensureEditorFolderRuntimeApi()?.normalizeFolderList?.(list) || [];
    }

    function populateFolderSelects() {
      return ensureEditorFolderRuntimeApi()?.populateFolderSelects?.();
    }

    function populateFolderSelect(elementId, folders, placeholder) {
      return ensureEditorFolderRuntimeApi()?.populateFolderSelect?.(elementId, folders, placeholder);
    }

    async function persistSystemConfigState() {
      return ensureEditorFolderRuntimeApi()?.persistSystemConfigState?.();
    }

    async function createContentFolder(kind) {
      return ensureEditorFolderRuntimeApi()?.createContentFolder?.(kind) || null;
    }

    function ensureEditorFolderControls() {
      return ensureEditorFolderRuntimeApi()?.ensureEditorFolderControls?.();
    }

    function ensureFolderControlRow({ formId, anchorSelector, selectId, createButtonId, label }) {
      return ensureEditorFolderRuntimeApi()?.ensureFolderControlRow?.({ formId, anchorSelector, selectId, createButtonId, label });
    }

    function resetEditorForms() {
      getBaseCharEditor()?.resetBaseCharForm?.();
      getEntryEditor()?.resetCharacterForm?.();
      getStoryEditor()?.resetStoryForm?.();
      resetGachaForm();
    }

    // SECTION 07: public factory surface
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
      rotateCollaborativeShare,
      createPublicShare,
      getShareManagementSummary,
      listProjectMembers,
      inviteProjectMember,
      updateProjectMemberRole,
      createContentFolder,
      resetEditorForms
    };
  }

  window.AppEditorLib = {
    create: createAppEditorModule
  };
})();
