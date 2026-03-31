(function () {
  const TEXT = {
    buttonAriaLabel: "\u30e6\u30fc\u30b6\u30fc\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u3092\u958b\u304f",
    guest: "\u30b2\u30b9\u30c8",
    panelTitle: "\u30e6\u30fc\u30b6\u30fc\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb",
    panelDescription: "\u30b2\u30fc\u30e0\u5185\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u3068\u30a2\u30ab\u30a6\u30f3\u30c8\u3092\u7ba1\u7406\u3067\u304d\u307e\u3059\u3002",
    close: "\u9589\u3058\u308b",
    showDetails: "\u8a73\u7d30\u3092\u8868\u793a",
    hideDetails: "\u8a73\u7d30\u3092\u9589\u3058\u308b",
    editProfile: "\u30b2\u30fc\u30e0\u5185\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u5909\u66f4",
    closeProfileEditor: "\u30b2\u30fc\u30e0\u5185\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u3092\u9589\u3058\u308b",
    profileHeading: "\u30b2\u30fc\u30e0\u5185\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb",
    playerName: "\u30b2\u30fc\u30e0\u5185\u30e6\u30fc\u30b6\u30fc\u540d",
    birthday: "\u8a95\u751f\u65e5",
    activeTitle: "\u8868\u793a\u4e2d\u306e\u79f0\u53f7",
    unset: "\u672a\u8a2d\u5b9a",
    profileNoteWithProject: "\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u3054\u3068\u306b\u4f7f\u3046\u540d\u524d\u3068\u8a95\u751f\u65e5\u3092\u8a2d\u5b9a\u3067\u304d\u307e\u3059\u3002",
    profileNoteWithoutProject: "\u5148\u306b\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u3092\u9078\u629e\u3059\u308b\u3068\u30b2\u30fc\u30e0\u5185\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u3092\u8a2d\u5b9a\u3067\u304d\u307e\u3059\u3002",
    saveProfile: "\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u3092\u4fdd\u5b58",
    loginHeading: "\u30a2\u30ab\u30a6\u30f3\u30c8\u30ed\u30b0\u30a4\u30f3",
    registerHeading: "\u30a2\u30ab\u30a6\u30f3\u30c8\u65b0\u898f\u767b\u9332",
    email: "\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9",
    password: "\u30d1\u30b9\u30ef\u30fc\u30c9",
    accountDisplayName: "\u30a2\u30ab\u30a6\u30f3\u30c8\u8868\u793a\u540d",
    login: "\u30ed\u30b0\u30a4\u30f3",
    registerAndStart: "\u767b\u9332\u3057\u3066\u958b\u59cb",
    logout: "\u30ed\u30b0\u30a2\u30a6\u30c8",
    processing: "\u51e6\u7406\u4e2d\u2026",
    authFailed: "\u8a8d\u8a3c\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002",
    loginSuccess: "\u30ed\u30b0\u30a4\u30f3\u3057\u307e\u3057\u305f\u3002",
    registerSuccess: "\u30a2\u30ab\u30a6\u30f3\u30c8\u3092\u767b\u9332\u3057\u307e\u3057\u305f\u3002",
    logoutSuccess: "\u30ed\u30b0\u30a2\u30a6\u30c8\u3057\u307e\u3057\u305f\u3002",
    logoutFailed: "\u30ed\u30b0\u30a2\u30a6\u30c8\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002",
    summaryTitleUnset: "\u79f0\u53f7\u672a\u8a2d\u5b9a",
    loginStateLoggedIn: "\u30ed\u30b0\u30a4\u30f3\u4e2d",
    loginStateLoggedOut: "\u672a\u30ed\u30b0\u30a4\u30f3",
    accountLabel: "\u30a2\u30ab\u30a6\u30f3\u30c8",
    accountIdLabel: "\u30a2\u30ab\u30a6\u30f3\u30c8ID",
    ownedTitleCount: "\u6240\u6301\u79f0\u53f7\u6570",
    panelStatusLoggedIn: "\u30a2\u30ab\u30a6\u30f3\u30c8\u3068\u30b2\u30fc\u30e0\u5185\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u3092\u7ba1\u7406\u3067\u304d\u307e\u3059\u3002",
    panelStatusLoggedOut: "\u672a\u30ed\u30b0\u30a4\u30f3\u3067\u3059\u3002\u30a2\u30ab\u30a6\u30f3\u30c8\u30ed\u30b0\u30a4\u30f3\u307e\u305f\u306f\u65b0\u898f\u767b\u9332\u304c\u3067\u304d\u307e\u3059\u3002"
  };

  function get(key, fallback = "") {
    const value = TEXT[key];
    return typeof value === "string" ? value : fallback;
  }

  function panelMarkup() {
    return `
      <div class="auth-panel-card">
        <div class="auth-panel-head">
          <div>
            <h4>${get("panelTitle")}</h4>
            <p id="auth-panel-status">${get("panelDescription")}</p>
          </div>
          <button type="button" class="auth-panel-close" data-auth-close>${get("close")}</button>
        </div>
        <div class="auth-session-summary" id="auth-session-summary"></div>
        <div class="auth-summary-actions">
          <button type="button" class="btn-secondary auth-summary-btn" id="auth-summary-detail-toggle">${get("showDetails")}</button>
          <button type="button" class="btn-secondary auth-summary-btn" id="auth-profile-toggle">${get("editProfile")}</button>
        </div>
        <div class="auth-profile-editor" id="auth-profile-editor" hidden>
          <form id="auth-profile-form" class="auth-form auth-profile-form">
            <h5>${get("profileHeading")}</h5>
            <label>
              <span>${get("playerName")}</span>
              <input type="text" name="displayName" maxlength="40" autocomplete="nickname" required>
            </label>
            <label>
              <span>${get("birthday")}</span>
              <input type="text" name="birthday" maxlength="5" inputmode="numeric" placeholder="08-15">
            </label>
            <label>
              <span>${get("activeTitle")}</span>
              <select name="activeTitleId" id="auth-profile-title-select">
                <option value="">${get("unset")}</option>
              </select>
            </label>
            <div class="auth-profile-note" id="auth-profile-note">${get("profileNoteWithProject")}</div>
            <div class="auth-profile-status" id="auth-profile-status"></div>
            <button type="submit" class="btn-primary" id="auth-profile-save-btn">${get("saveProfile")}</button>
          </form>
        </div>
        <div class="auth-panel-sections" id="auth-panel-sections">
          <form id="auth-login-form" class="auth-form">
            <h5>${get("loginHeading")}</h5>
            <label>
              <span>${get("email")}</span>
              <input type="email" name="email" autocomplete="email" required>
            </label>
            <label>
              <span>${get("password")}</span>
              <input type="password" name="password" autocomplete="current-password" required>
            </label>
            <button type="submit" class="btn-primary">${get("login")}</button>
          </form>
          <form id="auth-register-form" class="auth-form">
            <h5>${get("registerHeading")}</h5>
            <label>
              <span>${get("accountDisplayName")}</span>
              <input type="text" name="displayName" maxlength="80" autocomplete="nickname" required>
            </label>
            <label>
              <span>${get("email")}</span>
              <input type="email" name="email" autocomplete="email" required>
            </label>
            <label>
              <span>${get("password")}</span>
              <input type="password" name="password" autocomplete="new-password" minlength="8" required>
            </label>
            <button type="submit" class="btn-primary">${get("registerAndStart")}</button>
          </form>
        </div>
        <div class="auth-panel-actions">
          <button type="button" class="btn-secondary" id="auth-close-btn">${get("close")}</button>
          <button type="button" class="btn-secondary" id="auth-logout-btn">${get("logout")}</button>
        </div>
      </div>
    `;
  }

  window.AuthUiTextLib = {
    get,
    panelMarkup
  };
})();
