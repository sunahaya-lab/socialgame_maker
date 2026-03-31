(function () {
  function setupMusicEditor(deps) {
    const api = createMusicEditor(deps);
    api.setupMusicEditor();
    return api;
  }

  function createMusicEditor(deps) {
    const musicText = window.MusicEditorTextLib || null;
    const text = (key, fallback = "") => musicText?.get?.(key, fallback) || fallback;

    const {
      getSystemConfig,
      setSystemConfig,
      getCurrentProjectId,
      getCurrentPlayerId,
      getPlayerState,
      persistSystemConfigState,
      apiUrl,
      API,
      showToast,
      renderHome,
      esc
    } = deps;

    function getMusicAssets() {
      return Array.isArray(getSystemConfig()?.musicAssets) ? getSystemConfig().musicAssets : [];
    }

    function getMusicAssetLimit() {
      return 10;
    }

    function normalizeMusicAsset(asset) {
      if (!asset || typeof asset !== "object") return null;
      const id = String(asset.id || "").trim();
      const src = String(asset.src || "").trim();
      if (!id || !src) return null;
      return {
        id,
        name: String(asset.name || asset.originalFilename || id).trim() || id,
        src,
        mimeType: String(asset.mimeType || "").trim(),
        byteSize: Math.max(0, Number(asset.byteSize || 0)),
        createdAt: String(asset.createdAt || "")
      };
    }

    async function uploadMusicAsset(file) {
      const projectId = String(getCurrentProjectId?.() || "").trim();
      const userId = String(getCurrentPlayerId?.() || "").trim();
      if (!projectId || !userId) {
        throw new Error("project_or_user_missing");
      }

      const body = new FormData();
      body.append("projectId", projectId);
      body.append("userId", userId);
      body.append("usageType", "audio");
      body.append("kind", "bgm-audio");
      body.append("originalFilename", file.name || "bgm");
      body.append("file", file);

      const response = await fetch(apiUrl(API.assetsUpload, {
        query: { user: userId }
      }), {
        method: "POST",
        body
      });

      let data = null;
      try {
        data = await response.json();
      } catch {}
      if (!response.ok) {
        const error = new Error(String(data?.error || response.status));
        error.data = data;
        throw error;
      }
      return normalizeMusicAsset(data?.asset);
    }

    function renderHomeBgmSelect() {
      const select = document.getElementById("home-bgm-select");
      if (!select) return;
      const assets = getMusicAssets();
      const currentValue = String(getSystemConfig()?.homeBgmAssetId || "").trim();
      select.innerHTML = `<option value="">${text("none", "なし")}</option>` + assets.map(asset =>
        `<option value="${esc(asset.id)}">${esc(asset.name)}</option>`
      ).join("");
      select.value = currentValue;
    }

    function renderBattleBgmSelect() {
      const select = document.getElementById("battle-bgm-select");
      if (!select) return;
      const assets = getMusicAssets();
      const currentValue = String(getSystemConfig()?.battleBgmAssetId || "").trim();
      select.innerHTML = `<option value="">${text("none", "なし")}</option>` + assets.map(asset =>
        `<option value="${esc(asset.id)}">${esc(asset.name)}</option>`
      ).join("");
      select.value = currentValue;
    }

    function renderMusicAssetList() {
      const list = document.getElementById("music-asset-list");
      if (!list) return;
      const assets = getMusicAssets();
      if (!assets.length) {
        list.innerHTML = `<p class="editor-record-empty">${esc(text("emptyList", "登録済み BGM はまだありません"))}</p>`;
        return;
      }
      list.innerHTML = assets.map(asset => `
        <article class="editor-record-item">
          <div class="editor-record-item-top">
            <h5>${esc(asset.name || text("unnamed", "名称未設定"))}</h5>
            <span class="editor-record-badge">${esc(formatAudioSize(asset.byteSize))}</span>
          </div>
          <audio class="music-asset-audio" controls preload="none" src="${esc(asset.src)}"></audio>
          <div class="editor-record-actions">
            <button type="button" class="editor-inline-btn" data-music-use="${asset.id}">${text("useForHome", "ホームに設定")}</button>
            <button type="button" class="editor-inline-btn" data-music-delete="${asset.id}">${text("removeFromList", "一覧から外す")}</button>
          </div>
        </article>
      `).join("");

      list.querySelectorAll("[data-music-use]").forEach(button => {
        button.addEventListener("click", async () => {
          const nextConfig = {
            ...getSystemConfig(),
            homeBgmAssetId: String(button.dataset.musicUse || "").trim()
          };
          setSystemConfig(nextConfig);
          renderHomeBgmSelect();
          await persistSystemConfigState();
          applySelectedBgmPreview();
          renderHome("refresh");
          showToast(text("homeUpdated", "ホーム BGM を更新しました"));
        });
      });

      list.querySelectorAll("[data-music-delete]").forEach(button => {
        button.addEventListener("click", async () => {
          const targetId = String(button.dataset.musicDelete || "").trim();
          const nextAssets = getMusicAssets().filter(asset => asset.id !== targetId);
          const nextConfig = {
            ...getSystemConfig(),
            musicAssets: nextAssets,
            homeBgmAssetId: String(getSystemConfig()?.homeBgmAssetId || "").trim() === targetId
              ? ""
              : String(getSystemConfig()?.homeBgmAssetId || "").trim(),
            battleBgmAssetId: String(getSystemConfig()?.battleBgmAssetId || "").trim() === targetId
              ? ""
              : String(getSystemConfig()?.battleBgmAssetId || "").trim()
          };
          setSystemConfig(nextConfig);
          renderMusicEditor();
          await persistSystemConfigState();
          applySelectedBgmPreview();
          renderHome("refresh");
          showToast(text("removed", "BGM を一覧から外しました"));
        });
      });
    }

    function renderMusicEditor() {
      renderHomeBgmSelect();
      renderBattleBgmSelect();
      renderMusicAssetList();
    }

    function applySelectedBgmPreview() {
      const config = getSystemConfig?.() || {};
      const playerState = getPlayerState?.() || null;
      const bgmVolume = Math.min(100, Math.max(0, Number(playerState?.audioSettings?.bgmVolume || 100))) / 100;
      const assets = getMusicAssets();
      const syncAudio = (elementId, assetId) => {
        const audio = document.getElementById(elementId);
        if (!audio) return;
        const selected = assets.find(item => String(item?.id || "").trim() === String(assetId || "").trim()) || null;
        const nextSrc = String(selected?.src || "").trim();
        audio.volume = bgmVolume;
        if (!nextSrc) {
          audio.pause();
          audio.removeAttribute("src");
          audio.dataset.currentSrc = "";
          audio.load?.();
          return;
        }
        if (audio.dataset.currentSrc !== nextSrc) {
          audio.src = nextSrc;
          audio.dataset.currentSrc = nextSrc;
          audio.load?.();
        }
      };

      syncAudio("home-bgm", config.homeBgmAssetId);
      syncAudio("battle-bgm", config.battleBgmAssetId);
    }

    function formatAudioSize(byteSize) {
      const bytes = Math.max(0, Number(byteSize || 0));
      if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
      return `${bytes} B`;
    }

    function setupMusicEditor() {
      const form = document.getElementById("music-form");
      const uploadBtn = document.getElementById("music-asset-upload");
      const fileInput = document.getElementById("music-asset-file");
      if (!form || !uploadBtn || !fileInput) return;
      if (form.dataset.bound === "1") {
        renderMusicEditor();
        return;
      }

      uploadBtn.addEventListener("click", async () => {
        const file = fileInput.files?.[0];
        if (!file) {
          showToast(text("selectFile", "BGM ファイルを選択してください"));
          return;
        }

        uploadBtn.disabled = true;
        try {
          if (getMusicAssets().length >= getMusicAssetLimit()) {
            showToast(text("freeLimit", "無料版では BGM は10曲まで登録できます"));
            return;
          }
          const asset = await uploadMusicAsset(file);
          if (!asset) throw new Error("asset_missing");
          const nextAssets = [...getMusicAssets().filter(item => item.id !== asset.id), asset];
          setSystemConfig({
            ...getSystemConfig(),
            musicAssets: nextAssets
          });
          await persistSystemConfigState();
          fileInput.value = "";
          renderMusicEditor();
          applySelectedBgmPreview();
          showToast(text("added", "BGM を追加しました"));
        } catch (error) {
          console.error("Failed to upload music asset:", error);
          showToast(text("addFailed", "BGM の追加に失敗しました"));
        } finally {
          uploadBtn.disabled = false;
        }
      });

      form.addEventListener("submit", async event => {
        event.preventDefault();
        const nextConfig = {
          ...getSystemConfig(),
          homeBgmAssetId: String(form.homeBgmAssetId?.value || "").trim(),
          battleBgmAssetId: String(form.battleBgmAssetId?.value || "").trim()
        };
        setSystemConfig(nextConfig);
        await persistSystemConfigState();
        applySelectedBgmPreview();
        renderHome("refresh");
        showToast(text("settingsSaved", "BGM 設定を保存しました"));
      });

      form.dataset.bound = "1";
      renderMusicEditor();
    }

    return {
      setupMusicEditor,
      renderMusicEditor
    };
  }

  window.MusicEditor = {
    setupMusicEditor,
    createMusicEditor
  };
})();
