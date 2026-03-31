(function () {
  function createHomeAnnouncementRuntime(deps) {
    const {
      getAnnouncements,
      esc,
      navigateTo
    } = deps;

    function renderAnnouncements(items = getAnnouncements()) {
      const container = document.getElementById("home-announcements");
      const list = document.getElementById("home-announcements-list");
      if (!container || !list) return;
      const visibleItems = getVisibleAnnouncements(items).slice(0, 3);
      if (!visibleItems.length) {
        container.hidden = true;
        list.innerHTML = "";
        return;
      }

      container.hidden = false;
      list.innerHTML = visibleItems.map(item => `
        <article class="home-announcement-card">
          ${item.image ? `<img class="home-announcement-image" src="${esc(item.image)}" alt="${esc(item.title || "お知らせ画像")}">` : ""}
          <div class="home-announcement-body">
            <div class="home-announcement-top">
              <h4>${esc(item.title || "お知らせ")}</h4>
              <span class="home-announcement-period">${esc(formatAnnouncementDate(item.startAt || item.updatedAt || item.createdAt))}</span>
            </div>
            <p>${esc(item.body || "")}</p>
            ${renderAnnouncementAction(item)}
          </div>
        </article>
      `).join("");

      list.querySelectorAll("[data-announcement-go]").forEach(button => {
        button.addEventListener("click", () => {
          const target = String(button.dataset.announcementGo || "").trim();
          if (target === "story" || target === "gacha") navigateTo?.(target);
        });
      });
      list.querySelectorAll("[data-announcement-url]").forEach(button => {
        button.addEventListener("click", () => {
          const url = String(button.dataset.announcementUrl || "").trim();
          if (!url) return;
          window.open(url, "_blank", "noopener");
        });
      });
    }

    function getVisibleAnnouncements(items) {
      const now = Date.now();
      return (Array.isArray(items) ? items : [])
        .filter(item => isAnnouncementVisible(item, now))
        .sort((left, right) => {
          const orderDiff = Number(left?.sortOrder || 0) - Number(right?.sortOrder || 0);
          if (orderDiff !== 0) return orderDiff;
          return String(right?.startAt || right?.updatedAt || right?.createdAt || "").localeCompare(
            String(left?.startAt || left?.updatedAt || left?.createdAt || "")
          );
        });
    }

    function isAnnouncementVisible(item, nowMs) {
      const status = String(item?.status || "").trim();
      if (status !== "published" && status !== "scheduled") return false;
      const startAt = String(item?.startAt || "").trim();
      const endAt = String(item?.endAt || "").trim();
      const startMs = startAt ? new Date(startAt).getTime() : null;
      const endMs = endAt ? new Date(endAt).getTime() : null;
      if (Number.isFinite(startMs) && startMs > nowMs) return false;
      if (Number.isFinite(endMs) && endMs < nowMs) return false;
      return true;
    }

    function renderAnnouncementAction(item) {
      const linkType = String(item?.linkType || "").trim();
      const linkValue = String(item?.linkValue || "").trim();
      if (linkType === "story") {
        return '<button type="button" class="home-announcement-action" data-announcement-go="story">ストーリーへ</button>';
      }
      if (linkType === "gacha") {
        return '<button type="button" class="home-announcement-action" data-announcement-go="gacha">ガチャへ</button>';
      }
      if (linkType === "url" && linkValue) {
        return `<button type="button" class="home-announcement-action" data-announcement-url="${esc(linkValue)}">詳細を見る</button>`;
      }
      return "";
    }

    function formatAnnouncementDate(value) {
      const date = new Date(String(value || ""));
      if (Number.isNaN(date.getTime())) return "公開中";
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${month}/${day}`;
    }

    return {
      renderAnnouncements,
      getVisibleAnnouncements,
      isAnnouncementVisible,
      renderAnnouncementAction,
      formatAnnouncementDate
    };
  }

  window.HomeAnnouncementRuntime = {
    create: createHomeAnnouncementRuntime
  };
})();
