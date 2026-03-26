(function () {
  function createContentStateModule(deps) {
    const {
      clamp,
      normalizeRates,
      getRarityModeConfig,
      getRarityLabel
    } = deps;

    function normalizeCharacterRecord(char) {
      return {
        ...(char || {}),
        folderId: char?.folderId ? String(char.folderId).trim().slice(0, 80) : null,
        cropImages: normalizeCharacterCropImages(char?.cropImages || char?.autoCrops),
        cropPresets: normalizeCharacterCropPresets(char?.cropPresets),
        sdImages: normalizeCharacterSdImages(char?.sdImages),
        battleKit: normalizeCharacterBattleKit(char?.battleKit)
      };
    }

    function normalizeStoryRecord(story) {
      return {
        ...(story || {}),
        folderId: story?.folderId ? String(story.folderId).trim().slice(0, 80) : null,
        sortOrder: Math.max(0, Number(story?.sortOrder) || 0)
      };
    }

    function normalizeBirthday(value) {
      const text = String(value || "").trim();
      if (!text) return "";
      const match = text.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
      if (!match) return "";
      const month = Math.min(Math.max(Number(match[1]) || 0, 1), 12);
      const day = Math.min(Math.max(Number(match[2]) || 0, 1), 31);
      return `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
    }

    function normalizeCharacterCropImages(cropImages) {
      const source = cropImages && typeof cropImages === "object" ? cropImages : {};
      return {
        icon: sanitizeCharacterImageSource(source.icon),
        formationPortrait: sanitizeCharacterImageSource(source.formationPortrait),
        formationWide: sanitizeCharacterImageSource(source.formationWide),
        cutin: sanitizeCharacterImageSource(source.cutin)
      };
    }

    function getDefaultCharacterCropPreset() {
      return { offsetX: 0, offsetY: 0, zoom: 1 };
    }

    function normalizeCharacterCropPresets(cropPresets) {
      const source = cropPresets && typeof cropPresets === "object" ? cropPresets : {};
      return {
        icon: normalizeCharacterCropPresetItem(source.icon),
        formationPortrait: normalizeCharacterCropPresetItem(source.formationPortrait),
        formationWide: normalizeCharacterCropPresetItem(source.formationWide),
        cutin: normalizeCharacterCropPresetItem(source.cutin)
      };
    }

    function normalizeCharacterCropPresetItem(value) {
      const source = value && typeof value === "object" ? value : {};
      return {
        offsetX: clamp(source.offsetX, -1, 1),
        offsetY: clamp(source.offsetY, -1, 1),
        zoom: clamp(source.zoom || 1, 0.7, 2.5)
      };
    }

    function sanitizeCharacterImageSource(value) {
      const text = String(value || "").trim();
      if (!text) return "";
      if (text.startsWith("data:image/")) return text;
      if (/^https:\/\//i.test(text)) return text;
      return "";
    }

    function normalizeCharacterSdImages(sdImages) {
      const source = sdImages && typeof sdImages === "object" ? sdImages : {};
      return {
        idle: sanitizeCharacterImageSource(source.idle),
        attack: sanitizeCharacterImageSource(source.attack),
        damaged: sanitizeCharacterImageSource(source.damaged)
      };
    }

    function getDefaultCharacterBattleKit() {
      return {
        hp: 1000,
        atk: 100,
        normalSkill: { name: "", recast: 0, parts: [] },
        activeSkill: { name: "", parts: [] },
        passiveSkill: { name: "", parts: [] },
        linkSkill: { name: "", parts: [] },
        specialSkill: { name: "", parts: [] }
      };
    }

    function normalizeCharacterBattleKit(battleKit) {
      const source = battleKit && typeof battleKit === "object" ? battleKit : {};
      return {
        hp: Math.max(0, Number(source.hp) || 1000),
        atk: Math.max(0, Number(source.atk) || 100),
        normalSkill: normalizeCharacterSkillConfig(source.normalSkill),
        activeSkill: normalizeCharacterSkillConfig(source.activeSkill),
        passiveSkill: normalizeCharacterSkillConfig(source.passiveSkill),
        linkSkill: normalizeCharacterSkillConfig(source.linkSkill),
        specialSkill: normalizeCharacterSkillConfig(source.specialSkill)
      };
    }

    function normalizeCharacterSkillConfig(skill) {
      const source = skill && typeof skill === "object" ? skill : {};
      return {
        name: String(source.name || "").trim().slice(0, 60),
        recast: Math.max(0, Number(source.recast) || 0),
        parts: Array.isArray(source.parts)
          ? source.parts.slice(0, 12).map(normalizeCharacterSkillPart).filter(part => part.type || part.magnitude || part.detail)
          : []
      };
    }

    function normalizeCharacterSkillPart(part) {
      const source = part && typeof part === "object" ? part : {};
      return {
        type: String(source.type || "").trim().slice(0, 30),
        magnitude: String(source.magnitude || "").trim().slice(0, 20),
        detail: String(source.detail || "").trim().slice(0, 60)
      };
    }

    function getCharacterImageForUsage(char, usage = "default") {
      if (!char) return "";
      const cropImages = normalizeCharacterCropImages(char.cropImages);
      if (usage === "icon") return cropImages.icon || char.image || "";
      if (usage === "formationPortrait") return cropImages.formationPortrait || char.image || "";
      if (usage === "formationWide") return cropImages.formationWide || char.image || "";
      if (usage === "cutin") return cropImages.cutin || char.image || "";
      return char.image || "";
    }

    function getCharacterBattleVisual(char, state = "idle", config = null) {
      if (!char) return "";
      if (config?.battleVisualMode === "sdCharacter") {
        const sdImages = normalizeCharacterSdImages(char.sdImages);
        if (state === "attack") return sdImages.attack || sdImages.idle || char.image || "";
        if (state === "damaged") return sdImages.damaged || sdImages.idle || char.image || "";
        return sdImages.idle || char.image || "";
      }
      return char.image || "";
    }

    function buildStorySummary(story) {
      const firstScene = story.scenes?.find(scene => scene.text)?.text || "";
      return firstScene ? firstScene.slice(0, 60) : "No scenes yet.";
    }

    function buildGachaRateSummary(rates = {}) {
      const normalized = normalizeRates(rates);
      return getRarityModeConfig().tiers
        .map(tier => `${getRarityLabel(tier.value)} ${normalized[tier.value] || 0}%`)
        .join(" / ");
    }

    function getBaseCharById(baseChars, id) {
      return (Array.isArray(baseChars) ? baseChars : []).find(baseChar => baseChar.id === id) || null;
    }

    function findCharacterImageByName(characters, name) {
      return (Array.isArray(characters) ? characters : []).find(char => char.name === name)?.image || "";
    }

    function getStoryVariantName(story, characterId) {
      if (!story?.variantAssignments?.length || !characterId) return "";
      return story.variantAssignments.find(item => item.characterId === characterId)?.variantName || "";
    }

    function resolveScenePortrait(story, baseChar, scene) {
      if (!baseChar) return "";
      if (scene?.variantName && baseChar.variants?.length) {
        const variant = baseChar.variants.find(item => item.name === scene.variantName);
        if (variant?.image) return variant.image;
      }
      const defaultVariantName = getStoryVariantName(story, baseChar.id);
      if (defaultVariantName && baseChar.variants?.length) {
        const variant = baseChar.variants.find(item => item.name === defaultVariantName);
        if (variant?.image) return variant.image;
      }
      return baseChar.portrait || "";
    }

    async function generateCharacterCropAssets(imageSrc, cropPresets = null) {
      const normalizedPresets = normalizeCharacterCropPresets(cropPresets);
      if (!imageSrc) {
        return {
          cropImages: normalizeCharacterCropImages(null),
          cropPresets: normalizedPresets
        };
      }

      try {
        const image = await loadImageElement(imageSrc);
        const faceBox = await detectPrimaryFaceBox(image);
        const rects = buildCharacterCropRects(
          image.naturalWidth || image.width,
          image.naturalHeight || image.height,
          faceBox,
          normalizedPresets
        );
        const entries = await Promise.all(
          Object.entries(rects).map(async ([key, config]) => ([
            key,
            await renderCropDataUrl(image, config.rect, config.outputWidth, config.outputHeight)
          ]))
        );
        return {
          cropImages: normalizeCharacterCropImages(Object.fromEntries(entries)),
          cropPresets: normalizedPresets
        };
      } catch (error) {
        console.warn("Failed to auto-generate character crop images:", error);
        return {
          cropImages: normalizeCharacterCropImages(null),
          cropPresets: normalizedPresets
        };
      }
    }

    async function generateCharacterCropImages(imageSrc, cropPresets = null) {
      const assets = await generateCharacterCropAssets(imageSrc, cropPresets);
      return assets.cropImages;
    }

    function loadImageElement(src) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Image load failed."));
        image.src = src;
      });
    }

    async function detectPrimaryFaceBox(image) {
      if (typeof window === "undefined" || typeof window.FaceDetector !== "function") return null;

      try {
        const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
        const faces = await detector.detect(image);
        const box = faces?.[0]?.boundingBox;
        if (!box) return null;
        return {
          x: Number(box.x) || 0,
          y: Number(box.y) || 0,
          width: Number(box.width) || 0,
          height: Number(box.height) || 0
        };
      } catch (error) {
        console.warn("Face detection unavailable, falling back to center crop:", error);
        return null;
      }
    }

    function buildCharacterCropRects(imageWidth, imageHeight, faceBox, cropPresets) {
      const width = Math.max(1, Number(imageWidth) || 1);
      const height = Math.max(1, Number(imageHeight) || 1);
      const face = normalizeFaceBox(faceBox, width, height);
      const presets = normalizeCharacterCropPresets(cropPresets);

      const iconBaseWidth = Math.min(width, height) * 0.9;
      const baseIcon = face
        ? createCropRect(
          width,
          height,
          face.x + (face.width / 2),
          face.y + (face.height * 1.02),
          iconBaseWidth,
          1
        )
        : createCropRect(width, height, width * 0.5, height * 0.4, iconBaseWidth, 1);

      const baseFormationPortrait = face
        ? createCropRect(width, height, face.x + (face.width / 2), face.y + (face.height * 1.14), Math.max(face.width * 3, width * 0.34), 4 / 5)
        : createCropRect(width, height, width * 0.5, height * 0.44, Math.min(width * 0.6, height * 0.82), 4 / 5);

      const baseFormationWide = face
        ? createCropRect(width, height, face.x + (face.width / 2), face.y + (face.height * 1.08), Math.max(face.width * 4.8, width * 0.6), 16 / 9)
        : createCropRect(width, height, width * 0.5, height * 0.42, width * 0.82, 16 / 9);

      const baseCutin = face
        ? createCropRect(width, height, face.x + (face.width * 0.9), face.y + (face.height * 0.92), Math.max(face.width * 6.4, width * 0.86), 21 / 9)
        : createCropRect(width, height, width * 0.58, height * 0.42, width * 0.92, 21 / 9);

      return {
        icon: { rect: applyCharacterCropPreset(baseIcon, presets.icon, width, height), outputWidth: 256, outputHeight: 256 },
        formationPortrait: { rect: applyCharacterCropPreset(baseFormationPortrait, presets.formationPortrait, width, height), outputWidth: 480, outputHeight: 600 },
        formationWide: { rect: applyCharacterCropPreset(baseFormationWide, presets.formationWide, width, height), outputWidth: 960, outputHeight: 540 },
        cutin: { rect: applyCharacterCropPreset(baseCutin, presets.cutin, width, height), outputWidth: 1260, outputHeight: 540 }
      };
    }

    function applyCharacterCropPreset(baseRect, preset, imageWidth, imageHeight) {
      const safePreset = normalizeCharacterCropPresetItem(preset);
      const zoom = safePreset.zoom || 1;
      const width = clamp(baseRect.width / zoom, 1, imageWidth);
      const height = clamp(baseRect.height / zoom, 1, imageHeight);
      const maxShiftX = Math.max(0, (baseRect.width - width) * 0.5 + (baseRect.width * 0.2));
      const maxShiftY = Math.max(0, (baseRect.height - height) * 0.5 + (baseRect.height * 0.2));
      const centerX = baseRect.x + (baseRect.width / 2) + (safePreset.offsetX * maxShiftX);
      const centerY = baseRect.y + (baseRect.height / 2) + (safePreset.offsetY * maxShiftY);
      return {
        x: Math.round(clamp(centerX - (width / 2), 0, imageWidth - width)),
        y: Math.round(clamp(centerY - (height / 2), 0, imageHeight - height)),
        width: Math.round(width),
        height: Math.round(height)
      };
    }

    function normalizeFaceBox(faceBox, imageWidth, imageHeight) {
      if (!faceBox || !Number.isFinite(faceBox.width) || !Number.isFinite(faceBox.height)) return null;
      const width = clamp(faceBox.width, 1, imageWidth);
      const height = clamp(faceBox.height, 1, imageHeight);
      const x = clamp(faceBox.x, 0, imageWidth - width);
      const y = clamp(faceBox.y, 0, imageHeight - height);
      return { x, y, width, height };
    }

    function createCropRect(imageWidth, imageHeight, centerX, centerY, desiredWidth, aspectRatio) {
      const safeAspect = aspectRatio > 0 ? aspectRatio : 1;
      let width = Math.max(1, Number(desiredWidth) || 1);
      let height = width / safeAspect;
      const fitScale = Math.min(imageWidth / width, imageHeight / height, 1);
      width *= fitScale;
      height *= fitScale;

      const x = clamp(centerX - (width / 2), 0, imageWidth - width);
      const y = clamp(centerY - (height / 2), 0, imageHeight - height);
      return {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height)
      };
    }

    async function renderCropDataUrl(image, rect, outputWidth, outputHeight) {
      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas 2D context is unavailable.");
      }
      context.drawImage(image, rect.x, rect.y, rect.width, rect.height, 0, 0, outputWidth, outputHeight);
      const webp = canvas.toDataURL("image/webp", 0.9);
      return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", 0.9);
    }

    return {
      normalizeCharacterRecord,
      normalizeStoryRecord,
      normalizeBirthday,
      normalizeCharacterCropImages,
      getDefaultCharacterCropPreset,
      normalizeCharacterCropPresets,
      normalizeCharacterCropPresetItem,
      sanitizeCharacterImageSource,
      normalizeCharacterSdImages,
      getDefaultCharacterBattleKit,
      normalizeCharacterBattleKit,
      normalizeCharacterSkillConfig,
      normalizeCharacterSkillPart,
      getCharacterImageForUsage,
      getCharacterBattleVisual,
      buildStorySummary,
      buildGachaRateSummary,
      getBaseCharById,
      findCharacterImageByName,
      getStoryVariantName,
      resolveScenePortrait,
      generateCharacterCropAssets,
      generateCharacterCropImages,
      loadImageElement,
      detectPrimaryFaceBox,
      buildCharacterCropRects,
      renderCropDataUrl
    };
  }

  window.ContentStateLib = {
    create: createContentStateModule
  };
})();
