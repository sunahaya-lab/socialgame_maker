(function () {
  const TEXT = {
    unsetSelection: "未指定",
    previewLabel: "称号プレビュー",
    emptyMasters: "まだ共有称号マスタがありません",
    always: "always",
    unlocked: "解放済み",
    locked: "未解放",
    equipped: "装備中",
    emptyDescription: "説明はまだありません",
    emptyUnlockedTitles: "このプレイヤーが解放済みの称号はまだありません",
    defaultCategory: "default",
    edit: "編集",
    remove: "削除",
    saveButtonCreate: "称号マスタを保存",
    saveButtonUpdate: "称号マスタを更新",
    labelRequired: "称号名を入力してください。",
    saveFailed: "称号マスタの保存に失敗しました。",
    saveCreated: "称号マスタを保存しました。",
    saveUpdated: "称号マスタを更新しました。",
    deleteSuccess: "称号マスタを削除しました。"
  };

  function get(key, fallback = "") {
    const value = TEXT[key];
    return typeof value === "string" ? value : fallback;
  }

  window.TitleEditorTextLib = {
    TEXT,
    get
  };
})();
