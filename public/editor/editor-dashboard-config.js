(function () {
  function createEditorDashboardConfig(deps = {}) {
    const { getSystemConfig } = deps;

    function getEquipmentMode() {
      const mode = getSystemConfig?.()?.equipmentMode;
      return ["disabled", "database_only", "enabled"].includes(mode) ? mode : "disabled";
    }

    function getItems() {
      const items = [
        { key: "base-char", title: "ベースキャラ", sub: "プロフィールと音声の編集" },
        { key: "character", title: "カード", sub: "カード登録と画像の編集" },
        { key: "story", title: "ストーリー", sub: "本文とシーン構成の編集" },
        { key: "gacha", title: "ガチャ", sub: "排出設定とバナーの編集" },
        { key: "music", title: "BGM", sub: "曲の追加とホームBGMの選択" },
        { key: "announcement", title: "お知らせ", sub: "ホーム表示用のお知らせを配信" },
        { key: "title", title: "称号", sub: "プレイヤー称号の作成と管理" },
        { key: "system", title: "システム", sub: "基本設定と表示の編集" },
        { key: "publish-share", title: "公開/共有", sub: "共同編集URLと公開URL" },
        { key: "members", title: "プロジェクト設定", sub: "プロジェクトと参加者の管理" }
      ];

      if (getEquipmentMode() !== "disabled") {
        items.splice(2, 0, { key: "equipment-card", title: "装備カード", sub: "装備マスタの登録と編集" });
      }

      return items.filter(item => item.key !== "title");
    }

    function getSummaryCards({ getBaseChars, getCharacters, getStories, getGachas }) {
      return [
        { label: "ベースキャラ", value: Array.isArray(getBaseChars?.()) ? getBaseChars().length : 0 },
        { label: "カード", value: Array.isArray(getCharacters?.()) ? getCharacters().length : 0 },
        { label: "ストーリー", value: Array.isArray(getStories?.()) ? getStories().length : 0 },
        { label: "ガチャ", value: Array.isArray(getGachas?.()) ? getGachas().length : 0 }
      ];
    }

    return {
      getItems,
      getSummaryCards
    };
  }

  window.SociaEditorDashboardConfig = {
    create: createEditorDashboardConfig
  };
})();
