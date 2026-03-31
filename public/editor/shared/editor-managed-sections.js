(function () {
  function createEditorManagedSections(deps) {
    const {
      windowManager,
      definitions
    } = deps;

    const sections = {};
    (definitions || []).forEach(def => {
      if (!def?.key) return;
      sections[def.key] = window.SociaEditorManagedSection?.create?.({
        sectionFactory: def.sectionFactory,
        key: def.key,
        windowManager
      }) || null;
    });
    return sections;
  }

  window.SociaEditorManagedSections = {
    create: createEditorManagedSections
  };
})();
