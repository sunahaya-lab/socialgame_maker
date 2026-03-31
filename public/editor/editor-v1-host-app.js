(function () {
  function createEditorV1HostApp(deps) {
    const {
      api,
      esc,
      getProjects,
      getCurrentProjectId,
      getCurrentProjectName,
      getCurrentPlayerId,
      getSystemConfig,
      getEditingFeaturedIds,
      handleCreateProject,
      renameProject,
      switchProject,
      getShareManagementSummary,
      rotateCollaborativeShare,
      createPublicShare,
      listProjectMembers,
      inviteProjectMember,
      updateProjectMemberRole
    } = deps;

    const hostUi = window.SociaEditorHostUi.create();
    const getShell = hostUi.getShell;
    const ensureDashboardLauncher = hostUi.ensureDashboardLauncher;

    const projectContext = window.SociaEditorProjectContext.create({
      getCurrentProjectId,
      getCurrentProjectName
    });
    const legacyBridge = window.SociaEditorLegacyBridge.create({ api });

    let editorApp = null;
    const closeRestore = window.SociaEditorCloseRestore.create({
      onShowDashboard: () => editorApp?.showDashboard?.(),
      onSetActiveKey: key => editorApp?.setActiveKey?.(key)
    });
    const sectionOrchestrator = window.SociaEditorSectionOrchestrator.create({
      getEditorApp: () => editorApp,
      getShareSection: () => shareSection,
      getMembersSection: () => membersSection
    });
    const dashboardFactory = window.SociaEditorDashboardFactory.create({
      getSystemConfig,
      getLauncher: () => document.getElementById("editor-window-launcher"),
      onActivateSection: key => sectionOrchestrator.activateSection(key),
      onOpenShare: () => {
        editorApp?.closeAll?.();
        editorApp?.openSection?.("publish-share");
      },
      onOpenMembers: () => {
        editorApp?.closeAll?.();
        editorApp?.openSection?.("members");
      },
      onCloseEditor: () => {
        window.closeEditorScreen?.();
      }
    });

    const specialSections = window.SociaEditorSpecialSections.create({
      getShell,
      esc,
      getProjects,
      getCurrentProjectId: projectContext.getProjectId,
      getCurrentProjectName: projectContext.getProjectName,
      getCurrentPlayerId,
      handleCreateProject,
      renameProject,
      switchProject,
      getShareManagementSummary,
      rotateCollaborativeShare,
      createPublicShare,
      listProjectMembers,
      inviteProjectMember,
      updateProjectMemberRole,
      onShowDashboard: () => editorApp?.showDashboard?.(),
      onSetActiveKey: key => editorApp?.setActiveKey?.(key)
    });

    const shareSection = specialSections.buildShareSection();
    const membersSection = specialSections.buildMembersSection();

    const legacyWorkspace = window.SociaEditorLegacyWorkspace.create({
      legacyBridge,
      ensureDashboardLauncher,
      bindWindowCloseRestore: () => closeRestore.bind(),
      onRenderDashboard: () => editorApp?.render?.(),
      onShowDashboard: () => editorApp?.showDashboard?.(),
      onCloseAuxWindows: () => sectionOrchestrator.closeAuxWindows()
    });
    const windowManagerCallbacks = window.SociaEditorWindowManagerCallbacks.create({
      legacyWorkspace,
      legacyBridge,
      api,
      getEditingFeaturedIds
    });

    const windowManager = window.SociaEditorWindowManager.create({
      getShell,
      windowDefs: [
        { key: "base-char" },
        { key: "character" },
        { key: "equipment-card" },
        { key: "story" },
        { key: "gacha" },
        { key: "music" },
        { key: "announcement" },
        { key: "title" },
        { key: "system" }
      ],
      onEnsureWindow: windowManagerCallbacks.onEnsureWindow,
      onOpenWindow: windowManagerCallbacks.onOpenWindow,
      onCloseWindow: windowManagerCallbacks.onCloseWindow,
      onCloseAllWindows: windowManagerCallbacks.onCloseAllWindows
    });

    const managedSections = window.SociaEditorManagedSections.create({
      windowManager,
      definitions: [
        { key: "base-char", sectionFactory: window.SociaBaseCharSection },
        { key: "character", sectionFactory: window.SociaCardSection },
        { key: "equipment-card", sectionFactory: window.SociaCardSection },
        { key: "story", sectionFactory: window.SociaStorySection },
        { key: "gacha", sectionFactory: window.SociaGachaSection },
        { key: "music", sectionFactory: window.SociaMusicSection },
        { key: "announcement", sectionFactory: window.SociaNoticesSection },
        { key: "title", sectionFactory: window.SociaTitleSection },
        { key: "system", sectionFactory: window.SociaSystemSection }
      ]
    });

    editorApp = window.SociaEditorApp.create({
      createDashboard: dashboardFactory.createDashboard,
      windowManager,
      sections: {
        ...managedSections,
        "publish-share": shareSection,
        members: membersSection
      }
    });

    function render() {
      legacyWorkspace.render();
    }

    function ensure() {
      legacyWorkspace.ensure();
      editorApp.render();
      editorApp.showDashboard();
    }

    function closeAll() {
      editorApp.closeAll();
    }

    function activate(tabName) {
      sectionOrchestrator.activateSection(tabName);
    }

    function openShareManagement() {
      sectionOrchestrator.openShareManagement();
    }

    function openMemberManagement() {
      sectionOrchestrator.openMemberManagement();
    }

    return {
      render,
      ensure,
      closeAll,
      activate,
      openShareManagement,
      openMemberManagement
    };
  }

  window.SociaEditorV1HostApp = {
    create: createEditorV1HostApp
  };
})();
