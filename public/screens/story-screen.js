(function () {
  function setupStoryScreen(deps) {
    const api = createStoryScreen(deps);

    document.querySelectorAll(".story-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".story-tab").forEach(item => item.classList.remove("active"));
        tab.classList.add("active");
        deps.setCurrentStoryType(tab.dataset.storyType);
        api.renderStoryList();
      });
    });

    document.querySelector(".story-reader-textbox").addEventListener("click", () => api.advanceStory());
    document.getElementById("story-reader-close").addEventListener("click", () => api.closeStoryReader());
    document.getElementById("bgm-toggle").addEventListener("click", () => api.toggleBgm());

    return api;
  }

  function createStoryScreen(deps) {
    const {
      getStories,
      getCharacters,
      getSystemConfig,
      getCurrentStoryType,
      setStoryReaderState,
      getStoryReaderState,
      setCurrentStoryType,
      getBaseCharById,
      findCharacterImageByName,
      resolveScenePortrait,
      getOwnedCount,
      getStoryProgress,
      saveStoryProgress,
      showCardDetail,
      showToast,
      esc
    } = deps;

    function renderStoryScreen() {
      renderEventPromo();
      renderStoryList();
    }

    function renderStoryList() {
      const list = document.getElementById("story-list");
      const empty = document.getElementById("story-empty");
      const filtered = getStories()
        .filter(story => story.type === getCurrentStoryType())
        .slice()
        .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0) || a.title.localeCompare(b.title, "ja"));

      renderEventPromo(filtered);

      list.innerHTML = "";
      if (filtered.length === 0) {
        empty.hidden = false;
        return;
      }

      empty.hidden = true;
      filtered.forEach(story => {
        const linkedCard = story.entryId ? getCharacters().find(char => char.id === story.entryId) : null;
        const progress = getStoryProgress ? getStoryProgress(story.id) : null;
        const availability = getStoryAvailability(story, filtered);
        const item = document.createElement("div");
        item.className = `story-item${availability.locked ? " is-locked" : ""}${availability.completed ? " is-completed" : ""}`;
        item.innerHTML = `
          <div class="story-item-head">
            <p class="story-item-type">${getStoryTypeLabel(story.type)}</p>
            <span class="story-item-status ${availability.statusClass}">${availability.statusLabel}</span>
          </div>
          <h4>${esc(story.title)}</h4>
          <p>${linkedCard ? `${esc(linkedCard.name)} / ` : ""}${story.scenes?.length || 0} \u30b7\u30fc\u30f3</p>
        `;
        item.addEventListener("click", () => {
          if (availability.locked) {
            showToast(availability.lockReason || "このストーリーはまだ解放されていません。");
            return;
          }
          openStoryReader(story);
        });
        list.appendChild(item);
      });
    }

    function renderEventPromo(eventStories = null) {
      const promo = document.getElementById("story-event-promo");
      const title = document.getElementById("story-event-promo-title");
      const copy = document.getElementById("story-event-promo-copy");
      const list = document.getElementById("story-event-promo-list");
      if (!promo || !title || !copy || !list) return;

      const currentType = getCurrentStoryType();
      const config = getSystemConfig?.()?.eventConfig || {};
      const cardIds = Array.isArray(config.eventCardIds) ? config.eventCardIds : [];
      const cards = cardIds
        .map(item => {
          const cardId = typeof item === "string" ? item : (item?.cardId || item?.id || "");
          const card = getCharacters().find(char => char.id === cardId) || null;
          if (!card) return null;
          return {
            ...card,
            eventLabel: typeof item === "string" ? "" : String(item?.label || "").trim(),
            eventAcquireText: typeof item === "string" ? "" : String(item?.acquireText || "").trim()
          };
        })
        .filter(Boolean);
      const stories = Array.isArray(eventStories) ? eventStories : getStories().filter(story => story.type === "event");

      const shouldShow = currentType === "event" && cards.length > 0;
      promo.hidden = !shouldShow;
      if (!shouldShow) {
        list.innerHTML = "";
        return;
      }

      title.textContent = config.title || "イベント限定カード";
      copy.textContent = stories.length > 0
        ? `${stories.length}本のイベントストーリーと一緒に限定カードを訴求できます。`
        : "イベントストーリーと一緒に限定カードを訴求できます。";

      list.innerHTML = cards.map(card => {
        const ownedCount = Math.max(0, Number(getOwnedCount?.(card.id) || 0));
        return `
          <button type="button" class="story-event-promo-card" data-story-event-card-id="${esc(card.id)}">
            <div class="story-event-promo-image">
              <img src="${esc(card.image || "")}" alt="${esc(card.name)}">
            </div>
            <div class="story-event-promo-body">
              <strong>${esc(card.name)}</strong>
              <span>${esc(card.eventLabel || card.catch || "イベント限定カード")}</span>
              <span>${esc(card.eventAcquireText || "入手方法未設定")}</span>
              <span>${ownedCount > 0 ? `所持数 ${ownedCount}` : "未所持"}</span>
            </div>
            <span class="story-event-promo-status${ownedCount > 0 ? " is-owned" : ""}">${ownedCount > 0 ? "OWNED" : "PICKUP"}</span>
          </button>
        `;
      }).join("");

      list.querySelectorAll("[data-story-event-card-id]").forEach(button => {
        button.addEventListener("click", () => {
          const card = cards.find(item => item.id === button.dataset.storyEventCardId);
          if (card) showCardDetail?.(card);
        });
      });
    }

    function getStoryTypeLabel(type) {
      if (type === "main") return "\u30e1\u30a4\u30f3\u30b9\u30c8\u30fc\u30ea\u30fc";
      if (type === "event") return "\u30a4\u30d9\u30f3\u30c8\u30b9\u30c8\u30fc\u30ea\u30fc";
      if (type === "character") return "\u30ad\u30e3\u30e9\u30b9\u30c8\u30fc\u30ea\u30fc";
      return "\u30b9\u30c8\u30fc\u30ea\u30fc";
    }

    async function openStoryReader(story) {
      if (!story.scenes || story.scenes.length === 0) {
        showToast("ストーリーにシーンがありません。");
        return;
      }

      const audio = document.getElementById("story-bgm");
      audio.pause();
      audio.src = "";
      audio.dataset.currentSrc = "";
      document.getElementById("story-audio-ctrl").hidden = true;
      document.getElementById("story-reader-bg-img").hidden = true;

      setStoryReaderState({ story, index: 0 });
      document.getElementById("story-reader").hidden = false;
      renderStoryScene();

      if (saveStoryProgress) {
        try {
          const current = getStoryProgress ? getStoryProgress(story.id) : null;
          if (current?.status === "completed") return;
          await saveStoryProgress(story.id, {
            status: "in_progress",
            lastSceneIndex: Math.max(0, Number(current?.lastSceneIndex || 0))
          });
          renderStoryList();
        } catch (error) {
          console.error("Failed to mark story in progress:", error);
        }
      }
    }

    function getStoryAvailability(story, sameTypeStories) {
      const progress = getStoryProgress ? getStoryProgress(story.id) : null;
      if (progress?.status === "completed") {
        return { locked: false, completed: true, statusLabel: "CLEAR", statusClass: "is-clear", lockReason: "" };
      }

      if (story.type === "character") {
        const ownedCount = story.entryId ? getOwnedCount(story.entryId) : 0;
        if (story.entryId && ownedCount <= 0) {
          return {
            locked: true,
            completed: false,
            statusLabel: "LOCKED",
            statusClass: "is-locked",
            lockReason: "対応するカードを所持すると解放されます。"
          };
        }
      }

      if (story.type === "main") {
        const ordered = sameTypeStories.slice();
        const index = ordered.findIndex(item => item.id === story.id);
        if (index > 0) {
          const previous = ordered[index - 1];
          const previousProgress = getStoryProgress ? getStoryProgress(previous.id) : null;
          if (previousProgress?.status !== "completed") {
            return {
              locked: true,
              completed: false,
              statusLabel: "LOCKED",
              statusClass: "is-locked",
              lockReason: "前のメインストーリーを読むと解放されます。"
            };
          }
        }
      }

      if (progress?.status === "in_progress") {
        return { locked: false, completed: false, statusLabel: "READING", statusClass: "is-reading", lockReason: "" };
      }

      if (progress?.status === "unlocked") {
        return { locked: false, completed: false, statusLabel: "OPEN", statusClass: "is-open", lockReason: "" };
      }

      return { locked: false, completed: false, statusLabel: "NEW", statusClass: "is-new", lockReason: "" };
    }

    function renderStoryScene() {
      const state = getStoryReaderState();
      if (!state) return;

      const { story, index } = state;
      const scene = story.scenes[index];
      const baseChar = scene.characterId ? getBaseCharById(scene.characterId) : null;
      const charName = baseChar ? baseChar.name : (scene.character || "\u30ca\u30ec\u30fc\u30b7\u30e7\u30f3");

      let portrait = resolveScenePortrait(story, baseChar, scene) || scene.image || findCharacterImageByName(scene.character);
      if (baseChar && scene.expressionName && baseChar.expressions?.length) {
        const expr = baseChar.expressions.find(item => item.name === scene.expressionName);
        if (expr?.image) portrait = expr.image;
      }

      const nameEl = document.getElementById("story-reader-name");
      nameEl.textContent = charName;
      nameEl.style.color = baseChar?.color || "var(--accent-light)";
      document.getElementById("story-reader-text").textContent = scene.text || "";

      const charEl = document.getElementById("story-reader-character");
      charEl.innerHTML = "";
      if (portrait) {
        const img = document.createElement("img");
        img.src = portrait;
        img.alt = charName;
        charEl.appendChild(img);
      }

      const bgImg = document.getElementById("story-reader-bg-img");
      if (scene.background) {
        bgImg.src = scene.background;
        bgImg.hidden = false;
        document.getElementById("story-reader-bg").style.background = "transparent";
      } else {
        bgImg.hidden = true;
        document.getElementById("story-reader-bg").style.background = baseChar
          ? `linear-gradient(180deg, ${baseChar.color}22 0%, #0a0a12 60%)`
          : "linear-gradient(180deg, #1a1040 0%, #0a0a12 100%)";
      }

      const audio = document.getElementById("story-bgm");
      const audioCtrl = document.getElementById("story-audio-ctrl");
      const sceneBgm = scene.bgm || (index === 0 ? story.bgm : null);
      if (sceneBgm && audio.dataset.currentSrc !== sceneBgm) {
        audio.src = sceneBgm;
        audio.dataset.currentSrc = sceneBgm;
        audio.play().catch(() => {});
        document.getElementById("bgm-toggle").textContent = "\u23F8";
        audioCtrl.hidden = false;
      } else if (index === 0 && story.bgm && !audio.src) {
        audio.src = story.bgm;
        audio.dataset.currentSrc = story.bgm;
        audio.play().catch(() => {});
        document.getElementById("bgm-toggle").textContent = "\u23F8";
        audioCtrl.hidden = false;
      }

      const progress = ((index + 1) / story.scenes.length) * 100;
      const progressEl = document.getElementById("story-reader-progress");
      progressEl.style.width = `${progress}%`;
      progressEl.style.background = baseChar?.color || "var(--accent-light)";
    }

    async function advanceStory() {
      const state = getStoryReaderState();
      if (!state) return;

      state.index += 1;
      if (state.index >= state.story.scenes.length) {
        if (saveStoryProgress) {
          try {
            await saveStoryProgress(state.story.id, {
              status: "completed",
              lastSceneIndex: state.story.scenes.length - 1
            });
            renderStoryList();
          } catch (error) {
            console.error("Failed to mark story completed:", error);
          }
        }

        closeStoryReader();
        showToast("ストーリーを最後まで読みました。");
        return;
      }

      if (saveStoryProgress) {
        try {
          await saveStoryProgress(state.story.id, {
            status: "in_progress",
            lastSceneIndex: state.index
          });
        } catch (error) {
          console.error("Failed to update story progress:", error);
        }
      }

      renderStoryScene();
    }

    function closeStoryReader() {
      setStoryReaderState(null);
      const audio = document.getElementById("story-bgm");
      audio.pause();
      audio.src = "";
      audio.dataset.currentSrc = "";
      document.getElementById("story-audio-ctrl").hidden = true;
      document.getElementById("story-reader").hidden = true;
    }

    function toggleBgm() {
      const audio = document.getElementById("story-bgm");
      const btn = document.getElementById("bgm-toggle");
      if (audio.paused) {
        audio.play().catch(() => {});
        btn.textContent = "\u23F8";
      } else {
        audio.pause();
        btn.textContent = "\u266B";
      }
    }

    return {
      renderStoryScreen,
      renderStoryList,
      openStoryReader,
      renderStoryScene,
      advanceStory,
      closeStoryReader,
      toggleBgm,
      setCurrentStoryType
    };
  }

  window.StoryScreen = {
    setupStoryScreen,
    createStoryScreen
  };
})();
