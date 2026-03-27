(function () {
  function createEditorProjectSections(deps) {
    const {
      activateLegacyTab,
      closeAuxWindows,
      setLauncherActive,
      baseCharSection,
      characterSection,
      storySection,
      gachaSection,
      systemSection
    } = deps;

    function open(sectionKey) {
      closeAuxWindows?.();
      activateLegacyTab?.(sectionKey);
      setLauncherActive?.(sectionKey || "");
    }

    return {
      openBaseChar: () => baseCharSection?.open?.() || open("base-char"),
      openCharacter: () => characterSection?.open?.() || open("character"),
      openStory: () => storySection?.open?.() || open("story"),
      openGacha: () => gachaSection?.open?.() || open("gacha"),
      openSystem: () => systemSection?.open?.() || open("system"),
      open
    };
  }

  window.EditorProjectSections = {
    create: createEditorProjectSections
  };
})();
