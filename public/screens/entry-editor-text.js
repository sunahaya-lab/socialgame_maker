(function () {
  const TEXT = {
    uploadFallback: "画像アップロードに失敗したため、一時的にローカル画像を使用します。",
    cropHelp: "画像から4種のクロップを自動生成します。必要なら X、Y、ズームを調整してください。",
    sdHelp: "戦闘用の SD 画像を任意で登録できます。Idle が基本姿勢で、Attack と Damaged は登録されている場合に上書きします。",
    battlePackNote: "Battle Pack が必要です。未所持の場合、この項目はローカル保存のみです。",
    battleHelp: "戦闘の基礎データを編集します。スキル説明は小さい選択パーツの組み合わせなので、後から項目を増やしやすい構造です。",
    homeOpinionPlaceholder: "そのキャラについてのセリフ",
    homeConversationSelfPlaceholder: "自分のセリフ",
    homeConversationPartnerPlaceholder: "相手のセリフ",
    homeBirthdayPlaceholder: "誕生日用のセリフ",
    remove: "削除",
    battlePackRequired: "このカードのバトル設定を保存するには Battle Pack が必要です。ローカルには保持されています。",
    folderMoveFailed: "カードのフォルダ移動保存に失敗しました。"
  };

  function get(key, fallback = "") {
    const value = TEXT[key];
    return typeof value === "string" ? value : fallback;
  }

  window.EntryEditorTextLib = {
    TEXT,
    get
  };
})();
