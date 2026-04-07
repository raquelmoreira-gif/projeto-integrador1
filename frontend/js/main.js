document.addEventListener("DOMContentLoaded", () => {
  console.log("Front funcionando");

  const btnAbrirCaixa = document.getElementById("btnAbrirCaixa");
  const mensagem = document.getElementById("mensagem");
  const dataCaixa = document.getElementById("dataCaixa");
  const valorInicial = document.getElementById("valorInicial");

  const btnCarregarProdutos = document.getElementById("btnCarregarProdutos");
  const listaProdutos = document.getElementById("listaProdutos");

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
        const res = await listarProdutos();
        const produtos = res.data || res;

        listaProdutos.innerHTML = "";

        if (!produtos || produtos.length === 0) {
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
            Estoque: ${produto.quantidade_estoque ?? 0}<br>
            Tipo: ${produto.tipo ?? "Não informado"}
          `;

          listaProdutos.appendChild(div);
        });
      } catch (error) {
        listaProdutos.innerHTML = "<p>Erro ao carregar produtos.</p>";
      }
    });
  }
});
