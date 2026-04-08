const AUTH_KEY_ID = "bia_usuario_id";
const AUTH_KEY_NOME = "bia_usuario_nome";

function getUsuarioId() {
  return localStorage.getItem(AUTH_KEY_ID);
}

function getUsuarioNome() {
  return localStorage.getItem(AUTH_KEY_NOME);
}

function setUsuario(id, nome) {
  localStorage.setItem(AUTH_KEY_ID, id);
  localStorage.setItem(AUTH_KEY_NOME, nome || "");
}

function clearUsuario() {
  localStorage.removeItem(AUTH_KEY_ID);
  localStorage.removeItem(AUTH_KEY_NOME);
}
