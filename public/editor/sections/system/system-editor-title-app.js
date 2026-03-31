(function () {
  function createSystemEditorTitleController(deps) {
    const {
      getSystemConfig,
      readFileAsDataUrl
    } = deps;

    function ensureTitleScreenControls() {
      const form = document.getElementById("system-form");
      if (!form || form.dataset.titleScreenBound === "1") return;

      document.getElementById("system-title-screen-background-file")?.addEventListener("change", handleTitleScreenBackgroundChange);
      document.getElementById("system-title-screen-logo-file")?.addEventListener("change", handleTitleScreenLogoChange);
      document.getElementById("system-title-screen-background-clear")?.addEventListener("click", clearTitleScreenBackground);
      document.getElementById("system-title-screen-logo-clear")?.addEventListener("click", clearTitleScreenLogo);
      document.getElementById("system-title-screen-press-start-text")?.addEventListener("input", renderTitleScreenPreview);
      document.getElementById("system-title-screen-enabled")?.addEventListener("change", renderTitleScreenPreview);

      form.dataset.titleScreenBound = "1";
    }

    async function handleTitleScreenBackgroundChange(event) {
      const file = event.target.files?.[0];
      const preview = document.getElementById("system-title-screen-background-preview");
      if (!preview) return;
      if (!file) {
        renderTitleScreenPreview();
        return;
      }
      preview.src = await readFileAsDataUrl(file);
      preview.hidden = false;
      preview.dataset.cleared = "0";
      renderTitleScreenPreview();
    }

    async function handleTitleScreenLogoChange(event) {
      const file = event.target.files?.[0];
      const preview = document.getElementById("system-title-screen-logo-preview");
      if (!preview) return;
      if (!file) {
        renderTitleScreenPreview();
        return;
      }
      preview.src = await readFileAsDataUrl(file);
      preview.hidden = false;
      preview.dataset.cleared = "0";
      renderTitleScreenPreview();
    }

    function clearTitleScreenBackground() {
      const input = document.getElementById("system-title-screen-background-file");
      const preview = document.getElementById("system-title-screen-background-preview");
      if (input) input.value = "";
      if (preview) {
        preview.hidden = true;
        preview.removeAttribute("src");
        preview.dataset.cleared = "1";
      }
      renderTitleScreenPreview();
    }

    function clearTitleScreenLogo() {
      const input = document.getElementById("system-title-screen-logo-file");
      const preview = document.getElementById("system-title-screen-logo-preview");
      if (input) input.value = "";
      if (preview) {
        preview.hidden = true;
        preview.removeAttribute("src");
        preview.dataset.cleared = "1";
      }
      renderTitleScreenPreview();
    }

    function syncTitleScreenForm(config = getSystemConfig()) {
      const form = document.getElementById("system-form");
      if (!form) return;

      if (form.titleScreenEnabled) form.titleScreenEnabled.checked = config.titleScreen?.enabled === true;
      if (form.titleScreenPressStartText) form.titleScreenPressStartText.value = config.titleScreen?.pressStartText || "Press Start";

      const titleBackgroundPreview = document.getElementById("system-title-screen-background-preview");
      if (titleBackgroundPreview) {
        if (config.titleScreen?.backgroundImage) {
          titleBackgroundPreview.src = config.titleScreen.backgroundImage;
          titleBackgroundPreview.hidden = false;
        } else {
          titleBackgroundPreview.hidden = true;
          titleBackgroundPreview.removeAttribute("src");
        }
        titleBackgroundPreview.dataset.cleared = "0";
      }

      const titleLogoPreview = document.getElementById("system-title-screen-logo-preview");
      if (titleLogoPreview) {
        if (config.titleScreen?.logoImage) {
          titleLogoPreview.src = config.titleScreen.logoImage;
          titleLogoPreview.hidden = false;
        } else {
          titleLogoPreview.hidden = true;
          titleLogoPreview.removeAttribute("src");
        }
        titleLogoPreview.dataset.cleared = "0";
      }

      if (form.titleScreenBackgroundFile) form.titleScreenBackgroundFile.value = "";
      if (form.titleScreenLogoFile) form.titleScreenLogoFile.value = "";
    }

    function renderTitleScreenPreview() {
      const form = document.getElementById("system-form");
      const config = getSystemConfig();
      const backgroundPreview = document.getElementById("system-title-screen-background-preview");
      const logoPreview = document.getElementById("system-title-screen-logo-preview");
      const previewBg = document.getElementById("system-title-screen-preview-bg");
      const previewLogo = document.getElementById("system-title-screen-preview-logo");
      const previewAppName = document.getElementById("system-title-screen-preview-app-name");
      const previewStart = document.getElementById("system-title-screen-preview-start");
      const backgroundImage = backgroundPreview?.hidden ? "" : (backgroundPreview?.getAttribute("src") || config.titleScreen?.backgroundImage || "");
      const logoImage = logoPreview?.hidden ? "" : (logoPreview?.getAttribute("src") || config.titleScreen?.logoImage || "");
      const pressStartText = String(form?.titleScreenPressStartText?.value || "").trim() || "Press Start";

      if (previewBg) {
        previewBg.style.backgroundImage = backgroundImage
          ? `linear-gradient(180deg, rgba(3, 4, 10, 0.12), rgba(3, 4, 10, 0.36)), url("${backgroundImage.replace(/"/g, "%22")}")`
          : "";
      }
      if (previewLogo) {
        if (logoImage) {
          previewLogo.src = logoImage;
          previewLogo.hidden = false;
        } else {
          previewLogo.hidden = true;
          previewLogo.removeAttribute("src");
        }
      }
      if (previewAppName) {
        previewAppName.hidden = Boolean(logoImage);
      }
      if (previewStart) {
        previewStart.textContent = pressStartText;
      }
    }

    async function collectTitleScreenConfig(form, currentTitleConfig = getSystemConfig().titleScreen || {}) {
      const titleBackgroundPreview = document.getElementById("system-title-screen-background-preview");
      const titleLogoPreview = document.getElementById("system-title-screen-logo-preview");
      const titleBackgroundImage = titleBackgroundPreview?.dataset.cleared === "1"
        ? ""
        : (form.titleScreenBackgroundFile?.files?.[0]
          ? await readFileAsDataUrl(form.titleScreenBackgroundFile.files[0])
          : (titleBackgroundPreview?.getAttribute("src") || currentTitleConfig.backgroundImage || ""));
      const titleLogoImage = titleLogoPreview?.dataset.cleared === "1"
        ? ""
        : (form.titleScreenLogoFile?.files?.[0]
          ? await readFileAsDataUrl(form.titleScreenLogoFile.files[0])
          : (titleLogoPreview?.getAttribute("src") || currentTitleConfig.logoImage || ""));

      return {
        version: 1,
        enabled: form.titleScreenEnabled?.checked === true,
        backgroundImage: titleBackgroundImage,
        logoImage: titleLogoImage,
        pressStartText: String(form.titleScreenPressStartText?.value || "").trim() || "Press Start",
        tapToStartEnabled: true
      };
    }

    return {
      ensureTitleScreenControls,
      syncTitleScreenForm,
      renderTitleScreenPreview,
      collectTitleScreenConfig
    };
  }

  window.SociaSystemEditorTitleApp = {
    create: createSystemEditorTitleController
  };
})();
