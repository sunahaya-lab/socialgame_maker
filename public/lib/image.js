(function () {
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function replaceFileExtension(filename, nextExtension) {
    const name = String(filename || "asset").trim() || "asset";
    const base = name.replace(/\.[^.]+$/, "");
    return `${base}.${nextExtension}`;
  }

  function getStaticUsageMaxEdge(usageType) {
    switch (String(usageType || "").trim().toLowerCase()) {
      case "portrait":
      case "expression":
        return 1800;
      case "card":
      case "banner":
      case "background":
      case "generic":
      default:
        return 1600;
    }
  }

  async function loadImageBitmapLike(file) {
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(file);
      return {
        image: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        dispose: () => {
          if (typeof bitmap.close === "function") bitmap.close();
        }
      };
    }

    const objectUrl = URL.createObjectURL(file);
    try {
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to decode image."));
        img.src = objectUrl;
      });
      return {
        image,
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
        dispose: () => URL.revokeObjectURL(objectUrl)
      };
    } catch (error) {
      URL.revokeObjectURL(objectUrl);
      throw error;
    }
  }

  async function normalizeStaticImageFile(file, options = {}) {
    const quality = Math.min(Math.max(Number(options.quality) || 0.78, 0.1), 1);
    const maxEdge = Math.max(1, Number(options.maxEdge) || getStaticUsageMaxEdge(options.usageType));
    const source = await loadImageBitmapLike(file);

    try {
      const sourceWidth = Math.max(1, Number(source.width) || 1);
      const sourceHeight = Math.max(1, Number(source.height) || 1);
      const scale = Math.min(maxEdge / Math.max(sourceWidth, sourceHeight), 1);
      const width = Math.max(1, Math.round(sourceWidth * scale));
      const height = Math.max(1, Math.round(sourceHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas 2D context unavailable.");
      }
      context.clearRect(0, 0, width, height);
      context.drawImage(source.image, 0, 0, width, height);
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(result => {
          if (!result) {
            reject(new Error("WebP encode failed."));
            return;
          }
          resolve(result);
        }, "image/webp", quality);
      });

      return {
        blob,
        mimeType: "image/webp",
        width,
        height,
        sourceWidth,
        sourceHeight
      };
    } finally {
      source.dispose?.();
    }
  }

  async function uploadStaticImageAsset(file, options = {}) {
    const uploadUrl = String(options.uploadUrl || "").trim();
    if (!uploadUrl) {
      throw new Error("uploadUrl is required.");
    }

    const usageType = String(options.usageType || "generic").trim() || "generic";
    const kind = String(options.kind || "generic-image").trim() || "generic-image";
    const normalized = await normalizeStaticImageFile(file, {
      usageType,
      maxEdge: options.maxEdge,
      quality: options.quality
    });

    const normalizedFile = new File(
      [normalized.blob],
      replaceFileExtension(file.name || "asset", "webp"),
      { type: "image/webp" }
    );

    const formData = new FormData();
    formData.append("file", normalizedFile);
    formData.append("projectId", String(options.projectId || "").trim());
    formData.append("userId", String(options.userId || "").trim());
    formData.append("usageType", usageType);
    formData.append("kind", kind);
    formData.append("originalFilename", String(file.name || "").trim());
    formData.append("sourceMimeType", String(file.type || "").trim());
    formData.append("sourceByteSize", String(Number(file.size || 0)));
    formData.append("sourceWidth", String(normalized.sourceWidth));
    formData.append("sourceHeight", String(normalized.sourceHeight));
    formData.append("width", String(normalized.width));
    formData.append("height", String(normalized.height));

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
      credentials: "same-origin"
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const error = new Error(String(data?.error || response.status));
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return {
      asset: data?.asset || null,
      src: String(data?.asset?.src || data?.url || "").trim(),
      normalized
    };
  }

  function makeBaseCharFallback(name, color) {
    const safeName = escapeHtml(name);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="${color || "#a29bfe"}"/>
        <circle cx="100" cy="80" r="40" fill="rgba(255,255,255,0.2)"/>
        <rect x="60" y="130" width="80" height="50" rx="10" fill="rgba(255,255,255,0.15)"/>
        <text x="100" y="190" fill="white" font-size="16" font-family="Arial" text-anchor="middle">${safeName}</text>
      </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function makeFallbackImage(name, rarity, mode) {
    const rarityLib = window.RarityLib;
    const colors = rarityLib.getPaletteForRarity(rarity, mode);
    const safeName = escapeHtml(name);
    const rarityLabel = rarityLib.getRarityLabel(rarity, mode);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="${colors[0]}"/>
            <stop offset="50%" stop-color="${colors[1]}"/>
            <stop offset="100%" stop-color="${colors[2]}"/>
          </linearGradient>
        </defs>
        <rect width="300" height="400" fill="url(#g)"/>
        <circle cx="240" cy="60" r="60" fill="rgba(255,255,255,0.1)"/>
        <circle cx="60" cy="340" r="80" fill="rgba(255,255,255,0.06)"/>
        <text x="20" y="50" fill="white" font-size="24" font-weight="bold" font-family="Arial">${rarityLabel}</text>
        <text x="20" y="360" fill="white" font-size="22" font-family="Arial">${safeName}</text>
      </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  window.ImageLib = {
    escapeHtml,
    readFileAsDataUrl,
    normalizeStaticImageFile,
    uploadStaticImageAsset,
    makeBaseCharFallback,
    makeFallbackImage
  };
})();
