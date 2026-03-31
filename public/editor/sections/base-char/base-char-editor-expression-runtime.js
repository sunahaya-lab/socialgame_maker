(function () {
  function createBaseCharEditorExpressionRuntime(deps) {
    const {
      readFileAsDataUrl,
      resolveStaticImage,
      text,
      esc,
    } = deps;

    function ensureCheckMark(fileInput) {
      if (fileInput.closest("div")?.querySelector(".expr-set")) return;
      const mark = document.createElement("span");
      mark.className = "expr-set";
      mark.textContent = "\u2713";
      fileInput.closest("label")?.after(mark);
    }

    function addExpressionInput(expr = null) {
      const list = document.getElementById("expression-list");
      const item = document.createElement("div");
      item.className = "expression-item";
      item.innerHTML = `
        <input name="expr-name" type="text" maxlength="30" placeholder="${esc(text("expressionNamePlaceholder", "表情名"))}" value="${esc(expr?.name || "")}">
        <label class="upload-field expression-upload">
          <input name="expr-image" type="file" accept="image/*">
        </label>
        ${expr?.image ? '<span class="expr-set">&#x2713;</span>' : ""}
        <button type="button" class="expression-remove">&#x2715;</button>
      `;

      if (expr?.image) item.dataset.exprImage = expr.image;
      const fileInput = item.querySelector("[name='expr-image']");
      fileInput?.addEventListener("change", async () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        item.dataset.exprImage = await readFileAsDataUrl(file);
        ensureCheckMark(fileInput);
      });

      item.querySelector(".expression-remove")?.addEventListener("click", () => item.remove());
      list?.appendChild(item);
    }

    function addVariantInput(variant = null) {
      const list = document.getElementById("variant-list");
      const item = document.createElement("div");
      item.className = "expression-item";
      item.innerHTML = `
        <input name="variant-name" type="text" maxlength="30" placeholder="${esc(text("variantNamePlaceholder", "差分名"))}" value="${esc(variant?.name || "")}">
        <label class="upload-field expression-upload">
          <input name="variant-image" type="file" accept="image/*">
        </label>
        ${variant?.image ? '<span class="expr-set">&#x2713;</span>' : ""}
        <button type="button" class="expression-remove">&#x2715;</button>
      `;

      if (variant?.image) item.dataset.variantImage = variant.image;
      const fileInput = item.querySelector("[name='variant-image']");
      fileInput?.addEventListener("change", async () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        item.dataset.variantImage = await readFileAsDataUrl(file);
        ensureCheckMark(fileInput);
      });

      item.querySelector(".expression-remove")?.addEventListener("click", () => item.remove());
      list?.appendChild(item);
    }

    async function collectExpressions() {
      const items = document.querySelectorAll("#expression-list .expression-item");
      const expressions = [];
      for (const item of items) {
        const name = item.querySelector("[name='expr-name']")?.value.trim();
        if (!name) continue;
        const fileInput = item.querySelector("[name='expr-image']");
        let image = item.dataset.exprImage || "";
        if (fileInput?.files?.[0]) {
          image = await resolveStaticImage(fileInput.files[0], {
            usageType: "expression",
            kind: "base-character-expression"
          }, image);
        }
        expressions.push({ name, image });
      }
      return expressions;
    }

    async function collectVariants() {
      const items = document.querySelectorAll("#variant-list .expression-item");
      const variants = [];
      for (const item of items) {
        const name = item.querySelector("[name='variant-name']")?.value.trim();
        if (!name) continue;
        const fileInput = item.querySelector("[name='variant-image']");
        let image = item.dataset.variantImage || "";
        if (fileInput?.files?.[0]) {
          image = await resolveStaticImage(fileInput.files[0], {
            usageType: "portrait",
            kind: "base-character-variant"
          }, image);
        }
        variants.push({ name, image });
      }
      return variants;
    }

    return {
      ensureCheckMark,
      addExpressionInput,
      addVariantInput,
      collectExpressions,
      collectVariants,
    };
  }

  window.BaseCharEditorExpressionRuntime = {
    create: createBaseCharEditorExpressionRuntime
  };
})();
