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
    makeBaseCharFallback,
    makeFallbackImage
  };
})();
