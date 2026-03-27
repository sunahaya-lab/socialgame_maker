(function () {
  const { get, post } = window.ApiClient || {};
  const state = {
    catalog: [],
    lastUserLicense: null
  };

  const elements = {
    adminSecret: document.getElementById("admin-secret"),
    userId: document.getElementById("user-id"),
    projectId: document.getElementById("project-id"),
    baseTier: document.getElementById("base-tier"),
    packs: Array.from(document.querySelectorAll("#packs input[type='checkbox']")),
    loadLicense: document.getElementById("load-license"),
    saveLicense: document.getElementById("save-license"),
    loadProjectLicense: document.getElementById("load-project-license"),
    status: document.getElementById("status"),
    output: document.getElementById("output")
  };

  elements.loadLicense?.addEventListener("click", loadUserLicense);
  elements.saveLicense?.addEventListener("click", saveUserLicense);
  elements.loadProjectLicense?.addEventListener("click", loadProjectLicense);

  function buildHeaders() {
    const secret = String(elements.adminSecret?.value || "").trim();
    return secret ? { "X-Socia-Admin-Secret": secret } : {};
  }

  function getSelectedPacks() {
    return elements.packs.filter(input => input.checked).map(input => input.value);
  }

  function setSelectedPacks(packIds) {
    const active = new Set(Array.isArray(packIds) ? packIds : []);
    elements.packs.forEach(input => {
      input.checked = active.has(input.value);
    });
  }

  function renderOutput(data) {
    elements.output.textContent = JSON.stringify(data, null, 2);
  }

  function setStatus(text, kind) {
    elements.status.textContent = text || "";
    elements.status.className = `status${kind ? ` ${kind}` : ""}`;
  }

  function validateUserInput() {
    const userId = String(elements.userId?.value || "").trim();
    if (!userId) {
      setStatus("User ID を入力してください。", "error");
      return null;
    }
    return userId;
  }

  async function loadUserLicense() {
    const userId = validateUserInput();
    if (!userId) return;

    setStatus("取得中...", "");
    try {
      const data = await get("/api/admin/user-license", {
        query: { user: userId },
        headers: buildHeaders()
      });
      state.catalog = Array.isArray(data?.catalog) ? data.catalog : [];
      state.lastUserLicense = data?.license || null;
      hydrateLicenseForm(data?.license);
      renderOutput(data);
      setStatus("ユーザー課金状態を取得しました。", "ok");
    } catch (error) {
      renderOutput(error?.data || { error: error.message });
      setStatus(error?.data?.error || "ユーザー課金状態の取得に失敗しました。", "error");
    }
  }

  async function saveUserLicense() {
    const userId = validateUserInput();
    if (!userId) return;

    const payload = {
      userId,
      baseTier: elements.baseTier?.value || "free",
      ownedPacks: getSelectedPacks()
    };

    setStatus("保存中...", "");
    try {
      const data = await post("/api/admin/user-license", payload, {
        headers: buildHeaders()
      });
      state.catalog = Array.isArray(data?.catalog) ? data.catalog : state.catalog;
      state.lastUserLicense = data?.license || null;
      hydrateLicenseForm(data?.license);
      renderOutput(data);
      setStatus("ユーザー課金状態を保存しました。", "ok");
    } catch (error) {
      renderOutput(error?.data || { error: error.message });
      setStatus(error?.data?.error || "ユーザー課金状態の保存に失敗しました。", "error");
    }
  }

  async function loadProjectLicense() {
    const projectId = String(elements.projectId?.value || "").trim();
    const userId = validateUserInput();
    if (!projectId || !userId) {
      setStatus("Project ID と User ID を入力してください。", "error");
      return;
    }

    setStatus("プロジェクト課金状態を取得中...", "");
    try {
      const data = await get("/api/admin/project-license", {
        query: { project: projectId, user: userId },
        headers: buildHeaders()
      });
      renderOutput(data);
      setStatus("プロジェクト課金状態を取得しました。", "ok");
    } catch (error) {
      renderOutput(error?.data || { error: error.message });
      setStatus(error?.data?.error || "プロジェクト課金状態の取得に失敗しました。", "error");
    }
  }

  function hydrateLicenseForm(license) {
    elements.baseTier.value = license?.baseTier || "free";
    setSelectedPacks(license?.ownedPacks || []);
  }
})();
