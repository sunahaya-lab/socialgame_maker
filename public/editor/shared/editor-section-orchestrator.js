(function () {
  function createEditorSectionOrchestrator(deps) {
    const {
      getEditorApp,
      getShareSection,
      getMembersSection
    } = deps;

    function closeAuxWindows() {
      getShareSection?.()?.close?.();
      getMembersSection?.()?.close?.();
    }

    function activateSection(tabName) {
      closeAuxWindows();
      getEditorApp?.()?.openSection?.(tabName || "base-char");
    }

    function openShareManagement() {
      getEditorApp?.()?.closeAll?.();
      getEditorApp?.()?.openSection?.("publish-share");
    }

    function openMemberManagement() {
      getEditorApp?.()?.closeAll?.();
      getEditorApp?.()?.openSection?.("members");
    }

    return {
      closeAuxWindows,
      activateSection,
      openShareManagement,
      openMemberManagement
    };
  }

  window.SociaEditorSectionOrchestrator = {
    create: createEditorSectionOrchestrator
  };
})();
