(function () {
  function createProfileActions(deps) {
    const {
      updatePlayerProfile,
      persistProfileMeta,
      syncPlayerProfile,
      renderAuthState,
      renderPanelStatus,
      setProfileStatus,
      isProfileSetupRequired,
      setPanelOpen,
      showToast,
      getApiErrorMessage
    } = deps;

    async function saveProfile({ displayName, birthday }) {
      if (!displayName) {
        setProfileStatus?.("ゲーム内ユーザー名を入力してください。", true);
        return { ok: false, reason: "missing_display_name" };
      }

      try {
        setProfileStatus?.("保存しています…");
        await updatePlayerProfile?.({ displayName, birthday });
        syncPlayerProfile?.();
        renderAuthState?.();
        renderPanelStatus?.("ゲーム内プロフィールを保存しました。");
        setProfileStatus?.("保存しました。");
        showToast?.("ゲーム内プロフィールを保存しました。");
        if (!isProfileSetupRequired?.()) setPanelOpen?.(false);
        return { ok: true };
      } catch (error) {
        console.error("Failed to save player profile:", error);
        const message = getApiErrorMessage?.(error, "プロフィールの保存に失敗しました。") || "プロフィールの保存に失敗しました。";
        setProfileStatus?.(message, true);
        renderPanelStatus?.(message, true);
        showToast?.(message);
        return { ok: false, reason: "api_error", error, message };
      }
    }

    function updateActiveTitle(nextTitleId) {
      persistProfileMeta?.(profile => ({
        ...profile,
        activeTitleId: String(nextTitleId || "").trim()
      }));
      renderAuthState?.();
      showToast?.("表示中の称号を更新しました。");
      return { ok: true };
    }

    return {
      saveProfile,
      updateActiveTitle
    };
  }

  window.ProfileActionsLib = {
    create: createProfileActions
  };
})();
