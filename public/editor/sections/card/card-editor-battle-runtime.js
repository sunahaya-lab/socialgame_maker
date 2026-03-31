(function () {
  function createCardEditorBattleRuntime(deps) {
    const {
      text,
      esc,
      normalizeCharacterBattleKit,
      getFeatureAccess,
    } = deps;

    function ensureCharacterBattleEditor() {
      if (document.getElementById("character-battle-editor")) return;
      const anchor = document.getElementById("character-sd-editor") || document.getElementById("character-crop-editor") || document.getElementById("char-preview");
      if (!anchor) return;

      const section = document.createElement("section");
      section.id = "character-battle-editor";
      section.className = "character-battle-editor";
      section.innerHTML = `
        <details class="editor-collapsible character-collapsible">
          <summary>\u30d0\u30c8\u30eb\u8a2d\u5b9a</summary>
          <div class="character-battle-body">
            <div class="character-battle-header">
              <div>
                <p class="character-battle-help">${esc(text("battleHelp", "\u6226\u95d8\u306e\u57fa\u790e\u30c7\u30fc\u30bf\u3092\u7de8\u96c6\u3057\u307e\u3059\u3002\u30b9\u30ad\u30eb\u8aac\u660e\u306f\u5c0f\u3055\u3044\u9078\u629e\u30d1\u30fc\u30c4\u306e\u7d44\u307f\u5408\u308f\u305b\u306a\u306e\u3067\u3001\u5f8c\u304b\u3089\u9805\u76ee\u3092\u5897\u3084\u3057\u3084\u3059\u3044\u69cb\u9020\u3067\u3059\u3002"))}</p>
              </div>
            </div>
            <div class="character-battle-stats">
              <label>HP<input type="number" min="0" step="1" id="character-battle-hp" value="1000"></label>
              <label>ATK<input type="number" min="0" step="1" id="character-battle-atk" value="100"></label>
            </div>
            <div class="character-battle-skills" id="character-battle-skills"></div>
          </div>
        </details>
      `;
      anchor.after(section);

      const skillsWrap = section.querySelector("#character-battle-skills");
      [
        ["normalSkill", "\u901a\u5e38\u30b9\u30ad\u30eb"],
        ["activeSkill", "\u30a2\u30af\u30c6\u30a3\u30d6\u30b9\u30ad\u30eb"],
        ["passiveSkill", "\u30d1\u30c3\u30b7\u30d6\u30b9\u30ad\u30eb"],
        ["linkSkill", "\u30ea\u30f3\u30af\u30b9\u30ad\u30eb"],
        ["specialSkill", "\u5fc5\u6bba\u6280"]
      ].forEach(([key, label]) => {
        const block = document.createElement("div");
        block.className = "character-skill-block";
        block.innerHTML = `
          <div class="character-skill-head">
            <h5>${label}</h5>
            <button type="button" class="btn-secondary character-skill-add" data-skill-add="${key}">+ \u30d1\u30fc\u30c4</button>
          </div>
          <label class="character-skill-name">
            \u540d\u524d
            <input type="text" maxlength="60" data-skill-name="${key}">
          </label>
          <label class="character-skill-recast">
            \u30ea\u30ad\u30e3\u30b9\u30c8
            <input type="number" min="0" step="1" data-skill-recast="${key}" value="0">
          </label>
          <div class="character-skill-part-list" data-skill-parts="${key}"></div>
        `;
        skillsWrap.appendChild(block);
      });

      section.querySelectorAll("[data-skill-add]").forEach(button => {
        button.addEventListener("click", () => addCharacterSkillPartRow(button.dataset.skillAdd));
      });
    }

    function addCharacterSkillPartRow(skillKey, part = null) {
      const list = document.querySelector(`#character-battle-editor [data-skill-parts="${skillKey}"]`);
      if (!list) return;
      const row = document.createElement("div");
      row.className = "character-skill-part-row";
      row.innerHTML = `
        <select data-part-type>
          ${[
            ["", "-- type --"],
            ["physical", "Physical"],
            ["magic", "Magic"],
            ["heal", "Heal"],
            ["shield", "Shield"],
            ["buff", "Buff"],
            ["debuff", "Debuff"]
          ].map(([value, label]) => `<option value="${value}"${part?.type === value ? " selected" : ""}>${label}</option>`).join("")}
        </select>
        <select data-part-magnitude>
          ${[
            ["", "-- size --"],
            ["small", "Small"],
            ["medium", "Medium"],
            ["large", "Large"],
            ["xl", "XL"]
          ].map(([value, label]) => `<option value="${value}"${part?.magnitude === value ? " selected" : ""}>${label}</option>`).join("")}
        </select>
        <input type="text" maxlength="60" data-part-detail placeholder="Detail" value="${esc(part?.detail || "")}">
        <button type="button" class="expression-remove">Remove</button>
      `;
      row.querySelector(".expression-remove")?.addEventListener("click", () => row.remove());
      list.appendChild(row);
    }

    function collectCharacterBattleKit() {
      const hpInput = document.getElementById("character-battle-hp");
      const atkInput = document.getElementById("character-battle-atk");
      const getSkill = skillKey => ({
        name: document.querySelector(`#character-battle-editor [data-skill-name="${skillKey}"]`)?.value.trim() || "",
        recast: Number(document.querySelector(`#character-battle-editor [data-skill-recast="${skillKey}"]`)?.value || 0),
        parts: Array.from(document.querySelectorAll(`#character-battle-editor [data-skill-parts="${skillKey}"] .character-skill-part-row`)).map(row => ({
          type: row.querySelector("[data-part-type]")?.value || "",
          magnitude: row.querySelector("[data-part-magnitude]")?.value || "",
          detail: row.querySelector("[data-part-detail]")?.value.trim() || ""
        })).filter(part => part.type || part.magnitude || part.detail)
      });

      return normalizeCharacterBattleKit({
        hp: hpInput?.value,
        atk: atkInput?.value,
        normalSkill: getSkill("normalSkill"),
        activeSkill: getSkill("activeSkill"),
        passiveSkill: getSkill("passiveSkill"),
        linkSkill: getSkill("linkSkill"),
        specialSkill: getSkill("specialSkill")
      });
    }

    function populateCharacterBattleEditor(battleKit) {
      ensureCharacterBattleEditor();
      const normalized = normalizeCharacterBattleKit(battleKit);
      const hpInput = document.getElementById("character-battle-hp");
      const atkInput = document.getElementById("character-battle-atk");
      if (hpInput) hpInput.value = String(normalized.hp);
      if (atkInput) atkInput.value = String(normalized.atk);

      ["normalSkill", "activeSkill", "passiveSkill", "linkSkill", "specialSkill"].forEach(skillKey => {
        const skill = normalized[skillKey];
        const nameInput = document.querySelector(`#character-battle-editor [data-skill-name="${skillKey}"]`);
        const recastInput = document.querySelector(`#character-battle-editor [data-skill-recast="${skillKey}"]`);
        const list = document.querySelector(`#character-battle-editor [data-skill-parts="${skillKey}"]`);
        if (nameInput) nameInput.value = skill.name || "";
        if (recastInput) recastInput.value = String(skill.recast || 0);
        if (list) list.innerHTML = "";
        (skill.parts || []).forEach(part => addCharacterSkillPartRow(skillKey, part));
      });
    }

    function resetCharacterBattleEditor() {
      populateCharacterBattleEditor(null);
    }

    async function refreshBattlePackUi() {
      const section = document.getElementById("character-battle-editor");
      const note = document.getElementById("character-battle-pack-note");
      if (!section || !note || typeof getFeatureAccess !== "function") return;
      const access = await getFeatureAccess();
      const hasBattlePack = Boolean(access?.battle);
      note.hidden = hasBattlePack;
      note.textContent = hasBattlePack
        ? ""
        : "\u672a\u6240\u6301\u306e\u5834\u5408\u3001\u3053\u306e\u9805\u76ee\u306f\u30ed\u30fc\u30ab\u30eb\u4fdd\u5b58\u306e\u307f\u3067\u3059";
      section.classList.toggle("is-pack-locked", !hasBattlePack);
      section.querySelectorAll(".character-battle-body input, .character-battle-body select, .character-battle-body textarea, .character-battle-body button").forEach(control => {
        control.disabled = false;
      });
    }

    return {
      ensureCharacterBattleEditor,
      addCharacterSkillPartRow,
      collectCharacterBattleKit,
      populateCharacterBattleEditor,
      resetCharacterBattleEditor,
      refreshBattlePackUi,
    };
  }

  window.CardEditorBattleRuntime = {
    create: createCardEditorBattleRuntime
  };
})();
