(function () {
  function createEditorV1Host(deps) {
    const {
      api,
      legacyApi,
      esc,
      getCurrentProjectId,
      getCurrentProjectName,
      getCurrentPlayerId,
      getBaseChars,
      getCharacters,
      getStories,
      getGachas,
      getShareManagementSummary,
      rotateCollaborativeShare,
      createPublicShare
    } = deps;

    function shell() {
      return document.querySelector(".editor-overlay-shell");
    }

    function getProjectName() {
      return String(getCurrentProjectName?.() || "無題のプロジェクト").trim() || "無題のプロジェクト";
    }

    function getProjectId() {
      return String(getCurrentProjectId?.() || "").trim();
    }

    function getPlayerId() {
      return String(getCurrentPlayerId?.() || "").trim() || "local-player";
    }

    function getSummaryCards() {
      return [
        { label: "ベースキャラ", value: Array.isArray(getBaseChars?.()) ? getBaseChars().length : 0 },
        { label: "カード", value: Array.isArray(getCharacters?.()) ? getCharacters().length : 0 },
        { label: "ストーリー", value: Array.isArray(getStories?.()) ? getStories().length : 0 },
        { label: "ガチャ", value: Array.isArray(getGachas?.()) ? getGachas().length : 0 }
      ];
    }

    function removeLegacyChrome() {
      const overlay = document.getElementById("screen-editor");
      if (!overlay) return;
      overlay.querySelector(".screen-header")?.remove();
      overlay.querySelector(".editor-tabs")?.remove();
      overlay.classList.add("editor-window-mode");
    }

    function updateLauncherActiveState(activeKey) {
      document.querySelectorAll("#editor-window-launcher .editor-window-launcher-btn").forEach(button => {
        button.classList.toggle("active", button.dataset.editorAction === activeKey);
      });
    }

    // V1 talks to the legacy editor through a fixed snapshot so later cleanup in
    // editor-screen.js does not need to preserve mutable method references.
    const legacyHost = window.EditorLegacyHost?.create?.({
      api,
      legacyApi,
      onAfterRender: () => {
        removeLegacyChrome();
        dashboardScreen.render();
        closeAuxWindows();
      },
      onAfterEnsure: () => {
        removeLegacyChrome();
        dashboardScreen.render();
      },
      onAfterClose: () => {
        closeAuxWindows();
        updateLauncherActiveState("");
      },
      onAfterActivate: tabName => {
        closeAuxWindows();
        updateLauncherActiveState(tabName || "base-char");
      }
    }) || {
      render() {},
      ensure() {},
      closeAll() {},
      activate() {}
    };

    const shareScreen = window.EditorShareScreen?.create?.({
      getShell: shell,
      esc,
      getCurrentProjectId: getProjectId,
      getCurrentProjectName: getProjectName,
      getShareManagementSummary,
      rotateCollaborativeShare,
      createPublicShare,
      onClose: () => updateLauncherActiveState("")
    }) || { open() {}, close() {} };

    const memberScreen = window.EditorMemberScreen?.create?.({
      getShell: shell,
      esc,
      getCurrentProjectId: getProjectId,
      getCurrentProjectName: getProjectName,
      getCurrentPlayerId: getPlayerId,
      onClose: () => updateLauncherActiveState("")
    }) || { open() {}, close() {} };

    function closeAuxWindows() {
      shareScreen.close();
      memberScreen.close();
    }

    function openShareWindow() {
      closeAuxWindows();
      shareScreen.open();
      updateLauncherActiveState("publish-share");
    }

    function openMemberWindow() {
      closeAuxWindows();
      memberScreen.open();
      updateLauncherActiveState("members");
    }

    const sectionRegistry = window.EditorSectionHostRegistry?.create?.({
      closeAuxWindows: () => closeAuxWindows(),
      activateLegacyTab: key => legacyHost.activate(key),
      setLauncherActive: key => updateLauncherActiveState(key),
      systemEditor: deps.systemEditor
    }) || {};

    const projectSections = window.EditorProjectSections?.create?.({
      activateLegacyTab: key => legacyHost.activate(key),
      closeAuxWindows: () => closeAuxWindows(),
      setLauncherActive: key => updateLauncherActiveState(key),
      ...sectionRegistry
    }) || {
      open: key => {
        closeAuxWindows();
        legacyHost.activate(key);
        updateLauncherActiveState(key || "");
      }
    };

    const dashboardScreen = window.EditorDashboardScreen?.create?.({
      getLauncher: () => document.getElementById("editor-window-launcher"),
      esc,
      getProjectName,
      getProjectId,
      getSummaryCards,
      onOpenSection: key => projectSections.open(key),
      onOpenShare: () => {
        closeAuxWindows();
        legacyHost.closeAll();
        openShareWindow();
      },
      onOpenMembers: () => {
        closeAuxWindows();
        legacyHost.closeAll();
        openMemberWindow();
      },
      onCloseEditor: () => {
        window.closeEditorScreen?.();
      }
    }) || { render() {} };

    function render() {
      legacyHost.render();
    }

    function ensure() {
      legacyHost.ensure();
    }

    function closeAll() {
      legacyHost.closeAll();
    }

    function activate(tabName) {
      legacyHost.activate(tabName);
    }

    function openShareManagement() {
      closeAuxWindows();
      legacyHost.closeAll();
      openShareWindow();
    }

    function openMemberManagement() {
      closeAuxWindows();
      legacyHost.closeAll();
      openMemberWindow();
    }

    return {
      render,
      ensure,
      closeAll,
      activate,
      openShareManagement,
      openMemberManagement
    };
  }

  window.EditorV1Host = {
    create: createEditorV1Host
  };
})();
