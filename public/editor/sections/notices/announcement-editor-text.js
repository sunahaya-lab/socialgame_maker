(function () {
  const TEXT = {
    periodUnset: "期間指定なし",
    dateUnset: "日時未設定",
    uploadFallback: "画像アップロードに失敗したため、一時的にローカル画像を使用します。",
    emptyList: "登録済みお知らせはまだありません",
    unnamed: "名称未設定",
    imageAlt: "お知らせ画像",
    emptyBody: "本文はまだありません",
    edit: "編集",
    archive: "アーカイブ",
    statusScheduled: "予約公開",
    statusPublished: "公開中",
    statusArchived: "アーカイブ",
    statusDraft: "下書き",
    saveFailed: "お知らせの保存に失敗しました。ローカルには保持されています。",
    saveUpdated: "お知らせを更新しました。",
    saveCreated: "お知らせを登録しました。",
    archiveFailed: "お知らせの更新に失敗しました。ローカルには保持されています。",
    archiveSuccess: "お知らせをアーカイブしました。"
  };

  function get(key, fallback = "") {
    const value = TEXT[key];
    return typeof value === "string" ? value : fallback;
  }

  window.SociaAnnouncementEditorText = {
    TEXT,
    get
  };
})();
