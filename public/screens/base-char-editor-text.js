(function () {
  const TEXT = {
    none: "なし",
    soft: "ソフト",
    bright: "ブライト",
    cute: "キュート",
    digital: "デジタル",
    calm: "カーム",
    uploadFallback: "画像アップロードに失敗したため、一時的にローカル画像を使用します。",
    saveFailed: "ベースキャラの保存に失敗しました。ローカルには保持されています。",
    deleted: "ベースキャラを削除しました。",
    expressionNamePlaceholder: "表情名",
    variantNamePlaceholder: "差分名",
    targetCharacterPlaceholder: "相手キャラを選択",
    birthdayTargetPlaceholder: "対象キャラを選択",
    homeOpinionPlaceholder: "そのキャラについてのセリフ",
    homeConversationSelfPlaceholder: "自分のセリフ",
    homeConversationPartnerPlaceholder: "相手のセリフ",
    homeBirthdayPlaceholder: "誕生日用のセリフ",
    remove: "削除"
  };

  function get(key, fallback = "") {
    const value = TEXT[key];
    return typeof value === "string" ? value : fallback;
  }

  window.BaseCharEditorTextLib = {
    TEXT,
    get
  };
})();
