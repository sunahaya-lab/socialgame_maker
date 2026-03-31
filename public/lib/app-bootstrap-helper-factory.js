(() => {
  function create(deps = {}) {
    return {
      normalizePartyFormation(formation) {
        return deps.playerStateNormalizePartyFormation(formation);
      },
      mergePlayerState(remoteState, localState) {
        return deps.playerStateMergePlayerState(remoteState, localState, deps.getDefaultPlayerState());
      },
      normalizePlayerCurrencies(currencies) {
        return deps.playerStateNormalizePlayerCurrencies(currencies, deps.getDefaultCurrencies());
      },
      getRecoveredCurrency(currency, nowMs = Date.now()) {
        return deps.playerStateGetRecoveredCurrency(currency, nowMs);
      },
      normalizeHomePreferences(config) {
        return deps.playerStateNormalizeHomePreferences(config, deps.getDefaultHomeConfig(), deps.clamp);
      },
      isBaseCharBirthdayToday(baseChar, now = new Date()) {
        const birthday = String(baseChar?.birthday || "").trim();
        const match = birthday.match(/^(\d{1,2})\/(\d{1,2})$/);
        if (!match) return false;
        return Number(match[1]) === (now.getMonth() + 1) && Number(match[2]) === now.getDate();
      },
      isHomeEventActive(now = new Date()) {
        const month = now.getMonth() + 1;
        return Array.isArray(deps.getStories()) && deps.getStories().some(story => {
          if (story?.type !== "event") return false;
          const text = `${story?.title || ""} ${story?.description || ""}`;
          if (/birthday|anniversary|event|limited/i.test(text)) return true;
          const monthMatch = text.match(/\b(1[0-2]|0?[1-9])譛・b/);
          return monthMatch ? Number(monthMatch[1]) === month : false;
        });
      },
      renderHome(reason = "refresh") {
        return deps.renderHome(reason);
      },
      formatCurrencyBalance(currency, includeMax = false) {
        return deps.playerStateFormatCurrencyBalance(currency, includeMax);
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

  window.AppBootstrapHelperFactoryLib = {
    create
  };
})();
