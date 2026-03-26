(function () {
  function buildQuery(params) {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") return;
      query.set(key, String(value));
    });
    const text = query.toString();
    return text ? `?${text}` : "";
  }

  function buildApiUrl(path, options) {
    return `${path}${buildQuery(options?.query)}`;
  }

  async function request(path, options) {
    const res = await fetch(buildApiUrl(path, options), {
      method: options?.method || "GET",
      headers: {
        Accept: "application/json",
        ...(options?.body ? { "Content-Type": "application/json" } : {}),
        ...(options?.headers || {})
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
      credentials: options?.credentials || "same-origin"
    });
    const data = await readJsonSafely(res);
    if (!res.ok) {
      const error = new Error(String(data?.error || res.status));
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  function get(path, options) {
    return request(path, { ...options, method: "GET" });
  }

  function post(path, body, options) {
    return request(path, { ...options, method: "POST", body });
  }

  async function readJsonSafely(response) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  window.ApiClient = {
    buildApiUrl,
    request,
    get,
    post
  };
})();
