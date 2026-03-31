(function () {
  function createEditorPreviewRuntime() {
    function setupPreviews() {
      const portraitInput = document.querySelector("#base-char-form input[name='portrait']");
      portraitInput?.addEventListener("change", () => previewImage(portraitInput, "base-char-preview", "base-char-preview-img"));
      const imageInput = document.querySelector("#character-form input[name='image']");
      imageInput?.addEventListener("change", () => previewImage(imageInput, "char-preview", "char-preview-img"));
    }

    function previewImage(input, previewId, imgId) {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        document.getElementById(previewId).hidden = false;
        document.getElementById(imgId).src = reader.result;
      };
      reader.readAsDataURL(file);
    }

    return {
      setupPreviews,
      previewImage
    };
  }

  window.SociaEditorPreviewRuntime = {
    create: createEditorPreviewRuntime
  };
})();
