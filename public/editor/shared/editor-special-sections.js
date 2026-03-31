(function () {
  function createEditorSpecialSections(deps) {
    const {
      getShell,
      esc,
      getProjects,
      getCurrentProjectId,
      getCurrentProjectName,
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
      onShowDashboard,
      onSetActiveKey
    } = deps;

    function buildShareSection() {
      const shareScreenFactory = window.SociaShareScreenFactory?.create?.() || null;
      return window.SociaShareSection?.create?.({
        createScreen: () => shareScreenFactory?.createScreen?.({
          getShell,
          esc,
          getCurrentProjectId,
          getCurrentProjectName,
          getShareManagementSummary,
          rotateCollaborativeShare,
          createPublicShare,
          onClose: () => {
            onShowDashboard?.();
            onSetActiveKey?.("");
          }
        }) || null,
        onOpen: () => {
          onSetActiveKey?.("publish-share");
        }
      }) || null;
    }

    function buildMembersSection() {
      const membersScreenFactory = window.SociaMembersScreenFactory?.create?.() || null;
      return window.SociaMembersSection?.create?.({
        createScreen: () => membersScreenFactory?.createScreen?.({
          getShell,
          esc,
          getProjects,
          getCurrentProjectId,
          getCurrentProjectName,
          getCurrentPlayerId,
          handleCreateProject,
          renameProject,
          switchProject,
          listProjectMembers,
          inviteProjectMember,
          updateProjectMemberRole,
          onClose: () => {
            onShowDashboard?.();
            onSetActiveKey?.("");
          }
        }) || null,
        onOpen: () => {
          onSetActiveKey?.("members");
        }
      }) || null;
    }

    return {
      buildShareSection,
      buildMembersSection
    };
  }

  window.SociaEditorSpecialSections = {
    create: createEditorSpecialSections
  };
})();
