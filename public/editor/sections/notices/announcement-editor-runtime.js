(function () {
  function createAnnouncementEditorRuntime(deps) {
    const {
      getAnnouncements,
      setAnnouncements,
      getEditState,
      getAnnouncementsApiUrl,
      readFileAsDataUrl,
      uploadStaticImageAsset,
      saveLocal,
      postJSON,
      showToast,
      upsertItem,
      renderHome,
      esc
    } = deps;

    function setup() {
      return window.AnnouncementEditor?.setupAnnouncementEditor?.({
        getAnnouncements,
        setAnnouncements,
        getEditState,
        getApi: () => ({ announcements: getAnnouncementsApiUrl() }),
        readFileAsDataUrl,
        uploadStaticImageAsset,
        saveLocal,
        postJSON,
        showToast,
        upsertItem,
        renderHome,
        esc
      }) || null;
    }

    return {
      setup
    };
  }

  window.SociaAnnouncementEditorRuntime = {
    create: createAnnouncementEditorRuntime
  };
})();
