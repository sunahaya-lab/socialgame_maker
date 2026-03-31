(function () {
  function createTitleScreenController(deps) {
    const {
      getSystemConfig,
      getProjectName,
      navigateToHome
    } = deps;

    function getTitleScreenConfig() {
      const config = getSystemConfig?.();
      return {
        version: Math.max(1, Number(config?.titleScreen?.version || 0) || 1),
        enabled: config?.titleScreen?.enabled === true,
        backgroundImage: String(config?.titleScreen?.backgroundImage || "").trim(),
        logoImage: String(config?.titleScreen?.logoImage || "").trim(),
        pressStartText: String(config?.titleScreen?.pressStartText || "").trim() || "Press Start",
        tapToStartEnabled: config?.titleScreen?.tapToStartEnabled !== false
      };
    }

    function isEnabled() {
      return getTitleScreenConfig().enabled;
    }

    function getInitialScreen() {
      return isEnabled() ? "title" : "home";
    }

    function resolveProjectName() {
      const projectSelectName = String(document.getElementById("project-select")?.selectedOptions?.[0]?.textContent || "").trim();
      const homeProjectName = String(document.getElementById("home-player-name")?.textContent || "").trim();
      const currentTitleName = String(document.getElementById("title-screen-app-name")?.textContent || "").trim();
      return String(
        getProjectName?.() ||
        projectSelectName ||
        homeProjectName ||
        currentTitleName ||
        "Socia Maker"
      ).trim() || "Socia Maker";
    }

    function render() {
      const titleConfig = getTitleScreenConfig?.() || {};
      const backgroundEl = document.getElementById("title-screen-bg");
      const logoEl = document.getElementById("title-screen-logo");
      const appNameEl = document.getElementById("title-screen-app-name");
      const startEl = document.getElementById("title-screen-start");
      const projectName = resolveProjectName();
      const backgroundUrl = String(titleConfig.backgroundImage || "").replace(/"/g, "%22");

      if (backgroundEl) {
        backgroundEl.style.backgroundImage = titleConfig.backgroundImage
          ? `linear-gradient(180deg, rgba(3, 4, 10, 0.12), rgba(3, 4, 10, 0.36)), url("${backgroundUrl}")`
          : "";
      }
      if (logoEl) {
        if (titleConfig.logoImage) {
          logoEl.src = titleConfig.logoImage;
          logoEl.hidden = false;
        } else {
          logoEl.hidden = true;
          logoEl.removeAttribute("src");
        }
      }
      if (appNameEl) {
        appNameEl.textContent = projectName;
        appNameEl.hidden = Boolean(titleConfig.logoImage);
      }
      if (startEl) {
        startEl.textContent = String(titleConfig.pressStartText || "").trim() || "Press Start";
      }
    }

    function bind() {
      const titleScreen = document.getElementById("screen-title");
      const titleHitArea = document.getElementById("title-screen-hitarea");
      const titleOverlay = document.getElementById("title-screen-overlay");
      const titleStart = document.getElementById("title-screen-start");
      if (!titleScreen || titleScreen.dataset.boundTitleStart === "1") return;

      const start = event => {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        if (!titleScreen.classList.contains("active")) return;
        navigateToHome?.();
      };

      [titleHitArea, titleOverlay, titleStart].forEach(element => {
        element?.addEventListener("click", start);
        element?.addEventListener("pointerup", start);
        element?.addEventListener("touchend", start, { passive: false });
      });
      titleScreen.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") start(event);
      });
      titleStart?.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") start(event);
      });
      titleScreen.tabIndex = 0;
      titleScreen.dataset.boundTitleStart = "1";
    }

    function setup() {
      render();
      bind();
    }

    return {
      isEnabled,
      getInitialScreen,
      setup,
      render,
      bind
    };
  }

  window.TitleScreenLib = {
    create: createTitleScreenController
  };
})();
