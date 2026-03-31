(function () {
  function createBaseCharEditorSaveRuntime(deps) {
    const {
      getBaseChars,
      setBaseChars,
      getEditState,
      getApi,
      readFileAsDataUrl,
      uploadStaticImageAsset,
      makeBaseCharFallback,
      normalizeBirthday,
      saveLocal,
      postJSON,
      showToast,
      upsertItem,
      renderBaseCharList,
      populateBaseCharSelects,
      normalizeCharacterSpeechSoundId,
      collectBaseCharVoiceLines,
      collectBaseCharHomeVoiceLines,
      collectHomeOpinions,
      collectHomeConversations,
      collectHomeBirthdays,
      collectVariants,
      collectExpressions,
      resetBaseCharForm,
      text,
    } = deps;

    async function resolveStaticImage(file, options = {}, fallback = "") {
      if (!file) return fallback;
      if (typeof uploadStaticImageAsset === "function") {
        try {
          const uploaded = await uploadStaticImageAsset(file, options);
          if (uploaded?.src) return uploaded.src;
        } catch (error) {
          console.error("Failed to upload normalized image, falling back to data URL:", error);
          showToast(text("uploadFallback", "画像アップロードに失敗したため、一時的にローカル画像を使用します。"));
        }
      }
      return readFileAsDataUrl(file);
    }

    async function handleBaseCharSubmit(e) {
      e.preventDefault();
      const form = e.target;
      const baseChars = getBaseChars();
      const previousBaseChars = Array.isArray(baseChars) ? baseChars.slice() : [];
      const existing = getEditState().baseCharId ? baseChars.find(item => item.id === getEditState().baseCharId) : null;
      const portraitFile = form.portrait.files?.[0];
      const portrait = portraitFile
        ? await resolveStaticImage(portraitFile, {
          usageType: "portrait",
          kind: "base-character-portrait"
        }, existing?.portrait || "")
        : (existing?.portrait || "");

      const baseChar = {
        id: getEditState().baseCharId || crypto.randomUUID(),
        name: form.name.value.trim(),
        description: form.description.value.trim(),
        birthday: normalizeBirthday(form.birthday.value),
        color: form.color.value || "#a29bfe",
        speechSoundId: normalizeCharacterSpeechSoundId(form.speechSoundId?.value),
        portrait: portrait || makeBaseCharFallback(form.name.value.trim(), form.color.value),
        voiceLines: collectBaseCharVoiceLines(),
        homeVoices: collectBaseCharHomeVoiceLines(),
        homeOpinions: collectHomeOpinions(),
        homeConversations: collectHomeConversations(),
        homeBirthdays: collectHomeBirthdays(),
        variants: await collectVariants(),
        expressions: await collectExpressions()
      };

      upsertItem(baseChars, baseChar);
      setBaseChars(baseChars);
      saveLocal("socia-base-chars", baseChars);
      try {
        await postJSON(getApi().baseChars, baseChar);
      } catch (error) {
        console.error("Failed to save base character:", error);
        if (String(error?.data?.code || "") === "owner_required") {
          setBaseChars(previousBaseChars);
          saveLocal("socia-base-chars", previousBaseChars);
          renderBaseCharList();
          populateBaseCharSelects();
          showToast(String(error?.data?.error || "この操作はプロジェクトの所有者だけが実行できます。"));
          return;
        }
        showToast(text("saveFailed", "ベースキャラの保存に失敗しました。ローカルには保持されています。"));
      }

      resetBaseCharForm();
      renderBaseCharList();
      populateBaseCharSelects();
      showToast(`${baseChar.name}を${existing ? "更新" : "登録"}しました。`);
    }

    return {
      resolveStaticImage,
      handleBaseCharSubmit,
    };
  }

  window.BaseCharEditorSaveRuntime = {
    create: createBaseCharEditorSaveRuntime
  };
})();
