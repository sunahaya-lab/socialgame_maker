(function () {
  function createBaseCharSection(deps) {
    const { renderContent, onOpen, onClose } = deps;

    function ensure() {
      return true;
    }

    function render() {
      return renderContent?.();
    }

    function open() {
      onOpen?.();
      return render();
    }

    function close() {
      onClose?.();
    }

    return { ensure, render, open, close };
  }

  window.SociaBaseCharSection = {
    create: createBaseCharSection
  };
})();
