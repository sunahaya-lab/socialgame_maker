(function () {
  function createSystemEditorLayoutController(deps) {
    const {
      getSystemConfig,
      getHomeCustomPartsDraft,
      handleLayoutModeChange,
      handlePresetOptionChange,
      handleHomeNodeSelectionChange,
      handleHomeNodeFieldInput,
      handleHomeNodeAssetChange,
      handleHomeNodeAssetClear,
      addFreeHomePart,
      showToast,
      escapeHtml,
      text
    } = deps;

    function ensureLayoutPresetControls() {
      const form = document.getElementById("system-form");
      const preview = form?.querySelector(".system-preview");
      if (!form || !preview || document.getElementById("system-home-layout-select")) return;

      const modeLabel = document.createElement("label");
      modeLabel.innerHTML = `
        ホーム配置設定
        <select name="homeLayoutMode" id="system-home-layout-mode-select">
          <option value="preset">Preset</option>
          <option value="advanced">Advanced</option>
        </select>
      `;

      const layoutLabel = document.createElement("label");
      layoutLabel.innerHTML = `
        配置形式
        <select name="homeLayoutPreset" id="system-home-layout-select">
          <option value="single-focus">フォーカス</option>
          <option value="dual-stage">デュアル</option>
        </select>
      `;

      const speechLabel = document.createElement("label");
      speechLabel.innerHTML = `
        会話
        <select name="homeSpeechPreset" id="system-home-speech-select">
          <option value="right-bubble">右吹き出し</option>
          <option value="left-bubble">左吹き出し</option>
          <option value="hidden">非表示</option>
        </select>
      `;

      const presetPanel = document.createElement("section");
      presetPanel.className = "layout-preset-panel";
      presetPanel.innerHTML = `
        <div class="layout-preset-head">
          <h4>部品設定</h4>
          <p>Advanced は部品の見た目を作る場ではなく、置いた素材に役割を割り当てて配置するモードです。</p>
        </div>
        <div class="layout-advanced-panel" id="system-home-advanced-panel" hidden>
          <p class="layout-advanced-note">${escapeHtml(text("editor.advancedNote", "見た目は自前素材で作る前提です ここでは何のボタンか 何を表示する枠か と位置だけを決めます"))}</p>
          <label>
            役割
            <select name="homeNodeTarget" id="system-home-node-target"></select>
          </label>
          <div class="layout-advanced-kind">
            <span class="layout-advanced-kind-label">部品タイプ</span>
            <strong id="system-home-node-kind">-</strong>
          </div>
          <label>
            素材画像
            <input type="file" id="system-home-node-asset" accept="image/*">
          </label>
          <div class="layout-advanced-asset-actions">
            <button type="button" class="btn-secondary" id="system-home-node-asset-clear">画像をクリア</button>
          </div>
          <div class="layout-asset-library">
            <div class="layout-asset-library-head">
              <h5>カスタムパーツ一覧</h5>
              <p>アップした素材はここに残ります。役割ごとに再選択できます。</p>
            </div>
            <div class="layout-advanced-asset-actions">
              <button type="button" class="btn-secondary" id="system-home-open-ui-folders">UIフォルダ管理へ</button>
            </div>
          </div>
          <div class="layout-free-parts">
            <div class="layout-asset-library-head">
              <h5>自由配置</h5>
              <p>役割に縛られない飾りや枠を追加できます。まずは画像部品だけを置けます。</p>
            </div>
            <div class="layout-free-parts-actions">
              <button type="button" class="btn-secondary" id="system-home-add-free-part">素材を追加する</button>
            </div>
            <div class="layout-free-parts-list" id="system-home-free-parts"></div>
          </div>
          <label class="layout-advanced-visibility">
            <input type="checkbox" name="homeNodeShowText" id="system-home-node-show-text">
            テキストを表示する
          </label>
          <div class="layout-advanced-grid">
            <label>X <input type="number" name="homeNodeX" id="system-home-node-x" step="1"></label>
            <label>Y <input type="number" name="homeNodeY" id="system-home-node-y" step="1"></label>
            <label>W <input type="number" name="homeNodeW" id="system-home-node-w" step="1"></label>
            <label>H <input type="number" name="homeNodeH" id="system-home-node-h" step="1"></label>
            <label>奥行き <input type="number" name="homeNodeZ" id="system-home-node-z" step="1"></label>
          </div>
          <label class="layout-advanced-visibility">
            <input type="checkbox" name="homeNodeVisible" id="system-home-node-visible">
            表示する
          </label>
        </div>
        <div class="layout-preset-preview-wrap">
          <div class="layout-preset-preview" id="system-home-layout-preview"></div>
        </div>
      `;

      preview.before(modeLabel, layoutLabel, speechLabel, presetPanel);

      modeLabel.querySelector("select")?.addEventListener("change", handleLayoutModeChange);
      layoutLabel.querySelector("select")?.addEventListener("change", handlePresetOptionChange);
      speechLabel.querySelector("select")?.addEventListener("change", handlePresetOptionChange);
      document.getElementById("system-home-node-target")?.addEventListener("change", handleHomeNodeSelectionChange);
      ["system-home-node-x", "system-home-node-y", "system-home-node-w", "system-home-node-h", "system-home-node-z", "system-home-node-visible"].forEach(id => {
        document.getElementById(id)?.addEventListener("input", handleHomeNodeFieldInput);
        document.getElementById(id)?.addEventListener("change", handleHomeNodeFieldInput);
      });
      document.getElementById("system-home-node-show-text")?.addEventListener("change", handleHomeNodeFieldInput);
      document.getElementById("system-home-node-asset")?.addEventListener("change", handleHomeNodeAssetChange);
      document.getElementById("system-home-node-asset-clear")?.addEventListener("click", handleHomeNodeAssetClear);
      document.getElementById("system-home-add-free-part")?.addEventListener("click", addFreeHomePart);
      document.getElementById("system-home-open-ui-folders")?.addEventListener("click", () => {
        showToast("UIフォルダ管理はホーム編集ワークスペースから開いてください");
      });
    }

    function buildHomeLayoutDraft() {
      const form = document.getElementById("system-form");
      const config = getSystemConfig();
      const mode = form?.homeLayoutMode?.value || config.layoutPresets?.home?.mode || "preset";
      const options = {
        mode,
        layout: form?.homeLayoutPreset?.value || config.layoutPresets?.home?.layout || "single-focus",
        speech: form?.homeSpeechPreset?.value || config.layoutPresets?.home?.speech || "right-bubble"
      };
      return window.SociaLayoutBridge.getEditableHomeLayout({
        options,
        advancedNodes: config.layoutPresets?.home?.advancedNodes || [],
        customParts: getHomeCustomPartsDraft?.() || []
      });
    }

    return {
      ensureLayoutPresetControls,
      buildHomeLayoutDraft
    };
  }

  window.SystemEditorLayoutLib = {
    create: createSystemEditorLayoutController
  };
})();
