(function () {
  function showToast(message, options) {
    const duration = options?.duration ?? 2200;
    const className = options?.className ?? "toast";
    const existing = document.querySelector(`.${className}`);
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.className = className;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }

  window.ToastLib = {
    showToast
  };
})();
