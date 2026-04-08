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

function formatMoney(n) {
  const v = Number(n);
  if (Number.isNaN(v)) return "R$ 0,00";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function uuidValido(s) {
  return typeof s === "string" && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(s);
}

/** Extras do modelo de produto consignado (README database: artesao_id, repasse). */
function getConsignadoExtrasOrThrow(prefix) {
  const out = {};
  const art = document.getElementById(`${prefix}ArtesaoId`)?.value?.trim();
  if (art) {
    if (!uuidValido(art)) throw new Error("UUID do artesão inválido (use o id da tabela artesaos no Supabase).");
    out.artesao_id = art;
  }
  const tr = document.getElementById(`${prefix}TipoRepasse`)?.value || "";
  if (tr === "porcentagem") {
    const p = document.getElementById(`${prefix}PorcentagemRepasse`)?.value;
    if (p === "" || p == null) throw new Error("Informe a porcentagem de repasse.");
    out.tipo_repasse = "porcentagem";
    out.porcentagem_repasse = Number(p);
  } else if (tr === "fixo") {
    const v = document.getElementById(`${prefix}ValorCusto`)?.value;
    if (v === "" || v == null) throw new Error("Informe o valor de custo (repasse fixo).");
    out.tipo_repasse = "fixo";
    out.valor_custo = Number(v);
  }
  return out;
}

function atualizarBlocoConsignadoUI(prefix) {
  const tipoElId = prefix === "np" ? "npTipo" : "editTipo";
  const blockId = prefix === "np" ? "npConsignadoExtras" : "editConsignadoExtras";
  const tipo = document.getElementById(tipoElId)?.value;
  const block = document.getElementById(blockId);
  if (block) block.style.display = tipo === "consignado" ? "block" : "none";
}

function initSidebarUsuario() {
  const el = document.getElementById("usuarioLogado");
  const wrap = document.querySelector(".sidebar-user");
  if (!el || !wrap) return;

  const nome = getUsuarioNome();
  const id = getUsuarioId();
  if (nome && id) {
    el.textContent = nome;
    el.title = id;
  } else {
    el.textContent = "Não identificado";
    el.removeAttribute("title");
  }

  let sair = document.getElementById("btnSairSidebar");
  if (!sair) {
    sair = document.createElement("a");
    sair.id = "btnSairSidebar";
    sair.href = "#";
    sair.className = "link-sair";
    sair.textContent = "Sair";
    sair.addEventListener("click", (e) => {
      e.preventDefault();
      clearUsuario();
      el.textContent = "Não identificado";
      el.removeAttribute("title");
    });
    wrap.appendChild(document.createElement("br"));
    wrap.appendChild(sair);
  }
}

async function loadCaixaResumo(caixaId) {
  if (!caixaId) return null;
  try {
    const rows = await relatorioCaixa();
    const list = Array.isArray(rows) ? rows : [];
    return list.find((r) => r.caixa_id === caixaId) || null;
  } catch {
    return null;
  }
}

function initDashboard() {
  const elCaixa = document.getElementById("dashCaixaStatus");
  if (!elCaixa) return;

  const hoje = new Date().toISOString().split("T")[0];

  buscarCaixaAberto()
    .then(async (caixa) => {
      if (caixa) {
        setText("dashCaixaStatus", "Aberto");
        setText("dashCaixaInfo", `Data: ${caixa.data || "—"}`);
        const resumo = await loadCaixaResumo(caixa.id);
        const total = resumo ? Number(resumo.total_vendido) : 0;
        const qtd = resumo ? Number(resumo.quantidade_vendas) : 0;
        setText("dashTotalVendido", formatMoney(total));
        setText("dashQtdVendas", String(qtd));
        setText("dashVendasInfo", resumo ? "Caixa atual" : "Sem vendas ainda");
      } else {
        setText("dashCaixaStatus", "Fechado");
        setText("dashCaixaInfo", "Abra o caixa na página Caixa");
        setText("dashTotalVendido", formatMoney(0));
        setText("dashQtdVendas", "0");
        setText("dashVendasInfo", "—");
      }
    })
    .catch(() => {
      setText("dashCaixaStatus", "—");
      setText("dashCaixaInfo", "Erro ao consultar API");
    });

  const dataCaixa = document.getElementById("dataCaixa");
  const btnAbrir = document.getElementById("btnAbrirCaixa");
  const mensagem = document.getElementById("mensagem");
  const listaProdutos = document.getElementById("listaProdutos");
  const btnCarregar = document.getElementById("btnCarregarProdutos");

  if (dataCaixa) dataCaixa.value = hoje;

  if (mensagem && btnAbrir) {
    buscarCaixaAberto()
      .then((caixa) => {
        if (caixa) {
          mensagem.textContent = "Já existe um caixa aberto.";
          btnAbrir.disabled = true;
          btnAbrir.style.opacity = "0.6";
          btnAbrir.style.cursor = "not-allowed";
        }
      })
      .catch(() => {});
  }

  if (btnAbrir && mensagem) {
    btnAbrir.addEventListener("click", async () => {
      const data = dataCaixa?.value;
      const valor = document.getElementById("valorInicial")?.value;
      if (!data || !valor) {
        mensagem.textContent = "Preencha a data e o valor.";
        return;
      }
      try {
        await abrirCaixa(data, valor);
        mensagem.textContent = "Caixa aberto com sucesso!";
        btnAbrir.disabled = true;
        btnAbrir.style.opacity = "0.6";
        btnAbrir.style.cursor = "not-allowed";
        window.location.reload();
      } catch (e) {
        mensagem.textContent = e.message;
      }
    });
  }

  if (btnCarregar && listaProdutos) {
    btnCarregar.addEventListener("click", () =>
      renderListaProdutos(listaProdutos, { editable: false })
    );
  }
}

function initCaixaPage(hoje) {
  const dataCaixa = document.getElementById("dataCaixa");
  if (!document.getElementById("btnFecharCaixa")) return;

  if (dataCaixa) dataCaixa.value = hoje;

  const btnAbrir = document.getElementById("btnAbrirCaixa");
  const mensagem = document.getElementById("mensagem");
  const statusTitulo = document.getElementById("caixaStatusTitulo");
  const statusInfo = document.getElementById("caixaStatusInfo");
  const totalDia = document.getElementById("caixaTotalDia");
  const totalDiaInfo = document.getElementById("caixaTotalDiaInfo");

  function refreshCaixaUi(caixa, resumo) {
    if (statusTitulo) statusTitulo.textContent = caixa ? "Aberto" : "Fechado";
    if (statusInfo)
      statusInfo.textContent = caixa
        ? `Data ${caixa.data || "—"} · Inicial ${formatMoney(caixa.valor_inicial)}`
        : "Nenhum caixa aberto";
    if (totalDia)
      totalDia.textContent = resumo
        ? formatMoney(resumo.total_vendido)
        : formatMoney(0);
    if (totalDiaInfo)
      totalDiaInfo.textContent = resumo
        ? `${resumo.quantidade_vendas || 0} venda(s)`
        : "—";
    if (btnAbrir) {
      btnAbrir.disabled = !!caixa;
      btnAbrir.style.opacity = caixa ? "0.6" : "1";
      btnAbrir.style.cursor = caixa ? "not-allowed" : "pointer";
    }
    if (mensagem && caixa) mensagem.textContent = "Caixa em operação.";
    if (mensagem && !caixa) mensagem.textContent = "";
  }

  buscarCaixaAberto()
    .then(async (caixa) => {
      const resumo = caixa ? await loadCaixaResumo(caixa.id) : null;
      refreshCaixaUi(caixa, resumo);
    })
    .catch(() => {
      refreshCaixaUi(null, null);
    });

  if (btnAbrir && mensagem) {
    btnAbrir.addEventListener("click", async () => {
      const data = dataCaixa?.value;
      const valor = document.getElementById("valorInicial")?.value;
      if (!data || !valor) {
        mensagem.textContent = "Preencha a data e o valor.";
        return;
      }
      try {
        await abrirCaixa(data, valor);
        mensagem.textContent = "Caixa aberto com sucesso!";
        const caixa = await buscarCaixaAberto();
        const resumo = caixa ? await loadCaixaResumo(caixa.id) : null;
        refreshCaixaUi(caixa, resumo);
      } catch (e) {
        mensagem.textContent = e.message;
      }
    });
  }

  const btnFechar = document.getElementById("btnFecharCaixa");
  const msgFechar = document.getElementById("mensagemFechar");
  const inputFinal = document.getElementById("valorFinalCaixa");

  if (btnFechar && msgFechar && inputFinal) {
    btnFechar.addEventListener("click", async () => {
      const vf = inputFinal.value;
      if (vf === "" || vf === null) {
        msgFechar.textContent = "Informe o valor final.";
        return;
      }
      try {
        const caixa = await buscarCaixaAberto();
        if (!caixa) {
          msgFechar.textContent = "Não há caixa aberto.";
          return;
        }
        await fecharCaixa(caixa.id, vf);
        msgFechar.textContent = "Caixa fechado com sucesso.";
        inputFinal.value = "";
        refreshCaixaUi(null, null);
      } catch (e) {
        msgFechar.textContent = e.message;
      }
    });
  }
}

function renderListaProdutos(container, options = {}) {
  const { editable = false } = options;
  container.innerHTML = "<p>Carregando produtos...</p>";
  listarProdutos()
    .then((produtos) => {
      const list = Array.isArray(produtos) ? produtos : [];
      container.innerHTML = "";
      if (list.length === 0) {
        container.innerHTML = "<p>Nenhum produto encontrado.</p>";
        return;
      }
      list.forEach((produto) => {
        const div = document.createElement("div");
        div.className = "produto-linha";
        const id = produto.id || "";
        if (editable && id) {
          div.dataset.pid = id;
          div.dataset.nome = produto.nome ?? "";
          div.dataset.preco = String(produto.preco ?? "");
          div.dataset.estoque = String(produto.quantidade_estoque ?? 0);
          div.dataset.tipo = produto.tipo ?? "proprio";
          div.dataset.artesaoId = produto.artesao_id || "";
          div.dataset.tipoRepasse = produto.tipo_repasse || "";
          div.dataset.porcentagemRepasse =
            produto.porcentagem_repasse != null
              ? String(produto.porcentagem_repasse)
              : "";
          div.dataset.valorCusto =
            produto.valor_custo != null ? String(produto.valor_custo) : "";
        }
        const botoes = editable
          ? `<div class="produto-acoes">
          <button type="button" class="btn-inline" data-edit-id="${id}">Editar</button>
          <button type="button" class="btn-inline btn-inline--sec" data-mov-id="${id}">Movimentar</button>
        </div>`
          : "";
        div.innerHTML = `
          <strong>${produto.nome ?? "Sem nome"}</strong><br>
          Preço: ${formatMoney(produto.preco ?? 0)}<br>
          Estoque: ${produto.quantidade_estoque ?? 0}<br>
          Tipo: ${produto.tipo ?? "—"}
          ${botoes}
        `;
        container.appendChild(div);
      });
    })
    .catch((e) => {
      container.innerHTML = `<p class="msg-erro">${e.message}</p>`;
    });
}

function initProdutosPage() {
  const btn = document.getElementById("btnCarregarProdutos");
  const lista = document.getElementById("listaProdutos");
  const form = document.getElementById("formNovoProduto");
  const msg = document.getElementById("mensagemProduto");
  const panelEditar = document.getElementById("panelEditar");
  const msgEdit = document.getElementById("mensagemEditar");

  async function preencherSelectMovimentacao() {
    const sel = document.getElementById("movProdutoSelect");
    if (!sel) return;
    sel.innerHTML = '<option value="">Carregando…</option>';
    try {
      const produtos = await listarProdutos();
      const list = Array.isArray(produtos) ? produtos : [];
      sel.innerHTML = '<option value="">Selecione o produto</option>';
      list.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = `${p.nome} (est. ${p.quantidade_estoque ?? 0})`;
        sel.appendChild(opt);
      });
    } catch {
      sel.innerHTML = '<option value="">Erro ao carregar</option>';
    }
  }

  if (btn && lista) {
    btn.addEventListener("click", () => {
      renderListaProdutos(lista, { editable: true });
      preencherSelectMovimentacao();
    });

    lista.addEventListener("click", (e) => {
      const editBtn = e.target.closest("[data-edit-id]");
      const movBtn = e.target.closest("[data-mov-id]");
      if (editBtn) {
        const linha = editBtn.closest(".produto-linha");
        if (!linha || !panelEditar) return;
        const id = linha.dataset.pid || editBtn.getAttribute("data-edit-id");
        if (!id) return;
        document.getElementById("editProdutoId").value = id;
        document.getElementById("editNome").value = linha.dataset.nome || "";
        document.getElementById("editPreco").value = linha.dataset.preco || "";
        document.getElementById("editEstoque").value = linha.dataset.estoque || "";
        const tipoSel = document.getElementById("editTipo");
        if (tipoSel) {
          tipoSel.value =
            linha.dataset.tipo === "consignado" ? "consignado" : "proprio";
        }
        const editArtesao = document.getElementById("editArtesaoId");
        if (editArtesao) editArtesao.value = linha.dataset.artesaoId || "";
        const trSel = document.getElementById("editTipoRepasse");
        if (trSel) trSel.value = linha.dataset.tipoRepasse || "";
        const editPorc = document.getElementById("editPorcentagemRepasse");
        if (editPorc) editPorc.value = linha.dataset.porcentagemRepasse || "";
        const editCusto = document.getElementById("editValorCusto");
        if (editCusto) editCusto.value = linha.dataset.valorCusto || "";
        atualizarBlocoConsignadoUI("edit");
        panelEditar.style.display = "block";
        panelEditar.scrollIntoView({ behavior: "smooth", block: "nearest" });
        if (msgEdit) msgEdit.textContent = "";
      }
      if (movBtn) {
        const id = movBtn.getAttribute("data-mov-id");
        preencherSelectMovimentacao().then(() => {
          const sel = document.getElementById("movProdutoSelect");
          if (sel && id) sel.value = id;
          document.getElementById("panelMovimentar")?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        });
      }
    });
  }

  document.getElementById("npTipo")?.addEventListener("change", () =>
    atualizarBlocoConsignadoUI("np")
  );
  document.getElementById("editTipo")?.addEventListener("change", () =>
    atualizarBlocoConsignadoUI("edit")
  );
  atualizarBlocoConsignadoUI("np");

  document.getElementById("btnCancelarEdicao")?.addEventListener("click", () => {
    if (panelEditar) panelEditar.style.display = "none";
    if (msgEdit) msgEdit.textContent = "";
  });

  document.getElementById("btnSalvarEdicao")?.addEventListener("click", async () => {
    const id = document.getElementById("editProdutoId")?.value;
    const nome = document.getElementById("editNome")?.value?.trim();
    const preco = document.getElementById("editPreco")?.value;
    const tipo = document.getElementById("editTipo")?.value;
    const estoque = document.getElementById("editEstoque")?.value;
    if (!id || !nome || preco === "" || !tipo || estoque === "") {
      if (msgEdit) msgEdit.textContent = "Preencha nome, preço, tipo e estoque.";
      return;
    }
    const body = {
      nome,
      preco: Number(preco),
      tipo,
      quantidade_estoque: Number(estoque),
    };
    if (tipo === "proprio") {
      body.artesao_id = null;
      body.tipo_repasse = null;
      body.porcentagem_repasse = null;
      body.valor_custo = null;
    } else {
      try {
        Object.assign(body, getConsignadoExtrasOrThrow("edit"));
      } catch (err) {
        if (msgEdit) msgEdit.textContent = err.message;
        return;
      }
    }
    try {
      await atualizarProduto(id, body);
      if (msgEdit) msgEdit.textContent = "Alterações salvas.";
      if (panelEditar) panelEditar.style.display = "none";
      if (lista) renderListaProdutos(lista, { editable: true });
      preencherSelectMovimentacao();
    } catch (e) {
      if (msgEdit) msgEdit.textContent = e.message;
    }
  });

  document.getElementById("btnMovimentar")?.addEventListener("click", async () => {
    const sel = document.getElementById("movProdutoSelect");
    const tipo = document.getElementById("movTipo")?.value;
    const qtd = document.getElementById("movQtd")?.value;
    const motivo = document.getElementById("movMotivo")?.value?.trim();
    const msgMov = document.getElementById("msgMovimentacao");
    const pid = sel?.value;
    if (!pid || !tipo || !qtd || Number(qtd) <= 0) {
      if (msgMov) msgMov.textContent = "Selecione produto, tipo e quantidade válida.";
      return;
    }
    try {
      await movimentarEstoque(pid, {
        tipo,
        quantidade: Number(qtd),
        motivo: motivo || "ajuste_manual",
      });
      if (msgMov) msgMov.textContent = "Movimentação registrada.";
      document.getElementById("movQtd").value = "";
      document.getElementById("movMotivo").value = "";
      if (lista) renderListaProdutos(lista, { editable: true });
      preencherSelectMovimentacao();
    } catch (e) {
      if (msgMov) msgMov.textContent = e.message;
    }
  });

  if (form && msg) {
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const nome = document.getElementById("npNome")?.value?.trim();
      const preco = document.getElementById("npPreco")?.value;
      const qtd = document.getElementById("npEstoque")?.value;
      const tipo = document.getElementById("npTipo")?.value;
      if (!nome || preco === "" || qtd === "" || !tipo) {
        msg.textContent = "Preencha todos os campos.";
        return;
      }
      const body = {
        nome,
        preco: Number(preco),
        quantidade_estoque: Number(qtd),
        tipo,
      };
      if (tipo === "consignado") {
        try {
          Object.assign(body, getConsignadoExtrasOrThrow("np"));
        } catch (err) {
          msg.textContent = err.message;
          return;
        }
      }
      try {
        await criarProduto(body);
        msg.textContent = "Produto cadastrado.";
        form.reset();
        atualizarBlocoConsignadoUI("np");
        if (lista) renderListaProdutos(lista, { editable: true });
        preencherSelectMovimentacao();
      } catch (e) {
        msg.textContent = e.message;
      }
    });
  }
}

function initVendasPage() {
  const selectProduto = document.getElementById("selectProdutoVenda");
  const listaVenda = document.getElementById("listaVenda");
  const totalVenda = document.getElementById("totalVenda");
  const qtdItensVenda = document.getElementById("qtdItensVenda");
  const mensagemVenda = document.getElementById("mensagemVenda");
  const avisoLogin = document.getElementById("avisoLoginVendas");

  if (!selectProduto || !listaVenda) return;

  let itensVenda = [];

  if (avisoLogin) {
    if (getUsuarioId()) {
      avisoLogin.style.display = "none";
    } else {
      avisoLogin.style.display = "block";
    }
  }

  async function carregarSelectProdutos() {
    selectProduto.innerHTML = '<option value="">Carregando...</option>';
    try {
      const produtos = await listarProdutos();
      const list = Array.isArray(produtos) ? produtos : [];
      selectProduto.innerHTML = '<option value="">Selecione o produto</option>';
      list.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = `${p.nome} — ${formatMoney(p.preco)} (est. ${p.quantidade_estoque ?? 0})`;
        opt.dataset.preco = String(p.preco ?? 0);
        opt.dataset.nome = p.nome || "";
        selectProduto.appendChild(opt);
      });
    } catch (e) {
      selectProduto.innerHTML = '<option value="">Erro ao carregar</option>';
      if (mensagemVenda) mensagemVenda.textContent = e.message;
    }
  }

  carregarSelectProdutos();

  function renderizarVenda() {
    listaVenda.innerHTML = "";
    let total = 0;
    itensVenda.forEach((item) => {
      total += item.subtotal;
      const div = document.createElement("div");
      div.className = "venda-item";
      div.innerHTML = `
        <div>
          <strong>${item.nome}</strong><br>
          ${item.quantidade} × ${formatMoney(item.preco)} = ${formatMoney(item.subtotal)}
        </div>
        <button type="button" class="btn-remover" data-pid="${item.produto_id}">Remover</button>
      `;
      listaVenda.appendChild(div);
    });
    listaVenda.querySelectorAll(".btn-remover").forEach((b) => {
      b.addEventListener("click", () => {
        const pid = b.getAttribute("data-pid");
        itensVenda = itensVenda.filter((x) => x.produto_id !== pid);
        renderizarVenda();
      });
    });
    if (totalVenda) totalVenda.textContent = formatMoney(total);
    if (qtdItensVenda) qtdItensVenda.textContent = String(itensVenda.length);
    if (mensagemVenda) mensagemVenda.textContent = "";
  }

  const btnAdd = document.getElementById("btnAdicionarProduto");
  if (btnAdd) {
    btnAdd.addEventListener("click", () => {
      const id = selectProduto.value;
      const q = Number(document.getElementById("quantidadeProduto")?.value);
      const opt = selectProduto.selectedOptions[0];
      if (!id || !q || q <= 0) {
        if (mensagemVenda)
          mensagemVenda.textContent = "Selecione o produto e a quantidade.";
        return;
      }
      const preco = Number(opt?.dataset?.preco || 0);
      const nome = opt?.dataset?.nome || opt?.textContent || "Produto";
      const existente = itensVenda.find((x) => x.produto_id === id);
      if (existente) {
        existente.quantidade += q;
        existente.subtotal = existente.quantidade * existente.preco;
      } else {
        itensVenda.push({
          produto_id: id,
          nome,
          preco,
          quantidade: q,
          subtotal: preco * q,
        });
      }
      renderizarVenda();
    });
  }

  const btnFin = document.getElementById("btnFinalizarVenda");
  if (btnFin) {
    btnFin.addEventListener("click", async () => {
      const uid = getUsuarioId();
      const forma = document.getElementById("formaPagamento")?.value;
      if (!uid) {
        if (mensagemVenda)
          mensagemVenda.textContent = "Faça login e selecione o operador.";
        return;
      }
      if (!forma) {
        if (mensagemVenda)
          mensagemVenda.textContent = "Selecione a forma de pagamento.";
        return;
      }
      if (itensVenda.length === 0) {
        if (mensagemVenda)
          mensagemVenda.textContent = "Adicione ao menos um item.";
        return;
      }
      try {
        await criarVenda({
          usuario_id: uid,
          forma_pagamento: forma,
          itens: itensVenda.map((i) => ({
            produto_id: i.produto_id,
            quantidade: i.quantidade,
          })),
        });
        if (mensagemVenda) mensagemVenda.textContent = "Venda registrada com sucesso.";
        itensVenda = [];
        renderizarVenda();
        carregarSelectProdutos();
      } catch (e) {
        if (mensagemVenda) mensagemVenda.textContent = e.message;
      }
    });
  }
}

function initRelatoriosPage() {
  const host = document.getElementById("relatoriosRoot");
  if (!host) return;

  const erroEl = document.getElementById("relatoriosErro");
  if (erroEl) erroEl.textContent = "";

  Promise.all([
    relatorioVendasDia().catch(() => []),
    relatorioVendasProduto().catch(() => []),
    relatorioCaixa().catch(() => []),
    relatorioConsignado().catch(() => []),
  ])
    .then(([porDia, porProd, porCaixa, consignadoRows]) => {
      const dias = Array.isArray(porDia) ? porDia : [];
      const prods = Array.isArray(porProd) ? porProd : [];
      const caixas = Array.isArray(porCaixa) ? porCaixa : [];
      const consignado = Array.isArray(consignadoRows) ? consignadoRows : [];

      let totalGeral = 0;
      let qtdVendas = 0;
      dias.forEach((d) => {
        totalGeral += Number(d.total_vendido) || 0;
        qtdVendas += Number(d.quantidade_vendas) || 0;
      });

      const sorted = [...prods].sort(
        (a, b) => (Number(b.total_vendido) || 0) - (Number(a.total_vendido) || 0)
      );
      const top = sorted[0];

      let pix = 0,
        din = 0,
        card = 0;
      caixas.forEach((c) => {
        pix += Number(c.total_pix) || 0;
        din += Number(c.total_dinheiro) || 0;
        card += Number(c.total_cartao) || 0;
      });
      const formas = [
        { k: "Pix", v: pix },
        { k: "Dinheiro", v: din },
        { k: "Cartão (déb./créd.)", v: card },
      ].sort((a, b) => b.v - a.v);
      const topForma = formas[0];

      setText("relTotalVendido", formatMoney(totalGeral));
      setText("relQtdVendas", String(qtdVendas));
      setText(
        "relTopProduto",
        top ? top.nome : "—"
      );
      setText(
        "relTopProdutoInfo",
        top ? `${top.total_vendido} un.` : "Sem dados"
      );
      setText(
        "relTopForma",
        topForma && topForma.v > 0 ? topForma.k : "—"
      );
      setText(
        "relTopFormaInfo",
        topForma && topForma.v > 0 ? formatMoney(topForma.v) : "—"
      );

      const payEl = document.getElementById("resumoPagamentos");
      if (payEl) {
        payEl.innerHTML = formas
          .map(
            (f) => `
          <div class="rel-linha">
            <strong>${f.k}</strong><br>
            Total: ${formatMoney(f.v)}
          </div>
        `
          )
          .join("");
      }

      const prodEl = document.getElementById("relatorioProdutos");
      if (prodEl) {
        if (sorted.length === 0) {
          prodEl.innerHTML = "<p>Nenhuma venda registrada.</p>";
        } else {
          prodEl.innerHTML = sorted
            .map(
              (p) => `
            <div class="rel-linha">
              <strong>${p.nome}</strong><br>
              Vendidos: ${p.total_vendido} · ${formatMoney(p.faturamento || 0)}
            </div>
          `
            )
            .join("");
        }
      }

      const consigEl = document.getElementById("relatorioConsignado");
      if (consigEl) {
        if (consignado.length === 0) {
          consigEl.innerHTML =
            "<p>Nenhum registro na view <code>relatorio_consignado</code> (vendas pagas de produtos consignados com artesão).</p>";
        } else {
          consigEl.innerHTML = `
            <table class="data-table">
              <thead><tr><th>Artesão</th><th>Produto</th><th>Vendido</th><th>Faturamento</th></tr></thead>
              <tbody>
                ${consignado
                  .map(
                    (r) =>
                      `<tr><td>${r.artesao ?? "—"}</td><td>${r.produto ?? "—"}</td><td>${r.vendido ?? 0}</td><td>${formatMoney(r.faturamento || 0)}</td></tr>`
                  )
                  .join("")}
              </tbody>
            </table>`;
        }
      }
    })
    .catch((e) => {
      if (erroEl) erroEl.textContent = `Erro ao carregar relatórios: ${e.message}`;
    });
}

function initEstoquePage() {
  const tabela = document.getElementById("tabelaEstoque");
  const alerta = document.getElementById("listaEstoqueBaixo");
  if (!tabela || !alerta) return;

  Promise.all([relatorioEstoque().catch(() => []), relatorioEstoqueBaixo().catch(() => [])])
    .then(([todos, baixos]) => {
      const list = Array.isArray(todos) ? todos : [];
      const baixoList = Array.isArray(baixos) ? baixos : [];

      if (list.length === 0) {
        tabela.innerHTML = "<p>Nenhum produto.</p>";
      } else {
        tabela.innerHTML = `
          <table class="data-table">
            <thead><tr><th>Produto</th><th>Estoque</th></tr></thead>
            <tbody>
              ${list
                .map(
                  (r) =>
                    `<tr><td>${r.nome ?? "—"}</td><td>${r.quantidade_estoque ?? 0}</td></tr>`
                )
                .join("")}
            </tbody>
          </table>
        `;
      }

      if (baixoList.length === 0) {
        alerta.innerHTML = "<p>Nenhum item com estoque baixo (≤2).</p>";
      } else {
        alerta.innerHTML = baixoList
          .map(
            (p) =>
              `<div class="rel-linha"><strong>${p.nome}</strong> — ${p.quantidade_estoque} un.</div>`
          )
          .join("");
      }
    })
    .catch((e) => {
      tabela.innerHTML = `<p class="msg-erro">${e.message}</p>`;
    });
}

function initLoginPage() {
  const select = document.getElementById("selectUsuarioLogin");
  const btn = document.getElementById("btnEntrarLogin");
  const msg = document.getElementById("mensagemLogin");
  if (!select || !btn) return;

  listarUsuarios()
    .then((users) => {
      const list = Array.isArray(users) ? users : [];
      select.innerHTML = '<option value="">Selecione o operador</option>';
      list.forEach((u) => {
        const opt = document.createElement("option");
        opt.value = u.id;
        opt.textContent = `${u.nome} (${u.tipo})`;
        select.appendChild(opt);
      });
    })
    .catch((e) => {
      if (msg) msg.textContent = e.message;
    });

  btn.addEventListener("click", () => {
    const id = select.value;
    const opt = select.selectedOptions[0];
    if (!id) {
      if (msg) msg.textContent = "Selecione um usuário.";
      return;
    }
    const nome = opt?.textContent?.split(" (")[0] || "Operador";
    setUsuario(id, nome);
    if (msg) msg.textContent = "Sessão iniciada. Redirecionando...";
    window.location.href = "../index.html";
  });

  const btnSair = document.getElementById("btnSairLogin");
  if (btnSair) {
    btnSair.addEventListener("click", () => {
      clearUsuario();
      if (msg) msg.textContent = "Operador removido deste navegador.";
    });
  }
}

function initUsuariosPage() {
  const form = document.getElementById("formNovoUsuario");
  const msg = document.getElementById("mensagemUsuario");
  if (!form || !msg) return;

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const nome = document.getElementById("nuNome")?.value?.trim();
    const email = document.getElementById("nuEmail")?.value?.trim();
    const senha = document.getElementById("nuSenha")?.value;
    const tipo = document.getElementById("nuTipo")?.value;
    if (!nome || !email || !senha || !tipo) {
      msg.textContent = "Preencha nome, e-mail, senha e tipo.";
      return;
    }
    try {
      await criarUsuario({ nome, email, senha, tipo });
      msg.textContent = "Usuário cadastrado. Ele já pode ser selecionado em Entrar.";
      form.reset();
    } catch (e) {
      msg.textContent = e.message;
    }
  });
}
