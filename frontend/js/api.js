/* ================================================
   API — Supabase REST direto (sem backend Flask)
   ================================================ */

const SUPABASE_URL = "https://yheyhjcdzljcpoputsvo.supabase.co";
const SUPABASE_KEY = "sb_publishable_XKyEzrlSkHF_EqNHpsnxrQ__suhLExR";

const SB_HEADERS = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Prefer": "return=representation"
};

async function sbRequest(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, { headers: SB_HEADERS, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `Erro HTTP ${res.status}`);
  return data;
}

async function sbDelete(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "DELETE",
    headers: SB_HEADERS
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || data.error || `Erro HTTP ${res.status}`);
  }
  return true;
}

/* ================= PRODUTOS ================= */

async function listarProdutos() {
  return sbRequest("produtos?select=*&order=nome.asc");
}

async function criarProduto(body) {
  return sbRequest("produtos", { method: "POST", body: JSON.stringify(body) });
}

async function atualizarProduto(produtoId, body) {
  return sbRequest(`produtos?id=eq.${produtoId}`, { method: "PATCH", body: JSON.stringify(body) });
}

async function excluirProduto(produtoId) {
  // 1. Busca os itens de venda que referenciam este produto
  const itens = await sbRequest(`vendas_itens?produto_id=eq.${produtoId}&select=id,venda_id`);

  if (itens.length > 0) {
    // 2. Exclui todos os itens vinculados ao produto
    await sbDelete(`vendas_itens?produto_id=eq.${produtoId}`);

    // 3. Para cada venda afetada, verifica se ficou sem itens e exclui se necessário
    const vendaIds = [...new Set(itens.map(i => i.venda_id))];
    for (const vendaId of vendaIds) {
      const itensRestantes = await sbRequest(`vendas_itens?venda_id=eq.${vendaId}&select=id`);
      if (itensRestantes.length === 0) {
        await sbDelete(`vendas?id=eq.${vendaId}`);
      }
    }
  }

  // 4. Agora exclui o produto com segurança
  return sbDelete(`produtos?id=eq.${produtoId}`);
}

async function movimentarEstoque(produtoId, body) {
  const produtos = await sbRequest(`produtos?id=eq.${produtoId}&select=id,quantidade_estoque`);
  if (!produtos.length) throw new Error("Produto não encontrado");

  const estoqueAtual = produtos[0].quantidade_estoque;
  const quantidade = Number(body.quantidade);

  if (body.tipo === "saida" && estoqueAtual < quantidade)
    throw new Error(`Estoque insuficiente. Disponível: ${estoqueAtual}`);

  const novoEstoque = body.tipo === "entrada" ? estoqueAtual + quantidade : estoqueAtual - quantidade;

  await sbRequest("movimentacoes_estoque", {
    method: "POST",
    body: JSON.stringify({
      produto_id: produtoId,
      tipo: body.tipo,
      quantidade,
      motivo: body.motivo || "ajuste_manual"
    })
  });

  await sbRequest(`produtos?id=eq.${produtoId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantidade_estoque: novoEstoque })
  });

  return { ok: true };
}

/* ================= CAIXA ================= */

async function buscarCaixaAberto() {
  const rows = await sbRequest("caixa?status=eq.aberto&order=data.desc&limit=1");
  return rows[0] || null;
}

async function abrirCaixa(data, valorInicial) {
  const aberto = await buscarCaixaAberto();
  if (aberto) throw new Error("Já existe um caixa aberto. Feche o atual antes de abrir outro.");
  return sbRequest("caixa", {
    method: "POST",
    body: JSON.stringify({ data, valor_inicial: Number(valorInicial), status: "aberto" })
  });
}

async function fecharCaixa(caixaId, valorFinal) {
  return sbRequest(`caixa?id=eq.${caixaId}&status=eq.aberto`, {
    method: "PATCH",
    body: JSON.stringify({ valor_final: Number(valorFinal), status: "fechado", fechado_em: new Date().toISOString() })
  });
}

/* ================= USUARIOS ================= */

async function listarUsuarios() {
  return sbRequest("usuarios?select=id,nome,email,tipo&order=nome.asc");
}

async function criarUsuario(body) {
  return sbRequest("usuarios", { method: "POST", body: JSON.stringify(body) });
}

async function excluirUsuario(usuarioId) {
  return sbDelete(`usuarios?id=eq.${usuarioId}`);
}

/* ================= VENDAS ================= */

async function listarVendas() {
  return sbRequest("vendas?select=*&order=criado_em.desc");
}

async function criarVenda(payload) {
  const { usuario_id, forma_pagamento, itens } = payload;

  const caixa = await buscarCaixaAberto();
  if (!caixa) throw new Error("Não existe caixa aberto para registrar venda.");

  const ids = itens.map(i => i.produto_id);
  const produtos = await sbRequest(`produtos?id=in.(${ids.join(",")})&select=id,preco`);
  const map = Object.fromEntries(produtos.map(p => [p.id, Number(p.preco)]));

  let valor_total = 0;
  for (const item of itens) {
    if (!map[item.produto_id]) throw new Error(`Produto não encontrado`);
    valor_total += map[item.produto_id] * item.quantidade;
  }

  const vendas = await sbRequest("vendas", {
    method: "POST",
    body: JSON.stringify({ caixa_id: caixa.id, usuario_id, forma_pagamento, status: "paga", valor_total })
  });

  const venda = vendas[0];
  const itensPayload = itens.map(item => ({
    venda_id: venda.id,
    produto_id: item.produto_id,
    quantidade: item.quantidade,
    preco_unitario: map[item.produto_id],
    subtotal: map[item.produto_id] * item.quantidade
  }));

  await sbRequest("vendas_itens", { method: "POST", body: JSON.stringify(itensPayload) });
  return { venda, itens: itensPayload };
}

async function excluirVenda(vendaId) {
  await sbDelete(`vendas_itens?venda_id=eq.${vendaId}`);
  return sbDelete(`vendas?id=eq.${vendaId}`);
}

/* ================= RELATORIOS ================= */

async function relatorioCaixa() { return sbRequest("relatorio_caixa?select=*"); }
async function relatorioVendasProduto() { return sbRequest("relatorio_vendas_produto?select=*"); }
async function relatorioVendasDia() { return sbRequest("relatorio_vendas_dia?select=*"); }
async function relatorioEstoque() { return sbRequest("relatorio_estoque?select=*"); }
async function relatorioEstoqueBaixo() { return sbRequest("relatorio_estoque_baixo?select=*"); }
async function relatorioConsignado() { return sbRequest("relatorio_consignado?select=*"); }
