(function () {
  const TEXT = {
    editor: {
      emptyAssets: "素材がありません",
      emptyParts: "まだ配置していません",
      emptyFolders: "まだありません",
      emptyProperties: "配置済みパーツを選ぶと属性を編集できます",
      emptyBaseChars: "ベースキャラがありません",
      emptyCards: "カードがありません",
      emptyStories: "ストーリーがありません",
      emptyGachas: "ガチャがありません",
      emptyUiFolders: "UIフォルダがありません",
      emptyUiAssets: "UIアセットがありません",
      emptyMusicFolders: "音楽フォルダはまだ未対応です",
      emptyMusicAssets: "音楽アセットはまだありません",
      emptyVariantCharacters: "イベント差分立ち絵を持つベースキャラがありません",
      folderHint: "フォルダ管理は別ウィンドウです Folders から名前変更やサムネイル確認ができます",
      advancedNote: "見た目は自前素材で作る前提です ここでは何のボタンか 何を表示する枠か と位置だけを決めます",
      emptySelectedFolder: "フォルダが選択されていません",
      emptyPersonalFolders: "個人フォルダはまだありません",
      emptyUploadedAssets: "アップロード済みアセットはまだありません",
      emptyFreeParts: "フリーパーツはまだありません"
    }
  };

  function get(path, fallback = "") {
    if (!path) return fallback;
    const value = String(path)
      .split(".")
      .reduce((acc, key) => (acc && Object.prototype.hasOwnProperty.call(acc, key) ? acc[key] : undefined), TEXT);
    return typeof value === "string" ? value : fallback;
  }

  window.UiTextLib = {
    TEXT,
    get
  };
})();
