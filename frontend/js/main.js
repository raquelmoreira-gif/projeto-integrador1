document.addEventListener("DOMContentLoaded", () => {
  const hoje = new Date().toISOString().split("T")[0];

  initSidebarUsuario();
  initDashboard(hoje);
  initCaixaPage(hoje);
  initProdutosPage();
  initVendasPage();
  initRelatoriosPage();
  initEstoquePage();
  initLoginPage();
  initUsuariosPage();
});

/* ================= HELPERS ================= */

function formatMoney(n) {
  return Number(n || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/* ================= USUARIO ================= */

function setUsuario(id, nome) {
  localStorage.setItem("usuario_id", id);
  localStorage.setItem("usuario_nome", nome);
}

function getUsuarioId() {
  return localStorage.getItem("usuario_id");
}

function getUsuarioNome() {
  return localStorage.getItem("usuario_nome");
}

function clearUsuario() {
  localStorage.removeItem("usuario_id");
  localStorage.removeItem("usuario_nome");
}

/* ================= SIDEBAR ================= */

function initSidebarUsuario() {
  const el = document.getElementById("usuarioLogado");
  if (!el) return;
  el.textContent = getUsuarioNome() || "Não identificado";
}

/* ================= LOGIN ================= */

function initLoginPage() {
  const select = document.getElementById("selectUsuarioLogin");
  const btn = document.getElementById("btnEntrarLogin");
  const msg = document.getElementById("mensagemLogin");

  if (!select || !btn) return;

  carregar();

  async function carregar() {
    try {
      const users = await listarUsuarios();

      select.innerHTML = '<option value="">Selecione o operador</option>';

      users.forEach(u => {
        const opt = document.createElement("option");
        opt.value = u.id;
        opt.textContent = `${u.nome} (${u.tipo})`;
        select.appendChild(opt);
      });

    } catch (e) {
      msg.textContent = e.message;
    }
  }

  btn.onclick = () => {
    const id = select.value;
    if (!id) return msg.textContent = "Selecione um usuário.";

    const nome = select.selectedOptions[0].textContent.split(" (")[0];
    setUsuario(id, nome);
    window.location.href = "../index.html";
  };

  document.getElementById("btnSairLogin")?.onclick = () => {
    clearUsuario();
    msg.textContent = "Saiu.";
  };
}

/* ================= USUARIOS ================= */

function initUsuariosPage() {
  const form = document.getElementById("formNovoUsuario");
  const msg = document.getElementById("mensagemUsuario");

  if (!form) return;

  form.onsubmit = async (e) => {
    e.preventDefault();

    try {
      await criarUsuario({
        nome: nuNome.value,
        email: nuEmail.value,
        senha: nuSenha.value,
        tipo: nuTipo.value
      });

      msg.textContent = "Usuário cadastrado!";
      form.reset();

    } catch (err) {
      msg.textContent = err.message;
    }
  };
}

/* ================= DASHBOARD ================= */

async function initDashboard() {
  if (!document.getElementById("dashCaixaStatus")) return;

  try {
    const caixa = await buscarCaixaAberto();

    if (caixa) {
      setText("dashCaixaStatus", "Aberto");

      const rel = await relatorioCaixa();
      const atual = rel.find(r => r.caixa_id === caixa.id);

      setText("dashTotalVendido", formatMoney(atual?.total_vendido));
      setText("dashQtdVendas", atual?.quantidade_vendas || 0);

    } else {
      setText("dashCaixaStatus", "Fechado");
      setText("dashTotalVendido", formatMoney(0));
      setText("dashQtdVendas", 0);
    }

  } catch {
    setText("dashCaixaStatus", "Erro");
  }
}

/* ================= CAIXA ================= */

function initCaixaPage() {
  const abrir = document.getElementById("btnAbrirCaixa");
  const fechar = document.getElementById("btnFecharCaixa");

  if (!abrir) return;

  abrir.onclick = async () => {
    try {
      await abrirCaixa(dataCaixa.value, valorInicial.value);
      alert("Caixa aberto!");
    } catch (e) {
      alert(e.message);
    }
  };

  fechar.onclick = async () => {
    try {
      const caixa = await buscarCaixaAberto();
      if (!caixa) return alert("Nenhum caixa aberto");

      await fecharCaixa(caixa.id, valorFinalCaixa.value);
      alert("Caixa fechado!");
    } catch (e) {
      alert(e.message);
    }
  };
}

/* ================= PRODUTOS ================= */

function initProdutosPage() {
  const lista = document.getElementById("listaProdutos");
  const form = document.getElementById("formNovoProduto");

  if (!lista) return;

  carregar();

  async function carregar() {
    const produtos = await listarProdutos();
    lista.innerHTML = "";

    produtos.forEach(p => {
      const div = document.createElement("div");
      div.className = "produto-linha";
      div.innerHTML = `
        <strong>${p.nome}</strong><br>
        ${formatMoney(p.preco)}<br>
        Estoque: ${p.quantidade_estoque}
      `;
      lista.appendChild(div);
    });
  }

  form?.onsubmit = async (e) => {
    e.preventDefault();

    await criarProduto({
      nome: npNome.value,
      preco: Number(npPreco.value),
      quantidade_estoque: Number(npEstoque.value),
      tipo: npTipo.value
    });

    form.reset();
    carregar();
  };
}

/* ================= VENDAS ================= */

function initVendasPage() {
  const btn = document.getElementById("btnFinalizarVenda");
  if (!btn) return;

  btn.onclick = async () => {
    const uid = getUsuarioId();

    if (!uid) return alert("Faça login!");

    try {
      await criarVenda({
        usuario_id: uid,
        forma_pagamento: formaPagamento.value,
        itens: [] // mantém compatível com backend
      });

      alert("Venda registrada!");

    } catch (e) {
      alert(e.message);
    }
  };
}

/* ================= RELATORIOS COMPLETOS ================= */

function initRelatoriosPage() {
  if (!document.getElementById("relatoriosRoot")) return;

  carregar();

  async function carregar() {
    try {
      const dias = await relatorioVendasDia();
      const produtos = await relatorioVendasProduto();
      const caixas = await relatorioCaixa();

      let total = 0;
      let qtd = 0;

      dias.forEach(d => {
        total += Number(d.total_vendido || 0);
        qtd += Number(d.quantidade_vendas || 0);
      });

      setText("relTotalVendido", formatMoney(total));
      setText("relQtdVendas", qtd);

      const top = [...produtos].sort((a,b)=>b.total_vendido-a.total_vendido)[0];

      setText("relTopProduto", top?.nome || "—");
      setText("relTopProdutoInfo", top ? `${top.total_vendido} vendidos` : "—");

    } catch (e) {
      console.error(e);
    }
  }
}

/* ================= ESTOQUE ================= */

function initEstoquePage() {
  if (!document.getElementById("tabelaEstoque")) return;

  relatorioEstoque().then(console.log);
}
