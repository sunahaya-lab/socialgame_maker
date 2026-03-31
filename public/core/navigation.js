(function () {
  function createNavigation(deps) {
    const { onNavigate } = deps;
    let currentScreen = "home";

    function navigateTo(screenId) {
      currentScreen = String(screenId || "home");
      onNavigate?.(currentScreen);
      return currentScreen;
    }

    function getCurrentScreen() {
      return currentScreen;
    }

    return {
      navigateTo,
      getCurrentScreen
    };
  }

  window.SociaNavigationCore = {
    create: createNavigation
  };
})();
