(function () {
  function setupAnnouncementEditor(deps) {
    return window.SociaAnnouncementEditorApp?.setupAnnouncementEditor?.(deps) || null;
  }

  function createAnnouncementEditor(deps) {
    return window.SociaAnnouncementEditorApp?.createAnnouncementEditor?.(deps) || null;
  }

  window.AnnouncementEditor = {
    setupAnnouncementEditor,
    createAnnouncementEditor
  };
})();
