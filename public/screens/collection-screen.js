(function () {
  function setupCollectionScreen(deps) {
    const api = createCollectionScreen(deps);

    const wrap = document.getElementById("collection-filters");
    if (wrap) {
      wrap.addEventListener("click", e => {
        const btn = e.target.closest(".collection-filter");
        if (!btn) return;
        document.querySelectorAll(".collection-filter").forEach(item => item.classList.remove("active"));
        btn.classList.add("active");
        api.renderCollectionScreen(btn.dataset.rarity);
      });
    }

    const closeBtn = document.getElementById("card-detail-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        document.getElementById("card-detail").hidden = true;
      });
    }

    const detail = document.getElementById("card-detail");
    if (detail) {
      detail.addEventListener("click", e => {
        if (e.target === detail) {
          detail.hidden = true;
        }
      });
    }

    return api;
  }

  function createCollectionScreen(deps) {
    const attributeLib = window.AttributeLib;
    const {
      getCharacters,
      getStories,
      getSystemConfig,
      getPlayerState,
      getOwnedCount,
      getCharacterImageForUsage,
      baseCharVoiceLineDefs,
      getBaseCharById,
      getEffectiveVoiceLines,
      openStoryReader,
      getRarityModeConfig,
      normalizeRarityValue,
      getRarityLabel,
      getRarityCssClass,
      makeFallbackImage,
      esc
    } = deps;
    const detailApi = window.CollectionDetailRuntime?.create?.({
      getStories,
      getSystemConfig,
      getPlayerState,
      getOwnedCount,
      baseCharVoiceLineDefs,
      getBaseCharById,
      getEffectiveVoiceLines,
      openStoryReader,
      getRarityLabel,
      makeFallbackImage,
      esc,
      attributeLib
    }) || null;
    const gridApi = window.CollectionGridRuntime?.create?.({
      getCharacters,
      getSystemConfig,
      getOwnedCount,
      getCharacterImageForUsage,
      getRarityModeConfig,
      normalizeRarityValue,
      getRarityLabel,
      getRarityCssClass,
      makeFallbackImage,
      esc,
      showCardDetail: char => showCardDetail(char)
    }) || null;
    function renderCollectionFilters(active) {
      return gridApi?.renderCollectionFilters?.(active);
    }

    function renderCollectionScreen(filterRarity) {
      return gridApi?.renderCollectionScreen?.(filterRarity);
    }

    function showCardDetail(char) {
      return detailApi?.showCardDetail?.(char);
    }

    return {
      renderCollectionFilters,
      renderCollectionScreen,
      showCardDetail
    };
  }

  window.CollectionScreen = {
    setupCollectionScreen,
    createCollectionScreen
  };
})();
