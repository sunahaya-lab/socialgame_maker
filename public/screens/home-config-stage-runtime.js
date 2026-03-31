(function () {
  function createHomeConfigStageRuntime(deps) {
    const {
      getHomeConfigDraft,
      setActiveHomeConfigTarget,
      getActiveHomeConfigTarget,
      getHomeConfigDrag,
      setHomeConfigDrag,
      getCharacters,
      makeFallbackImage,
      esc,
      clamp,
      syncHomeConfigForm,
      syncHomeConfigScale,
      renderHomeConfigStage
    } = deps;

    function renderHomeConfigStageRuntime() {
      const draft = getHomeConfigDraft();
      if (!draft) return;
      const stage = document.getElementById("home-config-stage");
      if (stage) {
        stage.style.backgroundImage = draft.backgroundImage
          ? `linear-gradient(180deg, rgba(8,10,18,0.16), rgba(8,10,18,0.3)), url("${String(draft.backgroundImage).replace(/"/g, '\\"')}")`
          : "";
        stage.style.backgroundSize = draft.backgroundImage ? "cover" : "";
        stage.style.backgroundPosition = draft.backgroundImage ? "center" : "";
      }
      renderHomeConfigStageCharRuntime(1);
      renderHomeConfigStageCharRuntime(2);
    }

    function renderHomeConfigStageCharRuntime(index) {
      const draft = getHomeConfigDraft();
      if (!draft) return;
      const stageChar = document.getElementById(`home-config-stage-char-${index}`);
      if (!stageChar) return;
      const isVisible = index === 1 || draft.mode === 2;
      if (!isVisible) {
        stageChar.innerHTML = "";
        stageChar.classList.add("is-hidden");
        return;
      }

      const cardId = draft[`card${index}`];
      const cards = getCharacters();
      const card = cards.find(item => item.id === cardId) || (index === 1 ? cards[0] : null);
      if (!card) {
        stageChar.innerHTML = '<div class="home-config-stage-empty">No card selected</div>';
      } else {
        stageChar.innerHTML = `<img src="${card.image || makeFallbackImage(card.name, card.rarity)}" alt="${esc(card.name)}">`;
      }

      stageChar.classList.remove("is-hidden");
      stageChar.classList.toggle("is-active", getActiveHomeConfigTarget() === index);
      stageChar.classList.toggle("is-front", draft.front === index);
      stageChar.classList.toggle("is-back", draft.front !== index);
      stageChar.dataset.label = `Character ${index}`;
      stageChar.style.transform = `translateX(${draft[`x${index}`]}%) scale(${draft[`scale${index}`] / 100})`;
      stageChar.style.bottom = `${32 + draft[`y${index}`] * 2.2}px`;
      stageChar.onpointerdown = event => beginHomeConfigDragRuntime(event, index);
    }

    function beginHomeConfigDragRuntime(event, index) {
      const draft = getHomeConfigDraft();
      if (!draft) return;
      setActiveHomeConfigTarget(index);
      syncHomeConfigForm();
      const stage = document.getElementById("home-config-stage");
      setHomeConfigDrag({
        index,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        initialX: draft[`x${index}`],
        initialY: draft[`y${index}`],
        initialScale: draft[`scale${index}`],
        width: stage.clientWidth,
        height: stage.clientHeight,
        pointers: new Map([[event.pointerId, { x: event.clientX, y: event.clientY }]]),
        pinchDistance: null
      });
      event.currentTarget.classList.add("is-dragging");
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    function updateHomeConfigDragRuntime(event) {
      const drag = getHomeConfigDrag();
      const draft = getHomeConfigDraft();
      if (!drag || !draft) return;
      drag.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (drag.pointers.size >= 2) {
        const [a, b] = [...drag.pointers.values()];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (!drag.pinchDistance) {
          drag.pinchDistance = distance;
          drag.initialScale = draft[`scale${drag.index}`];
          return;
        }
        const nextScale = drag.initialScale * (distance / drag.pinchDistance);
        draft[`scale${drag.index}`] = Math.round(clamp(nextScale, 50, 200));
        syncHomeConfigScale();
        renderHomeConfigStage();
        return;
      }
      if (drag.pointerId !== event.pointerId) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      const nextX = drag.initialX + (dx / drag.width) * 100;
      const nextY = drag.initialY - (dy / drag.height) * 90;
      draft[`x${drag.index}`] = clamp(nextX, -60, 60);
      draft[`y${drag.index}`] = clamp(nextY, -30, 50);
      renderHomeConfigStage();
    }

    function endHomeConfigDragRuntime(event) {
      const drag = getHomeConfigDrag();
      const draft = getHomeConfigDraft();
      if (!drag) return;
      if (event) {
        drag.pointers.delete(event.pointerId);
        if (drag.pointers.size > 0 && event.pointerId !== drag.pointerId) return;
        if (drag.pointers.size > 0 && event.pointerId === drag.pointerId) {
          const [remaining] = drag.pointers.values();
          drag.startX = remaining.x;
          drag.startY = remaining.y;
          drag.initialX = draft[`x${drag.index}`];
          drag.initialY = draft[`y${drag.index}`];
          drag.initialScale = draft[`scale${drag.index}`];
          drag.pinchDistance = null;
          return;
        }
      }
      const el = document.getElementById(`home-config-stage-char-${drag.index}`);
      el?.classList.remove("is-dragging");
      setHomeConfigDrag(null);
    }

    return {
      renderHomeConfigStage: renderHomeConfigStageRuntime,
      renderHomeConfigStageChar: renderHomeConfigStageCharRuntime,
      beginHomeConfigDrag: beginHomeConfigDragRuntime,
      updateHomeConfigDrag: updateHomeConfigDragRuntime,
      endHomeConfigDrag: endHomeConfigDragRuntime
    };
  }

  window.HomeConfigStageRuntime = {
    create: createHomeConfigStageRuntime
  };
})();
