(function () {
  function createProjectMembersRuntime(deps) {
    const {
      apiUrl,
      API,
      fetchJSON,
      postJSON,
      getCurrentPlayerId
    } = deps;

    async function list(projectId) {
      const response = await fetchJSON(
        apiUrl(API.projectMembers, {
          includeProject: false,
          query: {
            project: projectId,
            user: getCurrentPlayerId()
          }
        })
      );
      return Array.isArray(response?.members) ? response.members : [];
    }

    async function invite(projectId, targetUserId, role = "viewer") {
      const inviteValue = String(targetUserId || "").trim();
      const response = await postJSON(
        apiUrl(API.projectMembers, {
          includeProject: false,
          query: { project: projectId }
        }),
        {
          action: "invite",
          projectId,
          userId: getCurrentPlayerId(),
          targetUserId: inviteValue.includes("@") ? "" : inviteValue,
          targetEmail: inviteValue.includes("@") ? inviteValue : "",
          role
        }
      );
      return Array.isArray(response?.members) ? response.members : [];
    }

    async function updateRole(projectId, targetUserId, role = "viewer") {
      const response = await postJSON(
        apiUrl(API.projectMembers, {
          includeProject: false,
          query: { project: projectId }
        }),
        {
          action: "update-role",
          projectId,
          userId: getCurrentPlayerId(),
          targetUserId,
          role
        }
      );
      return Array.isArray(response?.members) ? response.members : [];
    }

    return {
      list,
      invite,
      updateRole
    };
  }

  window.ProjectMembersRuntimeLib = {
    create: createProjectMembersRuntime
  };
})();
