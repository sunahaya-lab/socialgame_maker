(function () {
  function createHomeHeaderRuntime(deps) {
    const {
      syncRecoveredCurrenciesInMemory,
      formatCurrencyBalance
    } = deps;

    function renderHomeHeader(characters, stories, gachas) {
      document.getElementById("home-char-count").textContent = String(characters.length);
      document.getElementById("home-story-count").textContent = String(stories.length);
      document.getElementById("home-gacha-count").textContent = String(gachas.length);

      const level = Math.max(1, characters.length + stories.length * 2 + gachas.length * 3);
      document.getElementById("home-lv").textContent = String(level);
      renderHomeCurrencies();
    }

    function renderHomeCurrencies() {
      const currencies = syncRecoveredCurrenciesInMemory();
      const stamina = currencies.find(item => item.key === "stamina");
      const gems = currencies.find(item => item.key === "gems");
      const gold = currencies.find(item => item.key === "gold");
      document.getElementById("home-stamina").textContent = formatCurrencyBalance(stamina, true);
      document.getElementById("home-gems").textContent = formatCurrencyBalance(gems);
      document.getElementById("home-gold").textContent = formatCurrencyBalance(gold);
    }

    return {
      renderHomeHeader,
      renderHomeCurrencies
    };
  }

  window.HomeHeaderRuntime = {
    create: createHomeHeaderRuntime
  };
})();
