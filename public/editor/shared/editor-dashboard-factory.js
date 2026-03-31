(function () {
  function createEditorDashboardFactory(deps) {
    const {
      getSystemConfig,
      getLauncher,
      onActivateSection,
      onOpenShare,
      onOpenMembers,
      onCloseEditor
    } = deps;

    function createDashboard() {
      return window.EditorDashboardScreen?.create?.({
        getLauncher,
        getSystemConfig,
        onOpenSection: key => onActivateSection?.(key),
        onOpenShare: () => onOpenShare?.(),
        onOpenMembers: () => onOpenMembers?.(),
        onCloseEditor: () => onCloseEditor?.()
      }) || null;
    }

    return {
      createDashboard
    };
  }

  window.SociaEditorDashboardFactory = {
    create: createEditorDashboardFactory
  };
})();
