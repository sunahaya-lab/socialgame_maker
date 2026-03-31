(function () {
  function createEditorApp(deps) {
    const {
      dashboard,
      createDashboard,
      windowManager,
      sections
    } = deps;

    const resolvedDashboard = dashboard || createDashboard?.() || null;

    function getSection(key) {
      return sections?.[key] || null;
    }

    function render() {
      resolvedDashboard?.render?.();
      return true;
    }

    function setActiveKey(key) {
      resolvedDashboard?.setActiveKey?.(key || "");
    }

    function showDashboard() {
      resolvedDashboard?.show?.();
    }

    function hideDashboard() {
      resolvedDashboard?.hide?.();
    }

    function openSection(key) {
      const section = getSection(key);
      if (!section) return false;
      setActiveKey(key);
      hideDashboard();
      section.ensure?.();
      section.open?.();
      return true;
    }

    function closeAll() {
      windowManager?.closeAllWindows?.();
      Object.values(sections || {}).forEach(section => section?.close?.());
      setActiveKey("");
      showDashboard();
    }

    return {
      render,
      setActiveKey,
      showDashboard,
      hideDashboard,
      openSection,
      closeAll
    };
  }

  window.SociaEditorApp = {
    create: createEditorApp
  };
})();
