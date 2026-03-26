(function () {
  const ORDER = ["炎", "雷", "風", "水", "地", "光", "闇", "無"];

  const META = {
    "炎": { value: "炎", key: "fire", color: "#e74c3c", iconText: "炎" },
    "雷": { value: "雷", key: "thunder", color: "#9b59ff", iconText: "雷" },
    "風": { value: "風", key: "wind", color: "#2ecc71", iconText: "風" },
    "水": { value: "水", key: "water", color: "#3498db", iconText: "水" },
    "地": { value: "地", key: "earth", color: "#e67e22", iconText: "地" },
    "光": { value: "光", key: "light", color: "#f1c40f", iconText: "光" },
    "闇": { value: "闇", key: "dark", color: "#4b3b6e", iconText: "闇" },
    "無": { value: "無", key: "none", color: "#7f8c8d", iconText: "無" }
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeAttribute(value) {
    return ORDER.includes(value) ? value : "無";
  }

  function getAttributeMeta(value) {
    return META[normalizeAttribute(value)];
  }

  function renderAttributeChip(value, options = {}) {
    const meta = getAttributeMeta(value);
    const classes = ["attribute-chip", `attribute-chip-${meta.key}`];
    if (options.compact) classes.push("attribute-chip-compact");
    if (options.className) classes.push(options.className);
    const label = escapeHtml(options.label || meta.value);
    const iconText = escapeHtml(options.iconText || meta.iconText);
    return `
      <span class="${classes.join(" ")}" data-attribute="${meta.value}">
        <span class="attribute-chip-icon" aria-hidden="true">${iconText}</span>
        <span class="attribute-chip-label">${label}</span>
      </span>
    `.trim();
  }

  window.AttributeLib = {
    ORDER,
    META,
    normalizeAttribute,
    getAttributeMeta,
    renderAttributeChip
  };
})();
