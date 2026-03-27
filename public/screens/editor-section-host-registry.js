(function () {
  function createEditorSectionHostRegistry(deps) {
    const {
      closeAuxWindows,
      activateLegacyTab,
      setLauncherActive,
      systemEditor
    } = deps;

    function openLegacySection(key) {
      closeAuxWindows?.();
      activateLegacyTab?.(key);
      setLauncherActive?.(key || "");
    }

    return {
      baseCharSection: window.EditorBaseCharHost?.create?.({
        openSection: openLegacySection
      }),
      characterSection: window.EditorCharacterHost?.create?.({
        openSection: openLegacySection
      }),
      storySection: window.EditorStoryHost?.create?.({
        openSection: openLegacySection
      }),
      gachaSection: window.EditorGachaHost?.create?.({
        openSection: openLegacySection
      }),
      systemSection: window.EditorSystemHost?.create?.({
        openSection: openLegacySection,
        renderSystemForm: () => systemEditor?.renderSystemForm?.()
      }),
      openLegacySection
    };
  }

  window.EditorSectionHostRegistry = {
    create: createEditorSectionHostRegistry
  };
})();
