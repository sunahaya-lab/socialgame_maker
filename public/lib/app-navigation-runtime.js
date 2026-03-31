(function () {
  function createAppNavigationRuntime(deps) {
    const {
      getCurrentProjectId,
      getCurrentMode,
      setCurrentMode,
      applyAppMode,
      getCurrentScreen,
      setCurrentScreen,
      getFormationScreen,
      getGachaScreen,
      getStoryScreen,
      getEventScreen,
      getCollectionScreen,
      renderHome,
      renderBattleScreen,
      renderGachaScreen,
      renderStoryScreen,
      renderEventScreen,
      renderCollectionScreen,
      renderFormationScreen,
      startBattleLoop,
      stopBattleLoop,
      closeHomeEditMode,
      showToast
    } = deps;

    function bindGoButton(button, triggerNav) {
      button.addEventListener("click", event => {
        triggerNav(button.dataset.go, event);
      });
      button.addEventListener("pointerup", event => {
        triggerNav(button.dataset.go, event);
      });
    }

    function setActiveScreenElement(screen) {
      document.querySelectorAll(".screen").forEach(screenEl => screenEl.classList.remove("active"));
      const nextScreen = document.getElementById(`screen-${screen}`);
      if (!nextScreen) return null;
      nextScreen.classList.add("active");
      return nextScreen;
    }

    function setActiveBottomNav(screen) {
      document.querySelectorAll(".bottom-nav-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.go === screen);
      });
    }

    function pauseInactiveScreenAudio(screen) {
      const homeBgm = document.getElementById("home-bgm");
      const battleBgm = document.getElementById("battle-bgm");
      if (screen !== "home" && homeBgm) {
        homeBgm.pause();
      }
      if (screen !== "battle" && battleBgm) {
        battleBgm.pause();
      }
    }

    function renderActiveScreen(screen, previousScreen) {
      try {
        if (screen === "home") renderHome(previousScreen === "home" ? "refresh" : "enter");
        if (screen === "formation" && getFormationScreen()) renderFormationScreen();
        if (screen === "battle") renderBattleScreen();
        if (screen === "gacha" && getGachaScreen()) renderGachaScreen();
        if (screen === "story" && getStoryScreen()) renderStoryScreen();
        if (screen === "event" && getEventScreen()) renderEventScreen();
        if (screen === "collection" && getCollectionScreen()) renderCollectionScreen();
      } catch (error) {
        console.error("navigateTo render error:", error);
      }
    }

    function syncBattleLoopForScreen(screen) {
      if (screen === "battle") startBattleLoop();
      else stopBattleLoop();
    }

    function navigateTo(screen) {
      if (screen === "editor") {
        showToast("\u30a8\u30c7\u30a3\u30bf\u30fc\u306f\u518d\u8a2d\u8a08\u4e2d\u306e\u305f\u3081\u73fe\u5728\u306f\u7121\u52b9\u3067\u3059");
        return;
      }
      if (screen !== "home") closeHomeEditMode();
      pauseInactiveScreenAudio(screen);
      const previousScreen = getCurrentScreen();
      setCurrentScreen(screen);
      document.body.classList.toggle("title-screen-active", screen === "title");
      if (getCurrentMode() !== "play") {
        setCurrentMode("play");
        applyAppMode("play");
      }
      const nextScreen = setActiveScreenElement(screen);
      if (!nextScreen) return;
      setActiveBottomNav(screen);
      renderActiveScreen(screen, previousScreen);
      syncBattleLoopForScreen(screen);
    }

    function setupNavigation() {
      let lastNavAt = 0;
      const triggerNav = (screen, event) => {
        const now = Date.now();
        if (now - lastNavAt < 200) return;
        lastNavAt = now;
        if (event) event.preventDefault();
        if (screen === "editor") {
          showToast("\u30a8\u30c7\u30a3\u30bf\u30fc\u306f\u518d\u8a2d\u8a08\u4e2d\u306e\u305f\u3081\u73fe\u5728\u306f\u7121\u52b9\u3067\u3059");
          return;
        }
        navigateTo(screen);
      };

      document.querySelectorAll("[data-go]").forEach(btn => bindGoButton(btn, triggerNav));

      document.addEventListener("click", event => {
        const button = event.target.closest("[data-go]");
        if (!button) return;
        triggerNav(button.dataset.go, event);
      });

      document.addEventListener("pointerup", event => {
        const button = event.target.closest("[data-go]");
        if (!button) return;
        triggerNav(button.dataset.go, event);
      });
    }

    return {
      bindGoButton,
      setActiveScreenElement,
      setActiveBottomNav,
      pauseInactiveScreenAudio,
      renderActiveScreen,
      syncBattleLoopForScreen,
      setupNavigation,
      navigateTo
    };
  }

  window.AppNavigationRuntimeLib = {
    create: createAppNavigationRuntime
  };
})();
