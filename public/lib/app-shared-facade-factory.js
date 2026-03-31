(() => {
  function create(deps = {}) {
    return {
      renderHome(reason = "refresh") {
        return deps.renderHome(reason);
      },
      formatCurrencyBalance(currency, includeMax = false) {
        return deps.formatCurrencyBalance(currency, includeMax);
      },
      renderBattleScreen() {
        return deps.renderBattleScreen();
      },
      getBattleParty() {
        return deps.getBattleParty();
      },
      startBattleLoop() {
        return deps.startBattleLoop();
      },
      stopBattleLoop() {
        return deps.stopBattleLoop();
      },
      ensureHomeCurrencyTimer() {
        return deps.ensureHomeCurrencyTimer();
      },
      async generateCharacterCropAssets(imageSrc, cropPresets = null) {
        return deps.generateCharacterCropAssets(imageSrc, cropPresets);
      },
      async generateCharacterCropImages(imageSrc, cropPresets = null) {
        return deps.generateCharacterCropImages(imageSrc, cropPresets);
      },
      async detectPrimaryFaceBox(image) {
        return deps.detectPrimaryFaceBox(image);
      },
      async renderCropDataUrl(image, rect, outputWidth, outputHeight) {
        return deps.renderCropDataUrl(image, rect, outputWidth, outputHeight);
      },
      clamp(value, min, max) {
        return deps.clamp(value, min, max);
      },
      esc(str) {
        return deps.esc(str);
      },
      showToast(message) {
        return deps.showToast(message);
      }
    };
  }

  window.AppSharedFacadeFactoryLib = {
    create
  };
})();
