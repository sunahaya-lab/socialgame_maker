(function () {
  function createEditorDashboardScreenApp(deps) {
    const {
      getLauncher,
      getSystemConfig,
      onOpenSection,
      onOpenShare,
      onOpenMembers,
      onCloseEditor
    } = deps;

    const dashboardConfig = window.EditorDashboardConfigLib?.create?.({ getSystemConfig }) || null;
    const nextDashboard = window.SociaEditorDashboard?.create?.({
      getHost: getLauncher,
      getItems: () => dashboardConfig?.getDashboardItems?.() || [],
      onSelect: key => {
        if (key === "publish-share") {
          onOpenShare?.();
          return;
        }
        if (key === "members") {
          onOpenMembers?.();
          return;
        }
        onOpenSection?.(key);
      },
      onClose: () => {
        onCloseEditor?.();
      }
    }) || null;

    function render() {
      return nextDashboard?.render?.();
    }

    function setActiveKey(nextKey) {
      return nextDashboard?.setActiveKey?.(nextKey);
    }

    function show() {
      return nextDashboard?.show?.();
    }

    function hide() {
      return nextDashboard?.hide?.();
    }

    return {
      render,
      setActiveKey,
      show,
      hide
    };
  }

  window.SociaEditorDashboardScreenApp = {
    create: createEditorDashboardScreenApp
  };
})();
