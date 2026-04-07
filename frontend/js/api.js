async function listarProdutos() {
  const response = await fetch(`${API_BASE_URL}/produtos`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || "Erro ao listar produtos");
  }

  return result;
}
