(function () {
  const TEXT = {
    none: "なし",
    emptyList: "登録済み BGM はまだありません",
    unnamed: "名称未設定",
    useForHome: "ホームに設定",
    removeFromList: "一覧から外す",
    homeUpdated: "ホーム BGM を更新しました",
    removed: "BGM を一覧から外しました",
    selectFile: "BGM ファイルを選択してください",
    freeLimit: "無料版では BGM は10曲まで登録できます",
    added: "BGM を追加しました",
    addFailed: "BGM の追加に失敗しました",
    settingsSaved: "BGM 設定を保存しました"
  };

  function get(key, fallback = "") {
    const value = TEXT[key];
    return typeof value === "string" ? value : fallback;
  }

  window.MusicEditorTextLib = {
    TEXT,
    get
  };
})();
