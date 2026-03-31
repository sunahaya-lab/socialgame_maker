(function () {
  function createAppProjectRuntime(deps) {
    const {
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
      renderProjectControls,
      loadAllData,
      resetEditorForms,
      renderAll,
      esc
    } = deps;

    function buildProjectsApiUrl() {
      return apiUrl(API.projects, {
        includeProject: false,
        query: { user: getCurrentPlayerId?.() }
      });
    }

    function persistProjectSelection() {
      saveProjectRegistry("socia-projects", getProjects());
      saveProjectRegistry("socia-current-project-id", getCurrentProjectId());
    }

    async function reloadProjectRuntime() {
      resetEditState();
      syncProjectQuery();
      renderProjectControls();
      await loadAllData();
      resetEditorForms();
      renderAll();
    }

    function bindProjectControls({ switchProject, handleCreateProject }) {
      document.getElementById("project-select")?.addEventListener("change", async event => {
        const nextProjectId = event.target.value;
        if (!nextProjectId || nextProjectId === getCurrentProjectId()) return;
        await switchProject(nextProjectId);
      });

      document.getElementById("project-create-btn")?.addEventListener("click", handleCreateProject);
    }

    function upsertProjectInState(projectId, nextProject) {
      setProjects(getProjects().map(project => project.id === projectId ? nextProject : project));
    }

    async function syncProjectRecordToRemote(project) {
      const response = await postJSON(buildProjectsApiUrl(), {
        ...project,
        userId: getCurrentPlayerId?.()
      });
      return normalizeProjectRecord(response.project || project);
    }

    function renderProjectControlsImpl() {
      const nameEl = document.getElementById("home-player-name");
      const select = document.getElementById("project-select");
      if (nameEl) {
        nameEl.textContent = getCurrentProject?.()?.name || "\u30d7\u30ed\u30b8\u30a7\u30af\u30c8";
      }
      if (!select) return;
      select.innerHTML = getProjects().map(project =>
        `<option value="${esc(project.id)}"${project.id === getCurrentProjectId() ? " selected" : ""}>${esc(project.name)}</option>`
      ).join("");
    }

    function setupProjectControls({ bindProjectControls }) {
      const nameEl = document.getElementById("home-player-name");
      if (!nameEl || document.getElementById("project-select")) return;
      const host = nameEl.parentElement;
      const controls = document.createElement("div");
      controls.className = "project-controls";
      controls.innerHTML = `
        <select id="project-select" aria-label="\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u3092\u9078\u629e"></select>
        <button type="button" class="project-create-btn" id="project-create-btn">+</button>
      `;
      host.appendChild(controls);

      bindProjectControls?.();
    }

    async function ensureDefaultProject({ showCreateError }) {
      const defaultProject = makeProjectRecord("\u30de\u30a4\u30d7\u30ed\u30b8\u30a7\u30af\u30c8");
      const projects = [defaultProject];
      saveProjectRegistry("socia-projects", projects);
      try {
        await postJSON(buildProjectsApiUrl(), {
          ...defaultProject,
          userId: getCurrentPlayerId?.()
        });
      } catch (error) {
        showCreateError?.(error);
      }
      return projects;
    }

    function createProjectLocally(name) {
      const project = makeProjectRecord(name);
      const projects = [...getProjects(), project];
      setProjects(projects);
      saveProjectRegistry("socia-projects", projects);
      return project;
    }

    function renameProjectLocally(projectId, nextName) {
      const id = String(projectId || "").trim();
      const name = String(nextName || "").trim().slice(0, 80);
      if (!id || !name) return null;

      const current = getProjects().find(project => project.id === id);
      if (!current) return null;

      const renamedProject = normalizeProjectRecord({
        ...current,
        id: current.id,
        name,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString()
      });

      setProjects(getProjects().map(project => project.id === id ? renamedProject : project));
      saveProjectRegistry("socia-projects", getProjects());
      return renamedProject;
    }

    return {
      buildProjectsApiUrl,
      persistProjectSelection,
      reloadProjectRuntime,
      bindProjectControls,
      upsertProjectInState,
      syncProjectRecordToRemote,
      renderProjectControlsImpl,
      setupProjectControls,
      ensureDefaultProject,
      createProjectLocally,
      renameProjectLocally
    };
  }

  window.AppProjectRuntimeLib = {
    create: createAppProjectRuntime
  };
})();
