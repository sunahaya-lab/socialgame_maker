(function () {
  function createManagedSection(deps) {
    const {
      sectionFactory,
      key,
      windowManager
    } = deps;

    return sectionFactory?.create?.({
      onOpen: () => {
        windowManager?.openWindow?.(key);
      },
      onClose: () => {},
      renderContent: () => true
    }) || {
      ensure: () => windowManager?.ensureWindow?.({ key }),
      open: () => windowManager?.openWindow?.(key),
      close: () => {}
    };
  }

  window.SociaEditorManagedSection = {
    create: createManagedSection
  };
})();
