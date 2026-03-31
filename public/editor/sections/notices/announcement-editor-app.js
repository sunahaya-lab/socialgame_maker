(function () {
  const ANNOUNCEMENT_STATUS_SET = new Set(["draft", "scheduled", "published", "archived"]);
  const ANNOUNCEMENT_LINK_TYPE_SET = new Set(["none", "story", "gacha", "url"]);

  function setupAnnouncementEditor(deps) {
    const api = createAnnouncementEditor(deps);
    api.setupAnnouncementEditor();
    return api;
  }

  function createAnnouncementEditor(deps) {
    const announcementText = window.SociaAnnouncementEditorText || null;
    const text = (key, fallback = "") => announcementText?.get?.(key, fallback) || fallback;

    const {
      getAnnouncements,
      setAnnouncements,
      getEditState,
      getApi,
      readFileAsDataUrl,
      uploadStaticImageAsset,
      saveLocal,
      postJSON,
      showToast,
      upsertItem,
      renderHome,
      esc
    } = deps;

    function getAnnouncementForm() {
      return document.getElementById("announcement-form");
    }

    function normalizeAnnouncementStatus(value) {
      const normalized = String(value || "").trim();
      return ANNOUNCEMENT_STATUS_SET.has(normalized) ? normalized : "draft";
    }

    function normalizeAnnouncementLinkType(value) {
      const normalized = String(value || "").trim();
      return ANNOUNCEMENT_LINK_TYPE_SET.has(normalized) ? normalized : "none";
    }

    function toIsoDateTime(value) {
      const raw = String(value || "").trim();
      if (!raw) return "";
      const date = new Date(raw);
      return Number.isNaN(date.getTime()) ? "" : date.toISOString();
    }

    function toDateTimeInputValue(value) {
      const raw = String(value || "").trim();
      if (!raw) return "";
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) return "";
      const offsetMs = date.getTimezoneOffset() * 60 * 1000;
      return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
    }

    function formatPeriod(startAt, endAt) {
      const start = String(startAt || "").trim();
      const end = String(endAt || "").trim();
      if (!start && !end) return text("periodUnset", "期間指定なし");
      if (start && end) return `${formatDisplayDate(start)} 〜 ${formatDisplayDate(end)}`;
      if (start) return `${formatDisplayDate(start)} から`;
      return `${formatDisplayDate(end)} まで`;
    }

    function formatDisplayDate(value) {
      const date = new Date(String(value || ""));
      if (Number.isNaN(date.getTime())) return text("dateUnset", "日時未設定");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${date.getFullYear()}/${month}/${day} ${hours}:${minutes}`;
    }

    async function resolveAnnouncementImage(file, existingSrc = "") {
      if (!file) return existingSrc;
      if (typeof uploadStaticImageAsset === "function") {
        try {
          const uploaded = await uploadStaticImageAsset(file, {
            usageType: "banner",
            kind: "generic-image"
          });
          if (uploaded?.src) return uploaded.src;
        } catch (error) {
          console.error("Failed to upload announcement image, falling back to data URL:", error);
          showToast(text("uploadFallback", "画像アップロードに失敗したため、一時的にローカル画像を使用します。"));
        }
      }
      return readFileAsDataUrl(file);
    }

    function renderAnnouncementImagePreview(src = "") {
      const preview = document.getElementById("announcement-image-preview");
      const image = document.getElementById("announcement-image-preview-img");
      if (!preview || !image) return;
      const nextSrc = String(src || "").trim();
      preview.hidden = !nextSrc;
      if (nextSrc) image.src = nextSrc;
      else image.removeAttribute("src");
    }

    function renderAnnouncementEditor() {
      const list = document.getElementById("announcement-list");
      if (!list) return;
      const items = Array.isArray(getAnnouncements()) ? getAnnouncements() : [];
      if (!items.length) {
        list.innerHTML = `<p class="editor-record-empty">${esc(text("emptyList", "登録済みお知らせはまだありません"))}</p>`;
        return;
      }

      const sorted = items.slice().sort((left, right) => {
        const orderDiff = Number(left?.sortOrder || 0) - Number(right?.sortOrder || 0);
        if (orderDiff !== 0) return orderDiff;
        return String(right?.updatedAt || right?.createdAt || "").localeCompare(String(left?.updatedAt || left?.createdAt || ""));
      });

      list.innerHTML = sorted.map(item => `
        <article class="editor-record-item">
          <div class="editor-record-item-top">
            <h5>${esc(item.title || text("unnamed", "名称未設定"))}</h5>
            <span class="editor-record-badge">${esc(getStatusLabel(item.status))}</span>
          </div>
          ${item.image ? `<img class="announcement-record-image" src="${esc(item.image)}" alt="${esc(item.title || text("imageAlt", "お知らせ画像"))}">` : ""}
          <p>${esc(item.body || text("emptyBody", "本文はまだありません"))}</p>
          <p class="editor-record-meta">${esc(formatPeriod(item.startAt, item.endAt))}</p>
          <div class="editor-record-actions">
            <button type="button" class="editor-inline-btn" data-announcement-edit="${item.id}">${text("edit", "編集")}</button>
            <button type="button" class="editor-inline-btn" data-announcement-archive="${item.id}">${text("archive", "アーカイブ")}</button>
          </div>
        </article>
      `).join("");

      list.querySelectorAll("[data-announcement-edit]").forEach(button => {
        button.addEventListener("click", () => {
          beginAnnouncementEdit(button.dataset.announcementEdit);
        });
      });
      list.querySelectorAll("[data-announcement-archive]").forEach(button => {
        button.addEventListener("click", async () => {
          await archiveAnnouncement(button.dataset.announcementArchive);
        });
      });
    }

    function getStatusLabel(status) {
      switch (normalizeAnnouncementStatus(status)) {
        case "scheduled":
          return text("statusScheduled", "予約公開");
        case "published":
          return text("statusPublished", "公開中");
        case "archived":
          return text("statusArchived", "アーカイブ");
        default:
          return text("statusDraft", "下書き");
      }
    }

    async function handleAnnouncementSubmit(event) {
      event.preventDefault();
      const form = event.target;
      const currentItems = getAnnouncements();
      const editingId = getEditState().announcementId;
      const existing = editingId ? currentItems.find(item => item.id === editingId) : null;
      const imageFile = form.image?.files?.[0] || null;
      const image = await resolveAnnouncementImage(imageFile, existing?.image || "");
      const now = new Date().toISOString();

      const announcement = {
        id: editingId || crypto.randomUUID(),
        scopeType: "project",
        title: String(form.title?.value || "").trim(),
        body: String(form.body?.value || "").trim(),
        image,
        status: normalizeAnnouncementStatus(form.status?.value),
        startAt: toIsoDateTime(form.startAt?.value),
        endAt: toIsoDateTime(form.endAt?.value),
        sortOrder: Math.max(0, Number(form.sortOrder?.value || 0)),
        linkType: normalizeAnnouncementLinkType(form.linkType?.value),
        linkValue: String(form.linkValue?.value || "").trim(),
        createdAt: String(existing?.createdAt || now),
        updatedAt: now
      };

      upsertItem(currentItems, announcement);
      setAnnouncements(currentItems);
      saveLocal("socia-announcements", currentItems);
      try {
        await postJSON(getApi().announcements, announcement);
      } catch (error) {
        console.error("Failed to save announcement:", error);
        showToast(text("saveFailed", "お知らせの保存に失敗しました。ローカルには保持されています。"));
      }

      resetAnnouncementForm();
      renderAnnouncementEditor();
      renderHome("refresh");
      showToast(existing
        ? text("saveUpdated", "お知らせを更新しました。")
        : text("saveCreated", "お知らせを登録しました。"));
    }

    function beginAnnouncementEdit(id) {
      const item = getAnnouncements().find(entry => entry.id === id);
      if (!item) return;
      const form = getAnnouncementForm();
      if (!form) return;
      getEditState().announcementId = id;
      form.title.value = item.title || "";
      form.body.value = item.body || "";
      form.status.value = normalizeAnnouncementStatus(item.status);
      form.startAt.value = toDateTimeInputValue(item.startAt);
      form.endAt.value = toDateTimeInputValue(item.endAt);
      form.sortOrder.value = String(Math.max(0, Number(item.sortOrder || 0)));
      form.linkType.value = normalizeAnnouncementLinkType(item.linkType);
      form.linkValue.value = item.linkValue || "";
      if (form.image) form.image.value = "";
      renderAnnouncementImagePreview(item.image || "");
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function archiveAnnouncement(id) {
      const currentItems = getAnnouncements();
      const existing = currentItems.find(item => item.id === id);
      if (!existing) return;
      const nextItem = {
        ...existing,
        status: "archived",
        updatedAt: new Date().toISOString()
      };
      upsertItem(currentItems, nextItem);
      setAnnouncements(currentItems);
      saveLocal("socia-announcements", currentItems);
      try {
        await postJSON(getApi().announcements, nextItem);
      } catch (error) {
        console.error("Failed to archive announcement:", error);
        showToast(text("archiveFailed", "お知らせの更新に失敗しました。ローカルには保持されています。"));
      }
      if (getEditState().announcementId === id) resetAnnouncementForm();
      renderAnnouncementEditor();
      renderHome("refresh");
      showToast(text("archiveSuccess", "お知らせをアーカイブしました。"));
    }

    function resetAnnouncementForm() {
      const form = getAnnouncementForm();
      if (!form) return;
      getEditState().announcementId = null;
      form.reset();
      form.status.value = "draft";
      form.sortOrder.value = "0";
      renderAnnouncementImagePreview("");
    }

    function setupAnnouncementEditor() {
      const form = getAnnouncementForm();
      const clearButton = document.getElementById("announcement-image-clear-btn");
      if (!form) return;

      form.addEventListener("submit", handleAnnouncementSubmit);
      form.image?.addEventListener("change", async () => {
        const file = form.image?.files?.[0];
        if (!file) return;
        renderAnnouncementImagePreview(await readFileAsDataUrl(file));
      });
      clearButton?.addEventListener("click", () => {
        if (form.image) form.image.value = "";
        renderAnnouncementImagePreview("");
      });

      renderAnnouncementEditor();
      resetAnnouncementForm();
    }

    return {
      setupAnnouncementEditor,
      renderAnnouncementEditor,
      handleAnnouncementSubmit,
      beginAnnouncementEdit,
      archiveAnnouncement,
      resetAnnouncementForm
    };
  }

  window.SociaAnnouncementEditorApp = {
    setupAnnouncementEditor,
    createAnnouncementEditor
  };
})();
