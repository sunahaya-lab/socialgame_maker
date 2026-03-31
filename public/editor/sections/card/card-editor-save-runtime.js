(function () {
  function createCardEditorSaveRuntime(deps) {
    const {
      text,
      getCharacters,
      setCharacters,
      getEditState,
      getApi,
      getCharacterImageInput,
      isCharacterImageCleared,
      normalizeCharacterCropImages,
      normalizeCharacterCropPresets,
      normalizeCharacterSdImages,
      normalizeCharacterBattleKit,
      normalizeRarityValue,
      normalizeAttributeValue,
      getCharacterFolderSelect,
      resolveStaticImage,
      resolveCharacterCropAssets,
      collectCharacterSdImages,
      collectCardVoiceLines,
      collectCardHomeVoiceLines,
      collectCardHomeOpinions,
      collectCardHomeConversations,
      collectCardHomeBirthdays,
      upsertItem,
      saveLocal,
      postJSON,
      showToast,
      renderEditorCharacterList,
      renderGachaPoolChars,
      getEditingFeaturedIds,
      renderHome,
      resetCharacterForm,
    } = deps;

    async function buildCharacterPayload(form, existing) {
      const imageCleared = isCharacterImageCleared(form);
      const imageFile = getCharacterImageInput(form)?.files?.[0] || null;
      const image = imageCleared
        ? ""
        : imageFile
          ? await resolveStaticImage(imageFile, {
            usageType: "card",
            kind: "card-image"
          }, existing?.image || "")
          : (existing?.image || "");
      const cropAssets = image
        ? await resolveCharacterCropAssets(image, imageFile ? null : existing)
        : { cropImages: normalizeCharacterCropImages(null), cropPresets: normalizeCharacterCropPresets(null) };
      const sdImages = await collectCharacterSdImages(existing?.sdImages);
      const battleKit = null;
      const editingId = getEditState().characterId || null;

      return {
        id: editingId || crypto.randomUUID(),
        name: form.name.value.trim(),
        baseCharId: form.baseCharId.value || null,
        folderId: getCharacterFolderSelect(form)?.value || null,
        catch: form.catch.value.trim(),
        rarity: normalizeRarityValue(form.rarity.value),
        attribute: normalizeAttributeValue(form.attribute.value),
        image,
        cropImages: cropAssets.cropImages,
        cropPresets: cropAssets.cropPresets,
        sdImages,
        battleKit,
        lines: existing?.lines || [],
        voiceLines: collectCardVoiceLines(),
        homeVoices: collectCardHomeVoiceLines(),
        homeOpinions: collectCardHomeOpinions(),
        homeConversations: collectCardHomeConversations(),
        homeBirthdays: collectCardHomeBirthdays()
      };
    }

    function saveCharacterCollection(nextCharacter) {
      const currentCharacters = Array.isArray(getCharacters()) ? getCharacters() : [];
      const nextCharacters = currentCharacters.slice();
      upsertItem(nextCharacters, nextCharacter);
      setCharacters(nextCharacters);
      saveLocal("socia-characters", nextCharacters);
      return nextCharacters;
    }

    async function refreshAfterCharacterSave() {
      try {
        renderEditorCharacterList();
      } catch (error) {
        console.error("Failed to refresh character editor list:", error);
      }
      try {
        renderGachaPoolChars(getEditingFeaturedIds());
      } catch (error) {
        console.error("Failed to refresh gacha pool characters:", error);
      }
      try {
        renderHome();
      } catch (error) {
        console.error("Failed to refresh home after character save:", error);
      }
    }

    function getBillingSaveErrorMessage(error, fallback) {
      const code = String(error?.data?.code || "");
      const requiredPack = String(error?.data?.requiredPack || "").trim();
      if (code !== "billing_feature_required" || !requiredPack) return fallback;
      if (requiredPack === "battle") {
        return text("battlePackRequired", "このカードのバトル設定を保存するには Battle Pack が必要です。ローカルには保持されています。");
      }
      return `${requiredPack} が必要なため保存できませんでした。ローカルには保持されています。`;
    }

    async function handleCharacterSubmit(event) {
      event.preventDefault();
      const form = event.target;
      const currentCharacters = Array.isArray(getCharacters()) ? getCharacters() : [];
      const editingId = getEditState().characterId || null;
      const existing = editingId ? currentCharacters.find(item => item.id === editingId) : null;
      const nextChar = await buildCharacterPayload(form, existing);
      saveCharacterCollection(nextChar);
      try {
        await postJSON(getApi().characters, nextChar);
      } catch (error) {
        console.error("Failed to save character:", error);
        showToast(getBillingSaveErrorMessage(
          error,
          "カードの保存に失敗しました。ローカルには保持されています"
        ));
      }
      await refreshAfterCharacterSave();
      resetCharacterForm();
      showToast(`${nextChar.name}を${existing ? "更新" : "登録"}しました`);
    }

    return {
      buildCharacterPayload,
      saveCharacterCollection,
      refreshAfterCharacterSave,
      getBillingSaveErrorMessage,
      handleCharacterSubmit,
    };
  }

  window.CardEditorSaveRuntime = {
    create: createCardEditorSaveRuntime
  };
})();
