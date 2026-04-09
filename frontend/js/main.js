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

function formatMoney(n) {
  const v = Number(n);
  if (Number.isNaN(v)) return "R$ 0,00";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/* ================= SIDEBAR ================= */
function initSidebarUsuario() {
  const el = document.getElementById("usuarioLogado");
  const wrap = document.querySelector(".sidebar-user");
  if (!el || !wrap) return;

  const nome = getUsuarioNome();
  if (nome) {
    el.textContent = nome;
  } else {
    el.textContent = "Não identificado";
  }
}

/* ================= DASHBOARD ================= */
async function initDashboard(hoje) {
  const dataCaixa = document.getElementById("dataCaixa");
  const btnAbrir = document.getElementById("btnAbrirCaixa");
  const mensagem = document.getElementById("mensagem");

  const btnFechar = document.getElementById("btnFecharCaixa");
  const msgFechar = document.getElementById("mensagemFechar");
  const valorFinal = document.getElementById("valorFinalCaixa");

  const listaProdutos = document.getElementById("listaProdutos");
  const btnProdutos = document.getElementById("btnCarregarProdutos");

  if (!document.getElementById("dashCaixaStatus")) return;

  if (dataCaixa) dataCaixa.value = hoje;

  /* ===== ATUALIZAR DASHBOARD ===== */
  async function atualizarDashboard() {
    try {
      const caixa = await buscarCaixaAberto();

      if (caixa) {
        setText("dashCaixaStatus", "Aberto");
        setText("dashCaixaInfo", `Data: ${caixa.data}`);

        const resumo = await relatorioCaixa();
        const atual = resumo.find(r => r.caixa_id === caixa.id);

        setText("dashTotalVendido", formatMoney(atual?.total_vendido || 0));
        setText("dashQtdVendas", atual?.quantidade_vendas || 0);

      } else {
        setText("dashCaixaStatus", "Fechado");
        setText("dashCaixaInfo", "Abra o caixa abaixo");

        setText("dashTotalVendido", formatMoney(0));
        setText("dashQtdVendas", "0");
      }

    } catch (e) {
      setText("dashCaixaStatus", "Erro");
      setText("dashCaixaInfo", "Erro ao conectar API");
    }
  }

  await atualizarDashboard();

  /* ===== ABRIR CAIXA ===== */
  if (btnAbrir) {
    btnAbrir.onclick = async () => {
      const data = dataCaixa.value;
      const valor = document.getElementById("valorInicial").value;

      if (!data || !valor) {
        mensagem.textContent = "Preencha os campos.";
        return;
      }

      try {
        await abrirCaixa(data, valor);
        mensagem.textContent = "Caixa aberto!";
        atualizarDashboard();
      } catch (e) {
        mensagem.textContent = e.message;
      }
    };
  }

  /* ===== FECHAR CAIXA ===== */
  if (btnFechar) {
    btnFechar.onclick = async () => {
      if (!valorFinal.value) {
        msgFechar.textContent = "Informe o valor final.";
        return;
      }

      try {
        const caixa = await buscarCaixaAberto();

        if (!caixa) {
          msgFechar.textContent = "Nenhum caixa aberto.";
          return;
        }

        await fecharCaixa(caixa.id, valorFinal.value);
        msgFechar.textContent = "Caixa fechado!";
        valorFinal.value = "";

        atualizarDashboard();
      } catch (e) {
        msgFechar.textContent = e.message;
      }
    };
  }

  /* ===== PRODUTOS (AUTO + BOTÃO) ===== */
  async function carregarProdutos() {
    if (!listaProdutos) return;

    listaProdutos.innerHTML = "Carregando...";

    try {
      const produtos = await listarProdutos();

      listaProdutos.innerHTML = "";

      produtos.forEach(p => {
        const div = document.createElement("div");
        div.className = "produto-linha";
        div.innerHTML = `
          <strong>${p.nome}</strong><br>
          ${formatMoney(p.preco)}<br>
          Estoque: ${p.quantidade_estoque}
        `;
        listaProdutos.appendChild(div);
      });

    } catch (e) {
      listaProdutos.innerHTML = `<p>${e.message}</p>`;
    }
  }

  if (btnProdutos) btnProdutos.onclick = carregarProdutos;

  // 🔥 CARREGA AUTOMÁTICO
  carregarProdutos();
}

/* ================= RESTANTE DAS PÁGINAS (SEM ALTERAÇÃO) ================= */

function initCaixaPage() {}
function initProdutosPage() {}
function initVendasPage() {}
function initRelatoriosPage() {}
function initEstoquePage() {}
function initLoginPage() {}
function initUsuariosPage() {}
