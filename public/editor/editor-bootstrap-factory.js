/* Mainline editor bootstrap factory.
 * Role: builds active editor screen deps and home-edit entrypoints for the
 * active editor runtime from `public/editor/`.
 */
(() => {
  function create(deps = {}) {
    // SECTION 01: active editor screen bootstrap wiring
    function createActiveEditorScreen(editorDeps) {
      const bridge = window.SociaEditorRuntimeBridge?.create?.() || null;
      return bridge?.createActiveEditorScreen?.({
        runtimeName: deps.runtimeName,
        deps: editorDeps
      }) || null;
    }

    // SECTION 02: active editor dependency bundle construction
    function buildActiveEditorScreenDeps(modules = {}) {
      return window.SociaEditorScreenDeps?.create?.().build?.({
        currentProjectId: deps.currentProjectId(),
        projects: deps.getProjects(),
        getCurrentPlayerId: deps.getCurrentPlayerId,
        getBaseChars: deps.getBaseChars,
        getCharacters: deps.getCharacters,
        getAnnouncements: deps.getAnnouncements,
        getStories: deps.getStories,
        getGachas: deps.getGachas,
        getSystemConfig: deps.getSystemConfig,
        setSystemConfig: deps.setSystemConfig,
        getEditingFeaturedIds: deps.getEditingFeaturedIds,
        getRarityCssClass: deps.getRarityCssClass,
        getRarityLabel: deps.getRarityLabel,
        makeFallbackImage: deps.makeFallbackImage,
        buildStorySummary: deps.buildStorySummary,
        buildGachaRateSummary: deps.buildGachaRateSummary,
        esc: deps.esc,
        baseCharEditor: modules.baseCharEditor || null,
        entryEditor: modules.entryEditor || null,
        announcementEditor: modules.announcementEditor || null,
        titleEditor: modules.titleEditor || null,
        storyEditor: modules.storyEditor || null,
        musicEditor: modules.musicEditor || null,
        storyScreen: modules.storyScreen || null,
        systemEditor: modules.systemEditor || null,
        beginGachaEdit: deps.beginGachaEdit,
        navigateTo: deps.navigateTo,
        setActiveGacha: deps.setActiveGacha,
        collectionScreen: modules.collectionScreen || null,
        populateBaseCharSelects: deps.populateBaseCharSelects,
        populateFolderSelects: deps.populateFolderSelects,
        updateEditorSubmitLabels: deps.updateEditorSubmitLabels,
        handleCreateProject: deps.handleCreateProject,
        renameProject: deps.renameProject,
        switchProject: deps.switchProject,
        createContentFolder: deps.createContentFolder,
        persistSystemConfigState: deps.persistSystemConfigState,
        openShareSettings: deps.openShareSettings,
        getShareManagementSummary: deps.getShareManagementSummary,
        rotateCollaborativeShare: deps.rotateCollaborativeShare,
        createPublicShare: deps.createPublicShare,
        listProjectMembers: deps.listProjectMembers,
        inviteProjectMember: deps.inviteProjectMember,
        updateProjectMemberRole: deps.updateProjectMemberRole
      }) || {};
    }

    // SECTION 03: home edit mode bridge
    function openHomeEditMode() {
      deps.setEditMode();
      return deps.openHomeEditMode();
    }

    function closeHomeEditMode() {
      const result = deps.closeHomeEditMode();
      if (deps.getCurrentScreen() === "home") deps.setPlayMode();
      return result;
    }

    // SECTION 04: public factory surface
    return {
      createActiveEditorScreen,
      buildActiveEditorScreenDeps,
      openHomeEditMode,
      closeHomeEditMode
    };
  }

  window.SociaEditorBootstrapFactory = {
    create
  };
})();
