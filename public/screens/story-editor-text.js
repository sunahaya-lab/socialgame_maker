(function () {
  const TEXT = {
    playerCharacterLabel: "プレイヤー",
    requireScene: "シーンを1つ以上追加してください。",
    saveFailed: "ストーリー保存に失敗しました。ローカルには保持されています。",
    reorderSaveFailed: "ストーリー順の保存に失敗しました。ローカルには保持されています。",
    storyFxRequired: "このストーリー演出を共有保存するには Story FX Pack が必要です。ローカルには保持されています。",
    emptyVariantCharacters: "イベント差分立ち絵を持つベースキャラがありません",
    noSelection: "指定しない",
    noBgm: "なし",
    noCharacter: "キャラなし",
    character: "キャラ",
    variant: "イベント差分",
    expression: "表情差分",
    line: "セリフ",
    linePlaceholder: "セリフを入力（{name} でプレイヤー名）",
    backgroundImage: "背景画像",
    backgroundImageSet: "背景画像を設定済み",
    extrasOpen: "+ 追加設定",
    extrasClose: "追加設定を閉じる",
    remove: "削除",
    storyFxLocalOnly: "未所持の場合、Story FX 項目はローカル保存のみです"
  };

  function get(key, fallback = "") {
    const value = TEXT[key];
    return typeof value === "string" ? value : fallback;
  }

  window.StoryEditorTextLib = {
    TEXT,
    get
  };
})();
