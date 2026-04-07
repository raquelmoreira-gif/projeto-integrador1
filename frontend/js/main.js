document.addEventListener("DOMContentLoaded", () => {
  console.log("Front funcionando");

  const btnAbrirCaixa = document.getElementById("btnAbrirCaixa");
  const mensagem = document.getElementById("mensagem");
  const dataCaixa = document.getElementById("dataCaixa");
  const valorInicial = document.getElementById("valorInicial");

  const btnCarregarProdutos = document.getElementById("btnCarregarProdutos");
  const listaProdutos = document.getElementById("listaProdutos");

  const btnAdicionarProduto = document.getElementById("btnAdicionarProduto");
  const listaVenda = document.getElementById("listaVenda");
  const totalVenda = document.getElementById("totalVenda");
  const qtdItensVenda = document.getElementById("qtdItensVenda");
  const mensagemVenda = document.getElementById("mensagemVenda");

  let itensVenda = [];
  let total = 0;

  const hoje = new Date().toISOString().split("T")[0];

  if (dataCaixa) {
    dataCaixa.value = hoje;
  }

  if (mensagem) {
    buscarCaixaAberto()
      .then((res) => {
        if (res && res.data) {
          mensagem.textContent = "Já existe um caixa aberto.";

          if (btnAbrirCaixa) {
            btnAbrirCaixa.disabled = true;
            btnAbrirCaixa.style.opacity = "0.6";
            btnAbrirCaixa.style.cursor = "not-allowed";
          }
        }
      })
      .catch(() => {});
  }

  if (btnAbrirCaixa) {
    btnAbrirCaixa.addEventListener("click", async () => {
      try {
        const data = dataCaixa.value;
        const valor = valorInicial.value;

        if (!data || !valor) {
          mensagem.textContent = "Preencha a data e o valor.";
          return;
        }

        const resposta = await abrirCaixa(data, valor);

        mensagem.textContent =
          resposta.message ||
          resposta.msg ||
          "Caixa aberto com sucesso!";
      } catch (error) {
        mensagem.textContent = error.message;
      }
    });
  }

  if (btnCarregarProdutos && listaProdutos) {
    btnCarregarProdutos.addEventListener("click", async () => {
      try {
        listaProdutos.innerHTML = "<p>Carregando produtos...</p>";

        const res = await listarProdutos();
        console.log("Resposta produtos:", res);

        const produtos = Array.isArray(res) ? res : res.data;

        listaProdutos.innerHTML = "";

        if (!Array.isArray(produtos) || produtos.length === 0) {
          listaProdutos.innerHTML = "<p>Nenhum produto encontrado.</p>";
          return;
        }

        produtos.forEach((produto) => {
          const div = document.createElement("div");
          div.style.padding = "12px 0";
          div.style.borderBottom = "1px solid #e0e0e0";

          div.innerHTML = `
            <strong>${produto.nome ?? "Sem nome"}</strong><br>
            Preço: R$ ${Number(produto.preco ?? 0).toFixed(2)}<br>
            Estoque: ${produto.quantidade_estoque ?? produto.estoque ?? 0}<br>
            Tipo: ${produto.tipo ?? "Não informado"}
          `;

          listaProdutos.appendChild(div);
        });
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        listaProdutos.innerHTML = `<p>${error.message}</p>`;
      }
    });
  }

  if (btnAdicionarProduto) {
    btnAdicionarProduto.addEventListener("click", () => {
      const nome = document.getElementById("nomeProduto").value;
      const quantidade = Number(document.getElementById("quantidadeProduto").value);
      const preco = Number(document.getElementById("precoProduto").value);

      if (!nome || !quantidade || !preco) {
        if (mensagemVenda) {
          mensagemVenda.textContent = "Preencha todos os campos do produto.";
        }
        return;
      }

      const subtotal = quantidade * preco;

      itensVenda.push({ nome, quantidade, preco, subtotal });

      renderizarVenda();
    });
  }

  function renderizarVenda() {
    if (!listaVenda || !totalVenda || !qtdItensVenda) return;

    listaVenda.innerHTML = "";
    total = 0;

    itensVenda.forEach((item) => {
      total += item.subtotal;

      const div = document.createElement("div");
      div.style.padding = "10px 0";
      div.style.borderBottom = "1px solid #e0e0e0";

      div.innerHTML = `
        <strong>${item.nome}</strong><br>
        ${item.quantidade} x R$ ${item.preco.toFixed(2)} = R$ ${item.subtotal.toFixed(2)}
      `;

      listaVenda.appendChild(div);
    });

    totalVenda.textContent = `R$ ${total.toFixed(2)}`;
    qtdItensVenda.textContent = itensVenda.length;

    if (mensagemVenda) {
      mensagemVenda.textContent = "";
    }
  }
});
