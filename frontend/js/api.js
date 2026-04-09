function apiBase() {
  return window.API_BASE_URL || "https://projeto-integrador1-backend.onrender.com/api";
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${apiBase()}${path}`, {
    cache: "no-store",
    ...options
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || result.message || `Erro HTTP ${response.status}`);
  }
  if (result.success === false) {
    throw new Error(result.error || "Operação não concluída");
  }
  return result.data;
}

async function listarProdutos() {
  return apiRequest("/produtos/");
}

async function criarProduto(body) {
  return apiRequest("/produtos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function atualizarProduto(produtoId, body) {
  return apiRequest(`/produtos/${produtoId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function movimentarEstoque(produtoId, body) {
  return apiRequest(`/produtos/${produtoId}/movimentar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipo: body.tipo,
      quantidade: Number(body.quantidade),
      motivo: body.motivo || "ajuste_manual",
    }),
  });
}

async function abrirCaixa(data, valorInicial) {
  return apiRequest("/caixa/abrir", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data,
      valor_inicial: Number(valorInicial),
    }),
  });
}

async function buscarCaixaAberto() {
  return apiRequest("/caixa/aberto");
}

async function fecharCaixa(caixaId, valorFinal) {
  return apiRequest(`/caixa/${caixaId}/fechar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ valor_final: Number(valorFinal) }),
  });
}

async function listarUsuarios() {
  return apiRequest("/usuarios");
}

async function criarUsuario(body) {
  return apiRequest("/usuarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function criarVenda(payload) {
  return apiRequest("/vendas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function relatorioCaixa() {
  return apiRequest("/relatorios/caixa");
}

async function relatorioVendasProduto() {
  return apiRequest("/relatorios/vendas-produto");
}

async function relatorioVendasDia() {
  return apiRequest("/relatorios/vendas-dia");
}

async function relatorioEstoque() {
  return apiRequest("/relatorios/estoque");
}

async function relatorioEstoqueBaixo() {
  return apiRequest("/relatorios/estoque-baixo");
}

async function relatorioConsignado() {
  return apiRequest("/relatorios/consignado");
}
