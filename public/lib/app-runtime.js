(function () {
  function createAppRuntimeModule(deps) {
    const {
      getProjects,
      setProjects,
      getCurrentProjectId,
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

    function setupProjectControls() {
      const nameEl = document.getElementById("home-player-name");
      if (!nameEl || document.getElementById("project-select")) return;
      const host = nameEl.parentElement;
      const controls = document.createElement("div");
      controls.className = "project-controls";
      controls.innerHTML = `
        <select id="project-select" aria-label="プロジェクトを選択"></select>
        <button type="button" class="project-create-btn" id="project-create-btn">+</button>
      `;
      host.appendChild(controls);

      document.getElementById("project-select")?.addEventListener("change", async event => {
        const nextProjectId = event.target.value;
        if (!nextProjectId || nextProjectId === getCurrentProjectId()) return;
        await switchProject(nextProjectId);
      });

      document.getElementById("project-create-btn")?.addEventListener("click", handleCreateProject);
    }

    async function initializeProjects() {
      const localProjects = loadProjectRegistry("socia-projects", []);
      const localCurrentProjectId = loadProjectRegistry("socia-current-project-id", null);
      const remoteProjects = await fetchJSON(apiUrl(API.projects, { includeProject: false }))
        .then(data => data.projects || [])
        .catch(() => null);

      let projects = mergeCollectionState(remoteProjects, localProjects).map(normalizeProjectRecord);

      if (projects.length === 0) {
        const defaultProject = makeProjectRecord("マイプロジェクト");
        projects = [defaultProject];
        saveProjectRegistry("socia-projects", projects);
        try {
          await postJSON(apiUrl(API.projects, { includeProject: false }), defaultProject);
        } catch (error) {
          console.error("Failed to create default project:", error);
        }
      }

      setProjects(projects);
      setCurrentProjectId(selectInitialProjectId(localCurrentProjectId));
      saveProjectRegistry("socia-projects", getProjects());
      saveProjectRegistry("socia-current-project-id", getCurrentProjectId());
      syncProjectQuery();
      renderProjectControlsImpl();
    }

    function renderProjectControlsImpl() {
      const nameEl = document.getElementById("home-player-name");
      const select = document.getElementById("project-select");
      if (nameEl) {
        nameEl.textContent = getCurrentProject()?.name || "プロジェクト";
      }
      if (!select) return;
      select.innerHTML = getProjects().map(project =>
        `<option value="${esc(project.id)}"${project.id === getCurrentProjectId() ? " selected" : ""}>${esc(project.name)}</option>`
      ).join("");
    }

    function selectInitialProjectId(localCurrentProjectId) {
      const projects = getProjects();
      const candidates = [getCurrentProjectId(), localCurrentProjectId, projects[0]?.id];
      const next = candidates.find(projectId => projectId && projects.some(project => project.id === projectId));
      return next || null;
    }

    async function handleCreateProject() {
      const input = prompt("\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u540d");
      const name = String(input || "").trim();
      if (!name) return;

      const project = makeProjectRecord(name);
      const projects = [...getProjects(), project];
      setProjects(projects);
      saveProjectRegistry("socia-projects", projects);

      try {
        const response = await postJSON(apiUrl(API.projects, { includeProject: false }), project);
        const savedProject = normalizeProjectRecord(response.project || project);
        setProjects(getProjects().map(item => item.id === project.id ? savedProject : item));
        setCurrentProjectId(savedProject.id);
      } catch (error) {
        console.error("Failed to create project:", error);
        setCurrentProjectId(project.id);
        showToast("\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u306f\u30ed\u30fc\u30ab\u30eb\u306b\u306e\u307f\u4f5c\u6210\u3055\u308c\u307e\u3057\u305f");
      }

      saveProjectRegistry("socia-projects", getProjects());
      saveProjectRegistry("socia-current-project-id", getCurrentProjectId());
      resetEditState();
      syncProjectQuery();
      renderProjectControlsImpl();
      await loadAllData();
      resetEditorForms();
      renderAll();
      showToast("\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u3092\u4f5c\u6210\u3057\u307e\u3057\u305f");
    }

    async function switchProject(projectId) {
      setCurrentProjectId(projectId);
      saveProjectRegistry("socia-current-project-id", getCurrentProjectId());
      resetEditState();
      syncProjectQuery();
      renderProjectControlsImpl();
      await loadAllData();
      resetEditorForms();
      renderAll();
      showToast("\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u3092\u5207\u308a\u66ff\u3048\u307e\u3057\u305f");
    }

    function setupNavigation() {
      let lastNavAt = 0;
      const triggerNav = (screen, event) => {
        const now = Date.now();
        if (now - lastNavAt < 200) return;
        lastNavAt = now;
        if (event) event.preventDefault();
        if (screen === "editor") {
          showToast("\u30a8\u30c7\u30a3\u30bf\u30fc\u306f\u518d\u8a2d\u8a08\u4e2d\u306e\u305f\u3081\u73fe\u5728\u306f\u7121\u52b9\u3067\u3059");
          return;
        }
        navigateTo(screen);
      };

      document.querySelectorAll("[data-go]").forEach(btn => {
        btn.addEventListener("click", event => {
          triggerNav(btn.dataset.go, event);
        });
        btn.addEventListener("pointerup", event => {
          triggerNav(btn.dataset.go, event);
        });
      });

      document.addEventListener("click", event => {
        const button = event.target.closest("[data-go]");
        if (!button) return;
        triggerNav(button.dataset.go, event);
      });

      document.addEventListener("pointerup", event => {
        const button = event.target.closest("[data-go]");
        if (!button) return;
        triggerNav(button.dataset.go, event);
      });
    }

    function navigateTo(screen) {
      if (screen === "editor") {
        showToast("\u30a8\u30c7\u30a3\u30bf\u30fc\u306f\u518d\u8a2d\u8a08\u4e2d\u306e\u305f\u3081\u73fe\u5728\u306f\u7121\u52b9\u3067\u3059");
        return;
      }
      if (screen !== "home") closeHomeEditMode();
      const previousScreen = getCurrentScreen();
      setCurrentScreen(screen);
      if (getCurrentMode() !== "play") {
        setCurrentMode("play");
        applyAppMode("play");
      }
      document.querySelectorAll(".screen").forEach(screenEl => screenEl.classList.remove("active"));
      const nextScreen = document.getElementById(`screen-${screen}`);
      if (!nextScreen) return;
      nextScreen.classList.add("active");

      document.querySelectorAll(".bottom-nav-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.go === screen);
      });

      try {
        if (screen === "home") renderHome(previousScreen === "home" ? "refresh" : "enter");
        if (screen === "formation" && getFormationScreen()) renderFormationScreen();
        if (screen === "battle") renderBattleScreen();
        if (screen === "gacha" && getGachaScreen()) renderGachaScreen();
        if (screen === "story" && getStoryScreen()) renderStoryScreen();
        if (screen === "event" && getEventScreen()) renderEventScreen();
        if (screen === "collection" && getCollectionScreen()) renderCollectionScreen();
      } catch (error) {
        console.error("navigateTo render error:", error);
      }

      if (screen === "battle") startBattleLoop();
      else stopBattleLoop();
    }

    function applyOrientation(systemConfig) {
      const mode = ["portrait", "landscape", "fullscreen"].includes(systemConfig?.orientation)
        ? systemConfig.orientation
        : "portrait";
      document.body.classList.remove("landscape-mode", "fullscreen-mode", "portrait-mode");
      if (mode === "landscape") {
        document.body.classList.add("landscape-mode");
      } else if (mode === "fullscreen") {
        document.body.classList.add("fullscreen-mode");
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
          <span class="home-menu-text">\u2694\uFE0F\u6226\u95D8</span>
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
        <span class="bottom-nav-label">\u30ad\u30e3\u30e9\u30fb\u7de8\u6210</span>
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
    if (battleLabel) battleLabel.textContent = "\u2694\uFE0F\u6226\u95D8";
  }

  function getCurrentProject(projects, currentProjectId) {
    return projects.find(project => project.id === currentProjectId) || null;
  }

  function normalizeProjectRecord(project) {
    return {
      id: String(project?.id || crypto.randomUUID()).trim(),
      name: String(project?.name || "\u7121\u984c\u306e\u30d7\u30ed\u30b8\u30a7\u30af\u30c8").trim().slice(0, 80) || "\u7121\u984c\u306e\u30d7\u30ed\u30b8\u30a7\u30af\u30c8",
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
