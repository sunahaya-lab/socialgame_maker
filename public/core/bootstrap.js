(function () {
  function createBootstrap(deps) {
    const { runtime } = deps;

    async function init() {
      return runtime?.init?.();
    }

    return {
      init
    };
  }

  window.SociaBootstrapCore = {
    create: createBootstrap
  };
})();
