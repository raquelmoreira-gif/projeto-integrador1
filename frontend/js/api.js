const API_BASE_URL = "https://projeto-integrador1-backend.onrender.com/api";

async function listarProdutos() {
  const response = await fetch(`${API_BASE_URL}/produtos/`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || "Erro ao listar produtos");
  }

  return result;
}

async function abrirCaixa(data, valorInicial) {
  const response = await fetch(`${API_BASE_URL}/caixa/abrir`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: data,
      valor_inicial: Number(valorInicial),
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || "Erro ao abrir caixa");
  }

  return result;
}

async function buscarCaixaAberto() {
  const response = await fetch(`${API_BASE_URL}/caixa/aberto`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || "Erro ao buscar caixa aberto");
  }

  return result;
}
