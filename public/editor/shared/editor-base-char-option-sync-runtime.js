(function () {
  function createEditorBaseCharOptionSyncRuntime(deps) {
    const {
      getBaseChars,
      getCharacters,
      getStories,
      getEditState,
      getStoryEditor,
      getRarityLabel,
      esc
    } = deps;

    function populateBaseCharSelects() {
      const baseChars = getBaseChars?.() || [];
      const characters = getCharacters?.() || [];
      const stories = getStories?.() || [];

      const cardSelect = document.getElementById("card-base-char-select");
      if (cardSelect) {
        const currentValue = cardSelect.value;
        cardSelect.innerHTML = '<option value="">-- ベースキャラを選択 --</option>' +
          baseChars.map(baseChar => `<option value="${esc(baseChar.id)}">${esc(baseChar.name)}</option>`).join("");
        cardSelect.value = currentValue;
      }

      document.querySelectorAll("select[name='scene-character-id']").forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">キャラを選択</option>' +
          baseChars.map(baseChar => `<option value="${esc(baseChar.id)}">${esc(baseChar.name)}</option>`).join("");
        if (!select.querySelector('option[value="__player__"]')) {
          select.insertAdjacentHTML("afterbegin", '<option value="__player__">プレイヤー</option>');
        }
        select.value = currentValue;
      });

      const storyCardSelect = document.getElementById("story-character-select");
      if (storyCardSelect) {
        const currentValue = storyCardSelect.value;
        storyCardSelect.innerHTML = '<option value="">カードを選択</option>' +
          characters.map(char => `<option value="${esc(char.id)}">${esc(getRarityLabel(char.rarity))} ${esc(char.name)}</option>`).join("");
        storyCardSelect.value = currentValue;
      }

      const editState = getEditState?.() || {};
      const currentAssignments = editState.storyId
        ? (stories.find(story => story.id === editState.storyId)?.variantAssignments || [])
        : getStoryEditor?.()?.collectStoryVariantAssignments?.() || [];
      getStoryEditor?.()?.renderStoryVariantDefaults?.(currentAssignments);

      document.querySelectorAll("#home-opinion-list select[name='home-opinion-target'], #home-conversation-list select[name='home-conversation-target'], #home-birthday-list select[name='home-birthday-target'], #card-home-opinion-list select[name='card-home-opinion-target'], #card-home-conversation-list select[name='card-home-conversation-target'], #card-home-birthday-list select[name='card-home-birthday-target']").forEach(select => {
        const currentValue = select.value;
        const placeholder = select.name.endsWith("birthday-target") ? "誕生日対象を選択" : "対象を選択";
        select.innerHTML = `<option value="">${placeholder}</option>` +
          baseChars.map(baseChar => `<option value="${esc(baseChar.id)}">${esc(baseChar.name)}</option>`).join("");
        select.value = currentValue;
      });
    }

    return {
      populateBaseCharSelects
    };
  }

  window.SociaEditorBaseCharOptionSyncRuntime = {
    create: createEditorBaseCharOptionSyncRuntime
  };
})();
