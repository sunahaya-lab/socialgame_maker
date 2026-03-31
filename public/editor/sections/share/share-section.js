(function () {
  function createShareSection(deps) {
    const {
      createScreen,
      ensureWindow,
      onOpen,
      onClose
    } = deps;

    let screen = null;

    function getScreen() {
      if (!screen && typeof createScreen === "function") {
        screen = createScreen() || null;
      }
      return screen;
    }

    function ensure() { return ensureWindow?.() || getScreen()?.ensureWindow?.(); }
    function render() { return ensure(); }
    function open() {
      onOpen?.();
      const resolved = getScreen();
      resolved?.open?.();
      return ensure();
    }
    function close() {
      onClose?.();
      getScreen()?.close?.();
    }

    return { ensure, render, open, close };
  }

  window.SociaShareSection = {
    create: createShareSection
  };
})();
