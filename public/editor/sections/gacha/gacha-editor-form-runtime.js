/* Gacha editor form runtime.
 * Role: owns editor-side gacha form mode switching, submit flow, and edit/reset
 * behavior for the gacha section.
 */
(() => {
  function create(deps = {}) {
    function normalizeGachaCatalogMode(value) {
      if (value === "mixed_shared") return "mixed_shared";
      if (value === "split_catalogs") return "split_catalogs";
      return "characters_only";
    }

    function normalizeGachaType(value) {
      if (value === "equipment") return "equipment";
      if (value === "mixed") return "mixed";
      return "character";
    }

    function getResolvedGachaType(inputType = "character") {
      const mode = normalizeGachaCatalogMode(deps.getSystemConfig?.()?.gachaCatalogMode);
      const type = normalizeGachaType(inputType);
      if (mode === "mixed_shared") return "mixed";
      if (mode === "split_catalogs") return type === "mixed" ? "character" : type;
      return "character";
    }

    function updateGachaFormMode() {
      const form = document.getElementById("gacha-form");
      if (!form) return;
      const mode = normalizeGachaCatalogMode(deps.getSystemConfig?.()?.gachaCatalogMode);
      const select = form.gachaType;
      const requestedType = normalizeGachaType(select?.value);
      const gachaType = getResolvedGachaType(requestedType);
      const poolWrap = document.getElementById("gacha-pool-selector");
      const poolTitle = document.getElementById("gacha-pool-title");
      const typeNote = document.getElementById("gacha-type-note");
      if (select) {
        Array.from(select.options).forEach(option => {
          const value = normalizeGachaType(option.value);
          const allowed = mode === "split_catalogs"
            ? value === "character" || value === "equipment"
            : mode === "mixed_shared"
              ? value === "mixed"
              : value === "character";
          option.hidden = !allowed;
          option.disabled = !allowed;
        });
        select.value = gachaType;
      }
      if (poolWrap) poolWrap.hidden = gachaType === "equipment";
      if (poolTitle) {
        poolTitle.textContent = gachaType === "equipment"
          ? "装備ピックアップ"
          : gachaType === "mixed"
            ? "キャラ / 装備ピックアップ"
            : "キャラピックアップ";
      }
      if (typeNote) {
        typeNote.textContent = gachaType === "equipment"
          ? "装備ガチャです 装備カードを排出対象にします"
          : gachaType === "mixed"
            ? "混合ガチャです キャラと装備を同じガチャから排出します"
            : "キャラガチャです ピックアップ候補のカードを選べます";
      }
    }

    async function handleGachaSubmit(event) {
      event.preventDefault();
      const form = event.target;
      const editState = deps.getEditState?.();
      const gachas = deps.getGachas?.() || [];
      const existing = editState?.gachaId ? gachas.find(item => item.id === editState.gachaId) : null;
      const bannerFile = form.bannerImage.files[0];
      const heroImage2File = form.heroImage2?.files?.[0];
      const heroImage3File = form.heroImage3?.files?.[0];
      const bannerImage = bannerFile ? await deps.readFileAsDataUrl?.(bannerFile) : (existing?.bannerImage || existing?.heroImages?.[0] || "");
      const heroImage2 = heroImage2File ? await deps.readFileAsDataUrl?.(heroImage2File) : (existing?.heroImages?.[1] || "");
      const heroImage3 = heroImage3File ? await deps.readFileAsDataUrl?.(heroImage3File) : (existing?.heroImages?.[2] || "");
      const gachaType = getResolvedGachaType(form.gachaType?.value);
      const featured = gachaType === "equipment"
        ? []
        : Array.from(document.querySelectorAll(".gacha-pool-char.selected")).map(el => el.dataset.charId);
      const gacha = {
        id: editState?.gachaId || crypto.randomUUID(),
        title: form.title.value.trim(),
        gachaType,
        description: form.description.value.trim(),
        bannerImage,
        displayMode: form.displayMode?.value === "manualImages" ? "manualImages" : "featuredCards",
        heroImages: [bannerImage, heroImage2, heroImage3].filter(Boolean),
        featured,
        rates: deps.getRarityModeConfig?.().tiers.reduce((acc, tier) => {
          acc[tier.value] = Number(form.querySelector(`[name="rate-${tier.value}"]`)?.value) || 0;
          return acc;
        }, {})
      };
      const next = existing
        ? gachas.map(item => item.id === gacha.id ? gacha : item)
        : [...gachas, gacha];
      deps.setGachas?.(next);
      deps.saveLocal?.("socia-gachas", next);
      try {
        await deps.postJSON?.(deps.apiUrl?.(deps.API.gachas), gacha);
      } catch (error) {
        console.error("Failed to save gacha:", error);
        deps.showToast?.("ガチャの保存に失敗しました。");
      }
      resetGachaForm();
      deps.renderHome?.();
      deps.renderEditorGachaList?.();
      deps.showToast?.(`${gacha.title}を${existing ? "更新" : "保存"}しました。`);
    }

    function beginGachaEdit(id) {
      const gacha = (deps.getGachas?.() || []).find(item => item.id === id);
      if (!gacha) return;
      const editState = deps.getEditState?.();
      editState.gachaId = id;
      const form = document.getElementById("gacha-form");
      form.title.value = gacha.title || "";
      form.description.value = gacha.description || "";
      if (form.gachaType) form.gachaType.value = getResolvedGachaType(gacha.gachaType);
      if (form.displayMode) form.displayMode.value = gacha.displayMode === "manualImages" ? "manualImages" : "featuredCards";
      deps.renderGachaRateInputs?.(gacha.rates);
      deps.renderGachaPoolChars?.(gacha.featured || []);
      updateGachaFormMode();
      deps.updateEditorSubmitLabels?.();
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function resetGachaForm() {
      const editState = deps.getEditState?.();
      editState.gachaId = null;
      const form = document.getElementById("gacha-form");
      form?.reset();
      if (form?.displayMode) form.displayMode.value = "featuredCards";
      if (form?.gachaType) form.gachaType.value = getResolvedGachaType("character");
      deps.renderGachaRateInputs?.(deps.getDefaultRates?.());
      deps.renderGachaPoolChars?.();
      updateGachaFormMode();
      deps.updateEditorSubmitLabels?.();
    }

    return {
      handleGachaSubmit,
      updateGachaFormMode,
      beginGachaEdit,
      resetGachaForm
    };
  }

  window.SociaGachaEditorFormRuntime = {
    create
  };
})();
