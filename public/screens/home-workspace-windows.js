(function () {
  function createHomeWorkspaceWindowsController(deps) {
    const {
      renderMenuButtons
    } = deps;

    const windowState = {
      menu: { x: 16, y: 16, open: true, z: 50, placed: true },
      builder: { x: 16, y: 84, open: false, z: 51, placed: false },
      folders: { x: 16, y: 144, open: false, z: 52, placed: false },
      baseChar: { x: 16, y: 204, open: false, z: 53, placed: false },
      characterCard: { x: 16, y: 264, open: false, z: 54, placed: false },
      equipmentCard: { x: 16, y: 324, open: false, z: 55, placed: false },
      story: { x: 16, y: 384, open: false, z: 56, placed: false },
      gacha: { x: 16, y: 444, open: false, z: 57, placed: false },
      system: { x: 16, y: 504, open: false, z: 58, placed: false }
    };

    let draggingWindow = null;

    function getWindowElement(key) {
      return document.querySelector(`[data-home-edit-window="${key}"]`);
    }

    function applyWindowState(key) {
      const state = windowState[key];
      const el = getWindowElement(key);
      if (!state || !el) return;
      el.style.left = `${state.x}px`;
      el.style.top = `${state.y}px`;
      el.style.zIndex = String(state.z);
      el.hidden = !state.open;
    }

    function applyAllWindowStates() {
      Object.keys(windowState).forEach(applyWindowState);
    }

    function bringWindowToFront(key) {
      const state = windowState[key];
      if (!state) return;
      const top = Math.max(...Object.values(windowState).map(item => item.z || 1), 1) + 1;
      state.z = top;
      applyWindowState(key);
    }

    function positionWindowForOpen(key) {
      const state = windowState[key];
      const overlay = document.getElementById("home-edit-overlay");
      if (!state || !overlay) return;

      const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1280;
      const leftMargin = 18;
      const estimatedWidths = {
        builder: 430,
        folders: 420,
        baseChar: 480,
        characterCard: 520,
        equipmentCard: 520,
        story: 560,
        gacha: 480,
        system: 500
      };
      const leftColumnY = { builder: 88, folders: 120 };
      const rightColumnY = { baseChar: 84, characterCard: 112, equipmentCard: 140, story: 168, gacha: 96, system: 124 };
      const centerStartX = Math.max(36, Math.round(viewportWidth * 0.16));
      const nearRightX = Math.max(96, Math.min(centerStartX + 360, viewportWidth - (estimatedWidths.baseChar || 480) - 80));
      const preferredX = {
        builder: centerStartX,
        folders: centerStartX + 18,
        baseChar: nearRightX,
        characterCard: nearRightX + 28,
        equipmentCard: nearRightX + 56,
        story: nearRightX + 84,
        gacha: nearRightX + 10,
        system: nearRightX + 40
      };

      if (key === "menu") {
        state.x = 16;
        state.y = 16;
        state.placed = true;
        return;
      }

      const useLeftColumn = key === "builder" || key === "folders";
      const width = estimatedWidths[key] || 420;
      const rawX = preferredX[key] ?? centerStartX;
      const baseX = Math.max(leftMargin, Math.min(rawX, viewportWidth - width - 32));
      const baseY = useLeftColumn ? (leftColumnY[key] || 96) : (rightColumnY[key] || 96);

      state.x = baseX;
      state.y = baseY;
      state.placed = true;
    }

    function toggleWindow(key) {
      const state = windowState[key];
      if (!state) return;
      if (!state.open && !state.placed) {
        positionWindowForOpen(key);
      }
      state.open = !state.open;
      if (state.open) bringWindowToFront(key);
      applyWindowState(key);
      renderMenuButtons?.();
    }

    function beginWindowDrag(event) {
      const key = event.currentTarget?.dataset?.homeEditDragHandle;
      const state = windowState[key];
      const el = getWindowElement(key);
      if (!state || !el) return;
      draggingWindow = {
        key,
        offsetX: event.clientX - el.offsetLeft,
        offsetY: event.clientY - el.offsetTop
      };
      bringWindowToFront(key);
    }

    function onWindowDragMove(event) {
      if (!draggingWindow) return;
      const state = windowState[draggingWindow.key];
      if (!state) return;
      state.x = Math.round(event.clientX - draggingWindow.offsetX);
      state.y = Math.round(event.clientY - draggingWindow.offsetY);
      state.placed = true;
      applyWindowState(draggingWindow.key);
    }

    function endWindowDrag() {
      draggingWindow = null;
    }

    function bindOverlay(overlay) {
      if (!overlay) return;
      overlay.querySelectorAll("[data-home-edit-toggle]").forEach(button => {
        button.addEventListener("click", () => toggleWindow(button.dataset.homeEditToggle || ""));
      });
      overlay.querySelectorAll("[data-home-edit-drag-handle]").forEach(handle => {
        handle.addEventListener("pointerdown", beginWindowDrag);
      });
      overlay.querySelectorAll("[data-home-edit-window]").forEach(windowEl => {
        windowEl.addEventListener("pointerdown", () => bringWindowToFront(windowEl.dataset.homeEditWindow || ""));
      });
      window.addEventListener("pointermove", onWindowDragMove);
      window.addEventListener("pointerup", endWindowDrag);
    }

    return {
      getWindowState: () => windowState,
      applyAllWindowStates,
      applyWindowState,
      bringWindowToFront,
      toggleWindow,
      bindOverlay
    };
  }

  window.HomeWorkspaceWindowsLib = {
    create: createHomeWorkspaceWindowsController
  };
})();
