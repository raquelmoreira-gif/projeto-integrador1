document.addEventListener("DOMContentLoaded", () => {
  const hoje = new Date().toISOString().split("T")[0];

  initSidebarUsuario();
  initDashboard();
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
  localStorage.setItem("bia_usuario_id", id);
  localStorage.setItem("bia_usuario_nome", nome);
}

function getUsuarioId() {
  return localStorage.getItem("bia_usuario_id");
}

function getUsuarioNome() {
  return localStorage.getItem("bia_usuario_nome");
}

function clearUsuario() {
  localStorage.removeItem("bia_usuario_id");
  localStorage.removeItem("bia_usuario_nome");
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
  const btn    = document.getElementById("btnEntrarLogin");
  const msg    = document.getElementById("mensagemLogin");

  if (!select || !btn) return;

  carregarUsuarios();

  async function carregarUsuarios() {
    try {
      const users = await listarUsuarios();
      select.innerHTML = '<option value="">Selecione o operador</option>';
      users.forEach(u => {
        const opt = document.createElement("option");
        opt.value = u.id;
        opt.textContent = `${u.nome} (${u.tipo})`;
        select.appendChild(opt);
      });

      const idAtual = getUsuarioId();
      if (idAtual) select.value = idAtual;

    } catch (e) {
      if (msg) msg.textContent = "Erro ao carregar usuários: " + e.message;
    }
  }

  btn.onclick = () => {
    const id = select.value;
    if (!id) {
      if (msg) msg.textContent = "Selecione um operador.";
      return;
    }
    const nome = select.selectedOptions[0].textContent.split(" (")[0];
    setUsuario(id, nome);

    const destino = window.location.pathname.includes("/pages/")
      ? "../index.html"
      : "index.html";
    window.location.href = destino;
  };

  const btnSair = document.getElementById("btnSairLogin");
  if (btnSair) {
    btnSair.onclick = () => {
      clearUsuario();
      initSidebarUsuario();
      if (msg) msg.textContent = "Operador desconectado.";
      select.value = "";
    };
  }
}

/* ================= USUARIOS ================= */

function initUsuariosPage() {
  const form = document.getElementById("formNovoUsuario");
  const msg  = document.getElementById("mensagemUsuario");

  if (!form) return;

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (msg) msg.textContent = "Salvando…";

    try {
      await criarUsuario({
        nome:  document.getElementById("nuNome").value.trim(),
        email: document.getElementById("nuEmail").value.trim(),
        senha: document.getElementById("nuSenha").value,
        tipo:  document.getElementById("nuTipo").value
      });

      if (msg) msg.textContent = "✅ Usuário cadastrado com sucesso!";
      form.reset();

    } catch (err) {
      if (msg) msg.textContent = "❌ " + err.message;
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
      setText("dashCaixaInfo",   `Data: ${caixa.data || "—"}`);

      try {
        const rel   = await relatorioCaixa();
        const atual = rel.find(r => r.caixa_id === caixa.id);
        setText("dashTotalVendido", formatMoney(atual?.total_vendido));
        setText("dashQtdVendas",    atual?.quantidade_vendas || 0);
        setText("dashVendasInfo",   "No caixa aberto");
      } catch {
        setText("dashTotalVendido", formatMoney(0));
        setText("dashQtdVendas",    0);
      }

    } else {
      setText("dashCaixaStatus", "Fechado");
      setText("dashCaixaInfo",   "Abra o caixa abaixo");
      setText("dashTotalVendido", formatMoney(0));
      setText("dashQtdVendas",    0);
      setText("dashVendasInfo",   "—");
    }

  } catch (e) {
    setText("dashCaixaStatus", "Erro");
    setText("dashCaixaInfo",   e.message);
  }

  // Botão "Carregar Produtos" no dashboard
  const btnProd = document.getElementById("btnCarregarProdutos");
  if (btnProd) {
    btnProd.onclick = async () => {
      const lista = document.getElementById("listaProdutos");
      if (!lista) return;
      lista.innerHTML = "Carregando…";
      try {
        const produtos = await listarProdutos();
        if (!produtos.length) {
          lista.innerHTML = "<p>Nenhum produto cadastrado.</p>";
          return;
        }
        lista.innerHTML = produtos.map(p =>
          `<div class="produto-linha">
             <strong>${p.nome}</strong> — ${formatMoney(p.preco)}
             <span style="color:var(--text-muted);font-size:12px"> | Estoque: ${p.quantidade_estoque}</span>
           </div>`
        ).join("");
      } catch (e) {
        lista.innerHTML = `<p style="color:red">${e.message}</p>`;
      }
    };
  }

  // Botão abrir caixa no dashboard
  const btnAbrir = document.getElementById("btnAbrirCaixa");
  if (btnAbrir) {
    btnAbrir.onclick = async () => {
      const data  = document.getElementById("dataCaixa")?.value;
      const valor = document.getElementById("valorInicial")?.value;
      const msg   = document.getElementById("mensagem");
      if (!data || valor === "" || valor === null) {
        if (msg) msg.textContent = "❌ Preencha a data e o valor inicial.";
        return;
      }
      try {
        await abrirCaixa(data, valor);
        if (msg) msg.textContent = "✅ Caixa aberto!";
        initDashboard();
      } catch (e) {
        if (msg) msg.textContent = "❌ " + e.message;
      }
    };
  }
}

/* ================= CAIXA ================= */

function initCaixaPage(hoje) {
  const btnAbrir  = document.getElementById("btnAbrirCaixa");
  const btnFechar = document.getElementById("btnFecharCaixa");

  if (!btnAbrir && !btnFechar) return;

  const inputData = document.getElementById("dataCaixa");
  if (inputData && !inputData.value) inputData.value = hoje;

  carregarStatusCaixa();

  async function carregarStatusCaixa() {
    try {
      const caixa = await buscarCaixaAberto();
      if (caixa) {
        setText("caixaStatusTitulo", "Aberto");
        setText("caixaStatusInfo",   `Data: ${caixa.data || "—"} | Inicial: ${formatMoney(caixa.valor_inicial)}`);

        try {
          const rel   = await relatorioCaixa();
          const atual = rel.find(r => r.caixa_id === caixa.id);
          setText("caixaTotalDia",     formatMoney(atual?.total_vendido));
          setText("caixaTotalDiaInfo", `${atual?.quantidade_vendas || 0} venda(s)`);
        } catch { /* silencioso */ }

      } else {
        setText("caixaStatusTitulo", "Fechado");
        setText("caixaStatusInfo",   "Nenhum caixa aberto");
        setText("caixaTotalDia",     formatMoney(0));
        setText("caixaTotalDiaInfo", "—");
      }
    } catch (e) {
      setText("caixaStatusTitulo", "Erro");
      setText("caixaStatusInfo",   e.message);
    }
  }

  if (btnAbrir) {
    btnAbrir.onclick = async () => {
      const data  = document.getElementById("dataCaixa")?.value;
      const valor = document.getElementById("valorInicial")?.value;
      const msg   = document.getElementById("mensagem");

      if (!data || valor === "" || valor === null) {
        if (msg) msg.textContent = "❌ Preencha a data e o valor inicial.";
        return;
      }

      try {
        await abrirCaixa(data, valor);
        if (msg) msg.textContent = "✅ Caixa aberto com sucesso!";
        carregarStatusCaixa();
      } catch (e) {
        if (msg) msg.textContent = "❌ " + e.message;
      }
    };
  }

  if (btnFechar) {
    btnFechar.onclick = async () => {
      const valorFinal = document.getElementById("valorFinalCaixa")?.value;
      const msg        = document.getElementById("mensagemFechar");

      if (valorFinal === "" || valorFinal === null || valorFinal === undefined) {
        if (msg) msg.textContent = "❌ Informe o valor final contado.";
        return;
      }

      try {
        const caixa = await buscarCaixaAberto();
        if (!caixa) {
          if (msg) msg.textContent = "❌ Nenhum caixa aberto.";
          return;
        }
        await fecharCaixa(caixa.id, valorFinal);
        if (msg) msg.textContent = "✅ Caixa fechado com sucesso!";
        carregarStatusCaixa();
      } catch (e) {
        if (msg) msg.textContent = "❌ " + e.message;
      }
    };
  }
}

/* ================= PRODUTOS ================= */

function initProdutosPage() {
  const lista = document.getElementById("listaProdutos");
  const form  = document.getElementById("formNovoProduto");
  const msg   = document.getElementById("mensagemProduto");

  if (!lista && !form) return;

  async function carregar() {
    try {
      const produtos = await listarProdutos();

      if (lista) {
        if (!produtos.length) {
          lista.innerHTML = "<p>Nenhum produto cadastrado.</p>";
        } else {
          lista.innerHTML = produtos.map(p => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
              <div>
                <strong>${p.nome}</strong>
                <span style="margin-left:8px;font-size:12px;color:var(--text-muted)">${p.tipo}</span><br>
                <span>${formatMoney(p.preco)}</span>
                <span style="margin-left:12px;color:var(--text-muted);font-size:13px">Estoque: ${p.quantidade_estoque}</span>
              </div>
              <button type="button" class="btn-ghost" style="font-size:12px;padding:4px 10px;margin-top:0"
                onclick="abrirEditar('${p.id}','${p.nome.replace(/'/g,"\\'")}',${p.preco},${p.quantidade_estoque},'${p.tipo}')">
                Editar
              </button>
            </div>
          `).join("");
        }
      }

      // Select de movimentação
      const sel = document.getElementById("movProdutoSelect");
      if (sel) {
        sel.innerHTML = '<option value="">Selecione o produto</option>';
        produtos.forEach(p => {
          const opt = document.createElement("option");
          opt.value = p.id;
          opt.textContent = `${p.nome} (estoque: ${p.quantidade_estoque})`;
          sel.appendChild(opt);
        });
      }

    } catch (e) {
      if (lista) lista.innerHTML = `<p style="color:red">Erro: ${e.message}</p>`;
    }
  }

  carregar();

  const btnCarregar = document.getElementById("btnCarregarProdutos");
  if (btnCarregar) btnCarregar.onclick = carregar;

  if (form) {
    const npTipoSel = document.getElementById("npTipo");
    const extras    = document.getElementById("npConsignadoExtras");
    if (npTipoSel && extras) {
      npTipoSel.onchange = () => {
        extras.style.display = npTipoSel.value === "consignado" ? "block" : "none";
      };
    }

    form.onsubmit = async (e) => {
      e.preventDefault();
      if (msg) msg.textContent = "Salvando…";

      const body = {
        nome:               document.getElementById("npNome").value.trim(),
        preco:              Number(document.getElementById("npPreco").value),
        quantidade_estoque: Number(document.getElementById("npEstoque").value),
        tipo:               document.getElementById("npTipo").value
      };

      const artesaoId = document.getElementById("npArtesaoId")?.value.trim();
      if (artesaoId) body.artesao_id = artesaoId;

      const tipoRep = document.getElementById("npTipoRepasse")?.value;
      if (tipoRep === "porcentagem") {
        body.tipo_repasse = "porcentagem";
        body.porcentagem_repasse = Number(document.getElementById("npPorcentagemRepasse").value);
      } else if (tipoRep === "fixo") {
        body.tipo_repasse = "fixo";
        body.valor_custo = Number(document.getElementById("npValorCusto").value);
      }

      try {
        await criarProduto(body);
        if (msg) msg.textContent = "✅ Produto cadastrado!";
        form.reset();
        if (extras) extras.style.display = "none";
        carregar();
      } catch (err) {
        if (msg) msg.textContent = "❌ " + err.message;
      }
    };
  }

  // Edição
  const panelEditar = document.getElementById("panelEditar");
  const btnSalvar   = document.getElementById("btnSalvarEdicao");
  const btnCancelar = document.getElementById("btnCancelarEdicao");
  const msgEditar   = document.getElementById("mensagemEditar");

  window.abrirEditar = (id, nome, preco, estoque, tipo) => {
    if (!panelEditar) return;
    document.getElementById("editProdutoId").value  = id;
    document.getElementById("editNome").value       = nome;
    document.getElementById("editPreco").value      = preco;
    document.getElementById("editEstoque").value    = estoque;
    document.getElementById("editTipo").value       = tipo;
    panelEditar.style.display = "block";
    panelEditar.scrollIntoView({ behavior: "smooth" });

    const editTipoSel = document.getElementById("editTipo");
    const editExtras  = document.getElementById("editConsignadoExtras");
    if (editTipoSel && editExtras) {
      editExtras.style.display = tipo === "consignado" ? "block" : "none";
      editTipoSel.onchange = () => {
        editExtras.style.display = editTipoSel.value === "consignado" ? "block" : "none";
      };
    }
  };

  if (btnCancelar && panelEditar) {
    btnCancelar.onclick = () => { panelEditar.style.display = "none"; };
  }

  if (btnSalvar) {
    btnSalvar.onclick = async () => {
      const id = document.getElementById("editProdutoId").value;
      if (!id) return;
      if (msgEditar) msgEditar.textContent = "Salvando…";

      const body = {
        nome:               document.getElementById("editNome").value.trim(),
        preco:              Number(document.getElementById("editPreco").value),
        quantidade_estoque: Number(document.getElementById("editEstoque").value),
        tipo:               document.getElementById("editTipo").value
      };

      try {
        await atualizarProduto(id, body);
        if (msgEditar) msgEditar.textContent = "✅ Produto atualizado!";
        if (panelEditar) panelEditar.style.display = "none";
        carregar();
      } catch (err) {
        if (msgEditar) msgEditar.textContent = "❌ " + err.message;
      }
    };
  }

  // Movimentação de estoque
  const btnMov = document.getElementById("btnMovimentar");
  const msgMov = document.getElementById("msgMovimentacao");

  if (btnMov) {
    btnMov.onclick = async () => {
      const produtoId = document.getElementById("movProdutoSelect").value;
      const tipo      = document.getElementById("movTipo").value;
      const qtd       = document.getElementById("movQtd").value;
      const motivo    = document.getElementById("movMotivo").value.trim();

      if (!produtoId) {
        if (msgMov) msgMov.textContent = "❌ Selecione um produto.";
        return;
      }
      if (!qtd || Number(qtd) <= 0) {
        if (msgMov) msgMov.textContent = "❌ Informe uma quantidade válida.";
        return;
      }

      try {
        await movimentarEstoque(produtoId, { tipo, quantidade: Number(qtd), motivo: motivo || "ajuste_manual" });
        if (msgMov) msgMov.textContent = "✅ Movimentação registrada!";
        carregar();
      } catch (err) {
        if (msgMov) msgMov.textContent = "❌ " + err.message;
      }
    };
  }
}

/* ================= VENDAS ================= */

function initVendasPage() {
  const btnFinalizar = document.getElementById("btnFinalizarVenda");
  if (!btnFinalizar) return;

  let carrinho = [];

  const aviso = document.getElementById("avisoLoginVendas");
  if (aviso) aviso.style.display = getUsuarioId() ? "none" : "block";

  async function carregarProdutos() {
    const sel = document.getElementById("selectProdutoVenda");
    if (!sel) return;
    try {
      const produtos = await listarProdutos();
      sel.innerHTML = '<option value="">Selecione o produto</option>';
      produtos.forEach(p => {
        if (p.quantidade_estoque > 0) {
          const opt = document.createElement("option");
          opt.value = p.id;
          opt.dataset.nome  = p.nome;
          opt.dataset.preco = p.preco;
          opt.textContent   = `${p.nome} — ${formatMoney(p.preco)} (estoque: ${p.quantidade_estoque})`;
          sel.appendChild(opt);
        }
      });
    } catch (e) {
      console.error("Erro ao carregar produtos:", e.message);
    }
  }

  carregarProdutos();

  function renderCarrinho() {
    const lista = document.getElementById("listaVenda");
    setText("qtdItensVenda", carrinho.reduce((s, i) => s + i.quantidade, 0));
    const total = carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0);
    setText("totalVenda", formatMoney(total));

    if (!lista) return;

    if (!carrinho.length) {
      lista.innerHTML = "<p style='color:var(--text-muted)'>Nenhum produto adicionado.</p>";
      return;
    }

    lista.innerHTML = carrinho.map((item, idx) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
        <span><strong>${item.nome}</strong> × ${item.quantidade} = ${formatMoney(item.preco * item.quantidade)}</span>
        <button type="button" class="btn-ghost" style="font-size:12px;padding:3px 8px;color:red;margin-top:0"
          onclick="removerItemCarrinho(${idx})">Remover</button>
      </div>
    `).join("");
  }

  window.removerItemCarrinho = (idx) => {
    carrinho.splice(idx, 1);
    renderCarrinho();
  };

  renderCarrinho();

  const btnAdicionar = document.getElementById("btnAdicionarProduto");
  if (btnAdicionar) {
    btnAdicionar.onclick = () => {
      const sel = document.getElementById("selectProdutoVenda");
      const qtd = Number(document.getElementById("quantidadeProduto")?.value || 1);
      if (!sel?.value) return alert("Selecione um produto.");
      if (qtd <= 0) return alert("Quantidade inválida.");

      const opt   = sel.selectedOptions[0];
      const id    = sel.value;
      const nome  = opt.dataset.nome;
      const preco = Number(opt.dataset.preco);

      const existente = carrinho.find(i => i.produto_id === id);
      if (existente) {
        existente.quantidade += qtd;
      } else {
        carrinho.push({ produto_id: id, nome, preco, quantidade: qtd });
      }

      sel.value = "";
      const inputQtd = document.getElementById("quantidadeProduto");
      if (inputQtd) inputQtd.value = 1;
      renderCarrinho();
    };
  }

  btnFinalizar.onclick = async () => {
    const uid   = getUsuarioId();
    const msg   = document.getElementById("mensagemVenda");
    const forma = document.getElementById("formaPagamento")?.value;

    if (!uid) {
      if (msg) msg.textContent = "❌ Identifique o operador em Login.";
      return;
    }
    if (!carrinho.length) {
      if (msg) msg.textContent = "❌ Adicione ao menos um produto.";
      return;
    }
    if (!forma) {
      if (msg) msg.textContent = "❌ Selecione a forma de pagamento.";
      return;
    }

    if (msg) msg.textContent = "Registrando…";

    try {
      await criarVenda({
        usuario_id:      uid,
        forma_pagamento: forma,
        itens: carrinho.map(i => ({
          produto_id: i.produto_id,
          quantidade: i.quantidade
        }))
      });

      if (msg) msg.textContent = "✅ Venda registrada com sucesso!";
      carrinho = [];
      renderCarrinho();
      document.getElementById("formaPagamento").value = "";

    } catch (e) {
      if (msg) msg.textContent = "❌ " + e.message;
    }
  };
}

/* ================= RELATORIOS ================= */

function initRelatoriosPage() {
  if (!document.getElementById("relatoriosRoot")) return;

  carregar();

  async function carregar() {
    const msgErr = document.getElementById("relatoriosErro");

    try {
      const [dias, produtos, caixas, consignado] = await Promise.all([
        relatorioVendasDia().catch(() => []),
        relatorioVendasProduto().catch(() => []),
        relatorioCaixa().catch(() => []),
        relatorioConsignado().catch(() => [])
      ]);

      // Cards de topo — campos corretos da view relatorio_vendas_dia
      let total = 0, qtd = 0;
      dias.forEach(d => {
        total += Number(d.total_vendido || 0);
        qtd   += Number(d.quantidade_vendas || 0);
      });
      setText("relTotalVendido", formatMoney(total));
      setText("relQtdVendas",    qtd);

      // Produto mais vendido — campo correto: total_vendido (quantidade)
      const topProd = [...produtos].sort((a, b) => Number(b.total_vendido) - Number(a.total_vendido))[0];
      setText("relTopProduto",     topProd?.nome || "—");
      setText("relTopProdutoInfo", topProd ? `${topProd.total_vendido} un. vendidas` : "—");

      // Forma de pagamento mais usada — soma totais por forma nos caixas
      const formaTotais = {};
      caixas.forEach(c => {
        const formas = {
          dinheiro: Number(c.total_dinheiro || 0),
          pix:      Number(c.total_pix || 0),
          cartao:   Number(c.total_cartao || 0),
        };
        Object.entries(formas).forEach(([f, v]) => {
          formaTotais[f] = (formaTotais[f] || 0) + v;
        });
      });
      const topFormaEntry = Object.entries(formaTotais).sort((a, b) => b[1] - a[1])[0];
      setText("relTopForma",     topFormaEntry ? topFormaEntry[0] : "—");
      setText("relTopFormaInfo", topFormaEntry ? formatMoney(topFormaEntry[1]) : "—");

      // Resumo por forma de pagamento
      const resumoEl = document.getElementById("resumoPagamentos");
      if (resumoEl) {
        if (!caixas.length) {
          resumoEl.innerHTML = "<p>Nenhum dado.</p>";
        } else {
          // Agrega totais dos campos da view relatorio_caixa
          let totDinheiro = 0, totPix = 0, totCartao = 0, totVendas = 0, totGeral = 0;
          caixas.forEach(c => {
            totDinheiro += Number(c.total_dinheiro || 0);
            totPix      += Number(c.total_pix || 0);
            totCartao   += Number(c.total_cartao || 0);
            totVendas   += Number(c.quantidade_vendas || 0);
            totGeral    += Number(c.total_vendido || 0);
          });

          resumoEl.innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <thead>
                <tr style="border-bottom:2px solid var(--border)">
                  <th style="text-align:left;padding:8px 4px">Forma</th>
                  <th style="text-align:right;padding:8px 4px">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid var(--border)">
                  <td style="padding:8px 4px">Dinheiro</td>
                  <td style="padding:8px 4px;text-align:right">${formatMoney(totDinheiro)}</td>
                </tr>
                <tr style="border-bottom:1px solid var(--border)">
                  <td style="padding:8px 4px">Pix</td>
                  <td style="padding:8px 4px;text-align:right">${formatMoney(totPix)}</td>
                </tr>
                <tr style="border-bottom:1px solid var(--border)">
                  <td style="padding:8px 4px">Cartão (créd/déb)</td>
                  <td style="padding:8px 4px;text-align:right">${formatMoney(totCartao)}</td>
                </tr>
                <tr style="font-weight:700">
                  <td style="padding:8px 4px">Total geral (${totVendas} vendas)</td>
                  <td style="padding:8px 4px;text-align:right">${formatMoney(totGeral)}</td>
                </tr>
              </tbody>
            </table>`;
        }
      }

      // Produtos em destaque — campos: nome, total_vendido (qtd), faturamento
      const prodEl = document.getElementById("relatorioProdutos");
      if (prodEl) {
        if (!produtos.length) {
          prodEl.innerHTML = "<p>Nenhum dado.</p>";
        } else {
          const sorted = [...produtos].sort((a, b) => Number(b.total_vendido) - Number(a.total_vendido));
          prodEl.innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <thead>
                <tr style="border-bottom:2px solid var(--border)">
                  <th style="text-align:left;padding:8px 4px">Produto</th>
                  <th style="text-align:right;padding:8px 4px">Qtd vendida</th>
                  <th style="text-align:right;padding:8px 4px">Faturamento</th>
                </tr>
              </thead>
              <tbody>
                ${sorted.slice(0, 10).map(p => `
                  <tr style="border-bottom:1px solid var(--border)">
                    <td style="padding:8px 4px">${p.nome || "—"}</td>
                    <td style="padding:8px 4px;text-align:right">${p.total_vendido ?? "—"}</td>
                    <td style="padding:8px 4px;text-align:right">${formatMoney(p.faturamento)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>`;
        }
      }

      // Consignado — campos: artesao, produto, vendido, faturamento
      const consEl = document.getElementById("relatorioConsignado");
      if (consEl) {
        if (!consignado.length) {
          consEl.innerHTML = "<p>Nenhum dado de consignado.</p>";
        } else {
          consEl.innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <thead>
                <tr style="border-bottom:2px solid var(--border)">
                  <th style="text-align:left;padding:8px 4px">Artesão</th>
                  <th style="text-align:left;padding:8px 4px">Produto</th>
                  <th style="text-align:right;padding:8px 4px">Qtd</th>
                  <th style="text-align:right;padding:8px 4px">Faturamento</th>
                </tr>
              </thead>
              <tbody>
                ${consignado.map(c => `
                  <tr style="border-bottom:1px solid var(--border)">
                    <td style="padding:8px 4px">${c.artesao || "—"}</td>
                    <td style="padding:8px 4px">${c.produto || "—"}</td>
                    <td style="padding:8px 4px;text-align:right">${c.vendido ?? "—"}</td>
                    <td style="padding:8px 4px;text-align:right">${formatMoney(c.faturamento)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>`;
        }
      }

    } catch (e) {
      if (msgErr) msgErr.textContent = "Erro ao carregar relatórios: " + e.message;
    }
  }
}

/* ================= ESTOQUE ================= */

function initEstoquePage() {
  const tabela = document.getElementById("tabelaEstoque");
  const baixo  = document.getElementById("listaEstoqueBaixo");

  if (!tabela && !baixo) return;

  async function carregar() {
    try {
      const [estoque, estoqueBaixo] = await Promise.all([
        relatorioEstoque().catch(() => []),
        relatorioEstoqueBaixo().catch(() => [])
      ]);

      if (tabela) {
        if (!estoque.length) {
          tabela.innerHTML = "<p>Nenhum produto no estoque.</p>";
        } else {
          tabela.innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <thead>
                <tr style="border-bottom:2px solid var(--border)">
                  <th style="text-align:left;padding:8px 4px">Produto</th>
                  <th style="text-align:right;padding:8px 4px">Qtd</th>
                </tr>
              </thead>
              <tbody>
                ${estoque.map(p => `
                  <tr style="border-bottom:1px solid var(--border)">
                    <td style="padding:8px 4px">${p.nome || "—"}</td>
                    <td style="padding:8px 4px;text-align:right;${p.quantidade_estoque <= 2 ? 'color:red;font-weight:700' : ''}">${p.quantidade_estoque}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>`;
        }
      }

      if (baixo) {
        if (!estoqueBaixo.length) {
          baixo.innerHTML = "<p style='color:green'>✅ Nenhum produto com estoque baixo.</p>";
        } else {
          baixo.innerHTML = estoqueBaixo.map(p => `
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
              <strong>${p.nome || "—"}</strong>
              <span style="color:red;font-weight:bold">Qtd: ${p.quantidade_estoque}</span>
            </div>
          `).join("");
        }
      }

    } catch (e) {
      if (tabela) tabela.innerHTML = `<p style="color:red">Erro: ${e.message}</p>`;
    }
  }

  carregar();
}
