(function () {
  const schemaLib = () => window.LayoutSchemaLib;

  function renderLayout(container, layout, runtime) {
    if (!container || !layout) return;
    const normalized = schemaLib().normalizeScreenLayout(layout);
    container.innerHTML = "";
    container.style.position = "relative";
    container.style.width = `${normalized.canvas.width}px`;
    container.style.height = `${normalized.canvas.height}px`;
    const fragment = document.createDocumentFragment();
    normalized.nodes
      .filter(node => node.visible !== false)
      .sort((a, b) => a.z - b.z)
      .forEach(node => {
        const element = renderNode(node, runtime);
        if (element) fragment.appendChild(element);
      });
    container.appendChild(fragment);
  }

  function renderNode(node, runtime) {
    switch (node.type) {
      case "image":
        return renderImageNode(node, runtime);
      case "text":
        return renderTextNode(node, runtime);
      case "button":
      case "gacha-button":
        return renderButtonNode(node, runtime);
      case "currency":
      case "character-slot":
      case "battle-party":
      case "list":
        return renderGameNode(node, runtime);
      case "group":
      default:
        return null;
    }
  }

  function renderImageNode(node, runtime) {
    const element = document.createElement("div");
    element.className = "layout-node layout-node-image";
    applyNodeFrame(element, node);
    const image = document.createElement("img");
    image.alt = "";
    image.src = runtime.resolveAsset(node.assetId);
    image.style.width = "100%";
    image.style.height = "100%";
    image.style.objectFit = node.fit || "cover";
    image.style.borderRadius = node.maskRadius ? `${node.maskRadius}px` : "";
    element.appendChild(image);
    return element;
  }

  function renderTextNode(node, runtime) {
    const element = document.createElement("div");
    element.className = `layout-node layout-node-text layout-text-${node.textRole || "body"}`;
    applyNodeFrame(element, node);
    applyNodeSkin(element, node, runtime);
    element.textContent = node.showText === false ? "" : resolveTemplateText(node.text || "", runtime);
    if (node.fontFamily) element.style.fontFamily = node.fontFamily;
    if (node.fontSize) element.style.fontSize = `${node.fontSize}px`;
    if (node.fontWeight) element.style.fontWeight = String(node.fontWeight);
    if (node.color) element.style.color = node.color;
    if (node.align) element.style.textAlign = node.align;
    return element;
  }

  function renderButtonNode(node, runtime) {
    const element = document.createElement("button");
    element.type = "button";
    element.className = `layout-node layout-node-button layout-button-${node.variant || "primary"}`;
    applyNodeFrame(element, node);
    applyNodeSkin(element, node, runtime);
    element.textContent = node.showText === false ? "" : (node.label || node.text || "Button");
    element.addEventListener("click", event => runtime.dispatchAction(node.action, event));
    return element;
  }

  function renderGameNode(node, runtime) {
    const element = document.createElement("div");
    element.className = `layout-node layout-node-game layout-node-${node.type}`;
    applyNodeFrame(element, node);
    const bound = runtime.resolveBind(node.bind);
    if (node.type === "currency") {
      const key = String(node.bind || "").split(".").pop() || "generic";
      element.classList.add(`layout-currency-${key}`);
      applyNodeSkin(element, node, runtime);
      element.innerHTML = `
        <span class="layout-currency-dot" aria-hidden="true"></span>
        <span class="layout-currency-value">${escapeMarkup(bound?.value || bound || "")}</span>
      `;
      if (node.showText === false) element.innerHTML = "";
      return element;
    }
    if (node.type === "character-slot") {
      const image = document.createElement("img");
      image.alt = "";
      image.src = bound?.image || runtime.resolveAsset(node.assetId);
      image.style.width = "100%";
      image.style.height = "100%";
      image.style.objectFit = "contain";
      element.appendChild(image);
      return element;
    }
    if (node.type === "list") {
      if (node.variant === "home-event-banner") {
        return renderHomeEventNode(element, bound, node, runtime);
      }
      if (node.variant === "speech-bubble" || node.variant === "speech-bubble-left") {
        return renderSpeechBubbleNode(element, bound, node, runtime);
      }
      element.textContent = Array.isArray(bound) ? `${bound.length} items` : "";
      return element;
    }
    element.textContent = typeof bound === "string" ? bound : node.bind || node.type;
    return element;
  }

  function applyNodeFrame(element, node) {
    element.dataset.nodeId = node.id || "";
    element.style.position = "absolute";
    element.style.left = `${node.x}px`;
    element.style.top = `${node.y}px`;
    element.style.width = `${node.w}px`;
    element.style.height = `${node.h}px`;
    element.style.zIndex = String(node.z);
    element.style.opacity = String(node.opacity ?? 1);
    if (node.rotation) {
      element.style.transform = `rotate(${node.rotation}deg)`;
      element.style.transformOrigin = "center center";
    }
  }

  function resolveTemplateText(text, runtime) {
    if (!text || !runtime || typeof runtime.resolveBind !== "function") return text || "";
    return String(text).replace(/\{([^}]+)\}/g, (_, key) => {
      const value = runtime.resolveBind(String(key || "").trim());
      return value === null || value === undefined ? "" : String(value);
    });
  }

  function renderHomeEventNode(element, bound, node, runtime) {
    element.classList.add("layout-variant-home-event-banner");
    applyNodeSkin(element, node, runtime);
    if (!bound?.title && !bound?.subtitle) {
      element.hidden = true;
      return element;
    }
    if (node.showText === false) return element;
    element.innerHTML = `
      <div class="layout-home-event-tag">${escapeMarkup(bound?.tag || "EVENT")}</div>
      <div class="layout-home-event-body">
        <p class="layout-home-event-title">${escapeMarkup(bound?.title || "")}</p>
        <p class="layout-home-event-subtitle">${escapeMarkup(bound?.subtitle || "")}</p>
      </div>
    `;
    return element;
  }

  function renderSpeechBubbleNode(element, bound, node, runtime) {
    element.classList.add("layout-variant-speech-bubble");
    applyNodeSkin(element, node, runtime);
    if (node.variant === "speech-bubble-left") {
      element.classList.add("layout-variant-speech-left");
    }
    if (!bound?.text) {
      element.hidden = true;
      return element;
    }
    if (node.showText === false) return element;
    element.innerHTML = `
      <p class="layout-speech-name">${escapeMarkup(bound?.name || "")}</p>
      <p class="layout-speech-text">${escapeMarkup(bound?.text || "")}</p>
      <span class="layout-speech-arrow" aria-hidden="true"></span>
    `;
    return element;
  }

  function escapeMarkup(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function applyNodeSkin(element, node, runtime) {
    const asset = runtime?.resolveAsset?.(node.assetId);
    if (!asset) return;
    element.classList.add("layout-node-skinned");
    element.style.backgroundImage = `url("${String(asset).replace(/"/g, '\\"')}")`;
    element.style.backgroundSize = "100% 100%";
    element.style.backgroundRepeat = "no-repeat";
    element.style.backgroundPosition = "center";
  }

  window.LayoutRendererLib = {
    renderLayout,
    renderNode,
    applyNodeFrame
  };
})();
