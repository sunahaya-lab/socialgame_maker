(function () {
  const CHARACTER_SPEECH_SOUND_OPTIONS = [
    { id: "", label: "なし" },
    { id: "soft", label: "ソフト" },
    { id: "bright", label: "ブライト" },
    { id: "cute", label: "キュート" },
    { id: "digital", label: "デジタル" },
    { id: "calm", label: "カーム" }
  ];
  const CHARACTER_SPEECH_SOUND_SET = new Set(CHARACTER_SPEECH_SOUND_OPTIONS.map(item => item.id));
  let speechAudioContext = null;

  function normalizeCharacterSpeechSoundId(value) {
    const normalized = String(value || "").trim();
    return CHARACTER_SPEECH_SOUND_SET.has(normalized) ? normalized : "";
  }

  function getCharacterSpeechSoundOptions() {
    return CHARACTER_SPEECH_SOUND_OPTIONS.slice();
  }

  function getSpeechAudioContext() {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    if (!speechAudioContext) speechAudioContext = new AudioContextCtor();
    return speechAudioContext;
  }

  function getCharacterSpeechPattern(soundId) {
    switch (normalizeCharacterSpeechSoundId(soundId)) {
      case "soft":
        return { type: "triangle", tones: [[620, 0, 0.045, 0.045], [780, 0.05, 0.05, 0.035]] };
      case "bright":
        return { type: "square", tones: [[980, 0, 0.035, 0.05], [1240, 0.04, 0.035, 0.04]] };
      case "cute":
        return { type: "sine", tones: [[880, 0, 0.04, 0.05], [1175, 0.045, 0.04, 0.045], [1400, 0.09, 0.03, 0.03]] };
      case "digital":
        return { type: "sawtooth", tones: [[720, 0, 0.025, 0.035], [1080, 0.028, 0.025, 0.03], [820, 0.06, 0.025, 0.025]] };
      case "calm":
        return { type: "triangle", tones: [[540, 0, 0.06, 0.04], [660, 0.07, 0.06, 0.03]] };
      default:
        return null;
    }
  }

  function playCharacterSpeechSound(soundId, options = {}) {
    const pattern = getCharacterSpeechPattern(soundId);
    if (!pattern) return false;
    const context = getSpeechAudioContext();
    if (!context) return false;

    const targetVolume = Math.max(0, Math.min(1, Number(options.volume ?? 1)));
    if (targetVolume <= 0) return false;
    if (context.state === "suspended") context.resume().catch(() => {});

    const master = context.createGain();
    master.gain.value = Math.min(0.18, 0.18 * targetVolume);
    master.connect(context.destination);

    const now = context.currentTime + 0.005;
    let totalDuration = 0.14;
    pattern.tones.forEach(([frequency, offset, duration, gain]) => {
      const osc = context.createOscillator();
      const amp = context.createGain();
      const start = now + offset;
      const end = start + duration;
      totalDuration = Math.max(totalDuration, offset + duration + 0.05);

      osc.type = pattern.type;
      osc.frequency.setValueAtTime(frequency, start);
      amp.gain.setValueAtTime(0.0001, start);
      amp.gain.linearRampToValueAtTime(gain, start + Math.min(0.012, duration * 0.35));
      amp.gain.exponentialRampToValueAtTime(0.0001, end);

      osc.connect(amp);
      amp.connect(master);
      osc.start(start);
      osc.stop(end + 0.01);
    });

    window.setTimeout(() => {
      try {
        master.disconnect();
      } catch {}
    }, Math.ceil(totalDuration * 1000) + 80);
    return true;
  }

  function setupBaseCharEditor(deps) {
    const api = createBaseCharEditor(deps);

    api.renderCharacterSpeechSoundOptions();
    document.getElementById("base-char-form").addEventListener("submit", api.handleBaseCharSubmit);
    document.getElementById("add-expression-btn").addEventListener("click", () => api.addExpressionInput());
    document.getElementById("add-variant-btn").addEventListener("click", () => api.addVariantInput());
    document.getElementById("add-home-opinion-btn").addEventListener("click", () => api.addHomeOpinionInput());
    document.getElementById("add-home-conversation-btn").addEventListener("click", () => api.addHomeConversationInput());
    document.getElementById("add-home-birthday-btn").addEventListener("click", () => api.addHomeBirthdayInput());

    return api;
  }

  function createBaseCharEditor(deps) {
    const baseCharText = window.BaseCharEditorTextLib || null;
    const text = (key, fallback = "") => baseCharText?.get?.(key, fallback) || fallback;
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
      updateEditorSubmitLabels,
      renderBaseCharList,
      populateBaseCharSelects,
      renderVoiceLineFields,
      collectVoiceLineFields,
      baseCharVoiceLineDefs,
      baseCharHomeVoiceDefs,
      esc
    } = deps;

    const fieldsApi = window.BaseCharEditorFieldsRuntime?.create?.({
      getBaseChars,
      getEditState,
      normalizeCharacterSpeechSoundId,
      getCharacterSpeechSoundOptions,
      renderVoiceLineFields,
      collectVoiceLineFields,
      baseCharVoiceLineDefs,
      baseCharHomeVoiceDefs,
      text,
      esc
    }) || null;
    const expressionApi = window.BaseCharEditorExpressionRuntime?.create?.({
      readFileAsDataUrl,
      resolveStaticImage,
      text,
      esc
    }) || null;
    const saveApi = window.BaseCharEditorSaveRuntime?.create?.({
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
      resetBaseCharForm: () => fieldsApi?.resetBaseCharForm?.({
        updateEditorSubmitLabels,
      }),
      text,
    }) || null;

    async function resolveStaticImage(file, options = {}, fallback = "") {
      return saveApi?.resolveStaticImage?.(file, options, fallback);
    }

    async function handleBaseCharSubmit(e) {
      return saveApi?.handleBaseCharSubmit?.(e);
    }


    function beginBaseCharEdit(id) {
      return fieldsApi?.beginBaseCharEdit?.(id, {
        addVariantInput,
        addExpressionInput,
        updateEditorSubmitLabels,
      });
    }

    function resetBaseCharForm() {
      return fieldsApi?.resetBaseCharForm?.({
        updateEditorSubmitLabels,
      });
    }

    function deleteBaseChar(id) {
      const next = getBaseChars().filter(item => item.id !== id);
      setBaseChars(next);
      saveLocal("socia-base-chars", next);
      if (getEditState().baseCharId === id) resetBaseCharForm();
      renderBaseCharList();
      populateBaseCharSelects();
      showToast(text("deleted", "ベースキャラを削除しました。"));
    }

    function renderBaseCharVoiceLineFields(values = {}) {
      return fieldsApi?.renderBaseCharVoiceLineFields?.(values);
    }

    function renderCharacterSpeechSoundOptions(selectedValue = "") {
      return fieldsApi?.renderCharacterSpeechSoundOptions?.(selectedValue);
    }

    function collectBaseCharVoiceLines() {
      return fieldsApi?.collectBaseCharVoiceLines?.() || {};
    }

    function renderBaseCharHomeVoiceLineFields(values = {}) {
      return fieldsApi?.renderBaseCharHomeVoiceLineFields?.(values);
    }

    function collectBaseCharHomeVoiceLines() {
      return fieldsApi?.collectBaseCharHomeVoiceLines?.() || {};
    }

    function addExpressionInput(expr = null) {
      return expressionApi?.addExpressionInput?.(expr);
    }

    function addVariantInput(variant = null) {
      return expressionApi?.addVariantInput?.(variant);
    }

    function addHomeOpinionInput(item = null) {
      return fieldsApi?.addHomeOpinionInput?.(item);
    }

    function addHomeConversationInput(item = null) {
      return fieldsApi?.addHomeConversationInput?.(item);
    }

    function addHomeBirthdayInput(item = null) {
      return fieldsApi?.addHomeBirthdayInput?.(item);
    }

    async function collectExpressions() {
      return expressionApi?.collectExpressions?.() || [];
    }

    async function collectVariants() {
      return expressionApi?.collectVariants?.() || [];
    }

    function collectHomeOpinions() {
      return fieldsApi?.collectHomeOpinions?.() || [];
    }

    function collectHomeConversations() {
      return fieldsApi?.collectHomeConversations?.() || [];
    }

    function collectHomeBirthdays() {
      return fieldsApi?.collectHomeBirthdays?.() || [];
    }

    function ensureCheckMark(fileInput) {
      return expressionApi?.ensureCheckMark?.(fileInput);
    }

    return {
      handleBaseCharSubmit,
      beginBaseCharEdit,
      resetBaseCharForm,
      deleteBaseChar,
      renderCharacterSpeechSoundOptions,
      renderBaseCharVoiceLineFields,
      collectBaseCharVoiceLines,
      renderBaseCharHomeVoiceLineFields,
      collectBaseCharHomeVoiceLines,
      collectExpressions,
      collectVariants,
      addExpressionInput,
      addVariantInput,
      addHomeOpinionInput,
      addHomeConversationInput,
      addHomeBirthdayInput,
      collectHomeOpinions,
      collectHomeConversations,
      collectHomeBirthdays
    };
  }

  window.BaseCharEditor = {
    setupBaseCharEditor,
    createBaseCharEditor,
    getCharacterSpeechSoundOptions,
    normalizeCharacterSpeechSoundId,
    playCharacterSpeechSound
  };
})();
