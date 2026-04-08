/**
 * Base da API. Para desenvolvimento local, no console:
 * localStorage.setItem("API_BASE_URL", "http://127.0.0.1:5000/api");
 * e recarregue a página.
 */
(function () {
  const stored = localStorage.getItem("API_BASE_URL");
  window.API_BASE_URL =
    stored ||
    window.API_BASE_URL ||
    "https://projeto-integrador1-backend.onrender.com/api";
})();
