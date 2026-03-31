(function () {
  function createHomeBgmRuntime(deps) {
    const {
      getSystemConfig,
      getPlayerState,
      getCurrentScreen
    } = deps;

    function getHomeBgmVolume() {
      const volume = Number(getPlayerState?.()?.audioSettings?.bgmVolume);
      if (Number.isFinite(volume)) {
        return Math.min(100, Math.max(0, volume)) / 100;
      }
      return 1;
    }

    function applyHomeBgm() {
      const audio = document.getElementById("home-bgm");
      if (!audio) return;
      const currentScreen = String(getCurrentScreen?.() || "").trim();
      const systemConfig = getSystemConfig?.() || {};
      const musicAssets = Array.isArray(systemConfig.musicAssets) ? systemConfig.musicAssets : [];
      const selectedId = String(systemConfig.homeBgmAssetId || "").trim();
      const selected = musicAssets.find(item => String(item?.id || "").trim() === selectedId) || null;
      const nextSrc = String(selected?.src || "").trim();
      if (currentScreen !== "home" && currentScreen !== "editor") {
        audio.pause();
        return;
      }
      audio.volume = getHomeBgmVolume();
      if (!nextSrc) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load?.();
        return;
      }
      if (audio.dataset.currentSrc !== nextSrc) {
        audio.src = nextSrc;
        audio.dataset.currentSrc = nextSrc;
        audio.load?.();
      }
      audio.play().catch(() => {});
    }

    return {
      getHomeBgmVolume,
      applyHomeBgm
    };
  }

  window.HomeBgmRuntime = {
    create: createHomeBgmRuntime
  };
})();
