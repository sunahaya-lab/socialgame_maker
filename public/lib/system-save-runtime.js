(function () {
  function createSystemSaveRuntime(deps) {
    const {
      saveLocal,
      postJSON,
      getSystemApiUrl,
      getCurrentPlayerId,
      showToast
    } = deps;

    async function saveSharedConfig(value) {
      saveLocal?.("socia-system", value);
      try {
        const currentUserId = String(getCurrentPlayerId?.() || "").trim();
        const response = await postJSON?.(
          getSystemApiUrl?.(currentUserId ? { user: currentUserId } : {}),
          currentUserId ? { ...value, userId: currentUserId } : value
        );
        return {
          ok: true,
          localSaved: true,
          sharedSaved: true,
          response: response || null
        };
      } catch (error) {
        const code = String(error?.data?.code || "");
        const requiredPack = String(error?.data?.requiredPack || "").trim();
        if (code === "auth_required" || code === "owner_required" || code === "owner_unresolved") {
          showToast?.("システム設定はローカルに保存しました。共有保存はプロジェクト所有者のみ実行できます。");
          return {
            ok: false,
            localSaved: true,
            sharedSaved: false,
            code,
            error
          };
        }
        if (code === "billing_feature_required" && (requiredPack === "battle" || requiredPack === "event")) {
          const label = requiredPack === "battle" ? "Battle Pack" : "Event Pack";
          showToast?.(`${label} が必要な設定を含むため、共有保存はスキップしました。ローカルには保持されています。`);
          return {
            ok: false,
            localSaved: true,
            sharedSaved: false,
            code,
            error
          };
        }
        if (code === "billing_feature_required" && requiredPack) {
          showToast?.(`${requiredPack} が必要な設定を含むため、共有保存はスキップしました。`);
          return {
            ok: false,
            localSaved: true,
            sharedSaved: false,
            code,
            error
          };
        }
        console.error("Failed to save system config:", error);
        showToast?.("システム設定の共有保存に失敗しました。ローカルには保持されています。");
        return {
          ok: false,
          localSaved: true,
          sharedSaved: false,
          code: code || "shared_save_failed",
          error
        };
      }
    }

    return {
      saveSharedConfig
    };
  }

  window.SystemSaveRuntimeLib = {
    create: createSystemSaveRuntime
  };
})();
