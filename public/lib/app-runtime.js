(function () {
  function createAppRuntimeModule(deps) {
    const {
      getProjects,
      setProjects,
      getCurrentProjectId,
      getCurrentPlayerId,
      setCurrentProjectId,
      getCurrentMode,
      setCurrentMode,
      applyAppMode,
      getCurrentScreen,
      setCurrentScreen,
      getFormationScreen,
      getGachaScreen,
      getStoryScreen,
      getEventScreen,
      getCollectionScreen,
      apiUrl,
      API,
      fetchJSON,
      postJSON,
      mergeCollectionState,
      loadProjectRegistry,
      saveProjectRegistry,
      normalizeProjectRecord,
      makeProjectRecord,
      getCurrentProject,
      resetEditState,
      syncProjectQuery,
      loadAllData,
      resetEditorForms,
      renderAll,
      renderHome,
      renderBattleScreen,
      renderGachaScreen,
      renderStoryScreen,
      renderEventScreen,
      renderCollectionScreen,
      renderFormationScreen,
      startBattleLoop,
      stopBattleLoop,
      closeHomeEditMode,
      showToast,
      esc
    } = deps;

    const projectRuntimeApi = window.AppProjectRuntimeLib?.create?.({
      apiUrl,
      API,
      getCurrentPlayerId,
      getProjects,
      setProjects,
      getCurrentProjectId,
      getCurrentProject,
      makeProjectRecord,
      normalizeProjectRecord,
      postJSON,
      saveProjectRegistry,
      resetEditState,
      syncProjectQuery,
      renderProjectControls: () => renderProjectControlsImpl(),
      loadAllData,
      resetEditorForms,
      renderAll,
      esc
    });

    const navigationRuntimeApi = window.AppNavigationRuntimeLib?.create?.({
      getCurrentProjectId,
      getCurrentMode,
      setCurrentMode,
      applyAppMode,
      getCurrentScreen,
      setCurrentScreen,
      getFormationScreen,
      getGachaScreen,
      getStoryScreen,
      getEventScreen,
      getCollectionScreen,
      renderHome,
      renderBattleScreen,
      renderGachaScreen,
      renderStoryScreen,
      renderEventScreen,
      renderCollectionScreen,
      renderFormationScreen,
      startBattleLoop,
      stopBattleLoop,
      closeHomeEditMode,
      showToast
    });

    function buildProjectsApiUrl() {
      return projectRuntimeApi?.buildProjectsApiUrl?.() || apiUrl(API.projects, {
        includeProject: false,
        query: { user: getCurrentPlayerId?.() }
      });
    }

    function persistProjectSelection() {
      return projectRuntimeApi?.persistProjectSelection?.();
    }

    async function reloadProjectRuntime() {
      return projectRuntimeApi?.reloadProjectRuntime?.();
    }

    function bindProjectControls() {
      return projectRuntimeApi?.bindProjectControls?.({ switchProject, handleCreateProject });
    }

    function upsertProjectInState(projectId, nextProject) {
      return projectRuntimeApi?.upsertProjectInState?.(projectId, nextProject);
    }

    async function syncProjectRecordToRemote(project) {
      return projectRuntimeApi?.syncProjectRecordToRemote?.(project);
    }

    function setupProjectControls() {
      return projectRuntimeApi?.setupProjectControls?.({ bindProjectControls });
    }

    function renderProjectControlsImpl() {
      return projectRuntimeApi?.renderProjectControlsImpl?.();
    }

    function selectInitialProjectId(localCurrentProjectId) {
      const projects = getProjects();
      const candidates = [getCurrentProjectId(), localCurrentProjectId, projects[0]?.id];
      const next = candidates.find(projectId => projectId && projects.some(project => project.id === projectId));
      return next || null;
    }

    async function initializeProjects() {
      const localProjects = loadProjectRegistry("socia-projects", []);
      const localCurrentProjectId = loadProjectRegistry("socia-current-project-id", null);
      const remoteProjects = await fetchJSON(buildProjectsApiUrl())
        .then(data => data.projects || [])
        .catch(() => null);

      let projects = mergeCollectionState(remoteProjects, localProjects).map(normalizeProjectRecord);

      if (projects.length === 0) {
        projects = await projectRuntimeApi?.ensureDefaultProject?.({
          showCreateError: error => {
            console.error("Failed to create default project:", error);
          }
        }) || [];
      }

      setProjects(projects);
      setCurrentProjectId(selectInitialProjectId(localCurrentProjectId));
      persistProjectSelection();
      syncProjectQuery();
      renderProjectControlsImpl();
    }

    async function handleCreateProject() {
      const input = prompt("プロジェクト名");
      const name = String(input || "").trim();
      if (!name) return;

      const project = projectRuntimeApi?.createProjectLocally?.(name);
      if (!project) return;

      try {
        const savedProject = await syncProjectRecordToRemote(project);
        upsertProjectInState(project.id, savedProject);
        setCurrentProjectId(savedProject.id);
      } catch (error) {
        console.error("Failed to create project:", error);
        setCurrentProjectId(project.id);
        showToast("プロジェクトはローカルにのみ作成されました");
      }

      persistProjectSelection();
      await reloadProjectRuntime();
      showToast("プロジェクトを作成しました");
    }

    async function renameProject(projectId, nextName) {
      const id = String(projectId || "").trim();
      const name = String(nextName || "").trim().slice(0, 80);
      if (!id || !name) return null;

      const renamedProject = projectRuntimeApi?.renameProjectLocally?.(id, name);
      if (!renamedProject) return null;

      try {
        const savedProject = await syncProjectRecordToRemote(renamedProject);
        upsertProjectInState(id, savedProject);
      } catch (error) {
        console.error("Failed to rename project:", error);
        showToast("プロジェクト名はローカルにのみ保存されました");
      }

      saveProjectRegistry("socia-projects", getProjects());
      renderProjectControlsImpl();
      renderAll();
      showToast("プロジェクト名を更新しました");
      return getProjects().find(project => project.id === id) || renamedProject;
    }

    async function switchProject(projectId) {
      setCurrentProjectId(projectId);
      persistProjectSelection();
      await reloadProjectRuntime();
      showToast("プロジェクトを切り替えました");
    }

    function bindGoButton(button, triggerNav) {
      return navigationRuntimeApi?.bindGoButton?.(button, triggerNav);
    }

    function setActiveScreenElement(screen) {
      return navigationRuntimeApi?.setActiveScreenElement?.(screen);
    }

    function setActiveBottomNav(screen) {
      return navigationRuntimeApi?.setActiveBottomNav?.(screen);
    }

    function pauseInactiveScreenAudio(screen) {
      return navigationRuntimeApi?.pauseInactiveScreenAudio?.(screen);
    }

    function renderActiveScreen(screen, previousScreen) {
      return navigationRuntimeApi?.renderActiveScreen?.(screen, previousScreen);
    }

    function syncBattleLoopForScreen(screen) {
      return navigationRuntimeApi?.syncBattleLoopForScreen?.(screen);
    }

    function setupNavigation() {
      return navigationRuntimeApi?.setupNavigation?.();
    }

    function navigateTo(screen) {
      return navigationRuntimeApi?.navigateTo?.(screen);
    }

    function applyOrientation(systemConfig) {
      const mode = ["portrait", "landscape"].includes(systemConfig?.orientation)
        ? systemConfig.orientation
        : "portrait";
      document.body.classList.remove("landscape-mode", "fullscreen-mode", "portrait-mode");
      if (mode === "landscape") {
        document.body.classList.add("landscape-mode");
      } else if (mode === "portrait") {
        document.body.classList.add("portrait-mode");
      }
    }

    return {
      setupProjectControls,
      configurePrimaryNavigation,
      ensureBattleEntryButton,
      initializeProjects,
      renderProjectControls: renderProjectControlsImpl,
      selectInitialProjectId,
      getCurrentProject,
      handleCreateProject,
      renameProject,
      switchProject,
      setupNavigation,
      navigateTo,
      applyOrientation
    };
  }

  function configurePrimaryNavigation({ openEditorScreen, navigateTo }) {
    const bottomNav = document.querySelector(".bottom-nav");
    const homeEditButton = document.getElementById("home-edit-mode-btn");
    const homeMenuWrap = document.querySelector(".home-side-right");
    const homeButton = document.querySelector('.bottom-nav-btn[data-go="home"]');
    const formationButton = document.querySelector('.bottom-nav-btn[data-go="formation"]');
    const storyButton = document.querySelector('.bottom-nav-btn[data-go="story"]');
    const gachaButton = document.querySelector('.bottom-nav-btn[data-go="gacha"]');
    const collectionButton = document.querySelector('.bottom-nav-btn[data-go="collection"]');

    if (homeEditButton) {
      homeEditButton.removeAttribute("data-go");
      homeEditButton.setAttribute("type", "button");
      homeEditButton.onclick = event => {
        event?.preventDefault?.();
        openEditorScreen?.();
      };
    }

    if (homeMenuWrap) {
      homeMenuWrap.innerHTML = `
        <button type="button" class="home-menu-btn home-menu-quest" data-go="battle">
          <span class="home-menu-text">⚔️戦闘</span>
        </button>
      `;
      homeMenuWrap.querySelector(".home-menu-quest")?.addEventListener("click", event => {
        event.preventDefault();
        navigateTo("battle");
      });
    }

    if (formationButton) {
      const cleanFormationButton = formationButton.cloneNode(false);
      Array.from(formationButton.attributes).forEach(attribute => {
        cleanFormationButton.setAttribute(attribute.name, attribute.value);
      });
      cleanFormationButton.innerHTML = `
        <span class="bottom-nav-icon">&#x1F464;</span>
        <span class="bottom-nav-label">キャラ・編成</span>
      `;
      formationButton.replaceWith(cleanFormationButton);
    }

    if (bottomNav) {
      const nextFormationButton = document.querySelector('.bottom-nav-btn[data-go="formation"]');
      [homeButton, formationButton, storyButton, gachaButton, collectionButton].filter(Boolean).forEach(button => {
        bottomNav.appendChild(button === formationButton ? nextFormationButton : button);
      });
    }
  }

  function ensureBattleEntryButton(navigateTo) {
    const battleButton = document.querySelector(".home-side-right .home-menu-quest");
    const battleLabel = battleButton?.querySelector(".home-menu-text");
    if (!battleButton) return;
    battleButton.setAttribute("data-go", "battle");
    battleButton.onclick = () => navigateTo("battle");
    if (battleLabel) battleLabel.textContent = "⚔️戦闘";
  }

  function getCurrentProject(projects, currentProjectId) {
    return projects.find(project => project.id === currentProjectId) || null;
  }

  function normalizeProjectRecord(project) {
    return {
      id: String(project?.id || crypto.randomUUID()).trim(),
      name: String(project?.name || "無題のプロジェクト").trim().slice(0, 80) || "無題のプロジェクト",
      ownerUserId: String(project?.ownerUserId || project?.owner_user_id || "").trim(),
      memberRole: String(project?.memberRole || project?.member_role || "").trim(),
      createdAt: String(project?.createdAt || new Date().toISOString()),
      updatedAt: String(project?.updatedAt || project?.createdAt || new Date().toISOString())
    };
  }

  function makeProjectRecord(name) {
    const now = new Date().toISOString();
    return normalizeProjectRecord({
      id: crypto.randomUUID(),
      name,
      createdAt: now,
      updatedAt: now
    });
  }

  function resetEditState(editState) {
    if (!editState) return;
    editState.baseCharId = null;
    editState.characterId = null;
    editState.announcementId = null;
    editState.storyId = null;
    editState.gachaId = null;
  }

  function syncProjectQuery(currentProjectId) {
    const url = new URL(location.href);
    if (currentProjectId) url.searchParams.set("project", currentProjectId);
    else url.searchParams.delete("project");
    history.replaceState(null, "", url.toString());
  }

  window.AppRuntimeLib = {
    create: createAppRuntimeModule,
    getCurrentProject,
    normalizeProjectRecord,
    makeProjectRecord,
    resetEditState,
    syncProjectQuery
  };
})();
