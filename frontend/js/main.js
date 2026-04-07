document.addEventListener("DOMContentLoaded", () => {
  console.log("Front funcionando");

  const btnAbrirCaixa = document.getElementById("btnAbrirCaixa");
  const mensagem = document.getElementById("mensagem");
  const dataCaixa = document.getElementById("dataCaixa");
  const valorInicial = document.getElementById("valorInicial");

    const hoje = new Date().toISOString().split("T")[0];

  if (dataCaixa) {
    dataCaixa.value = hoje;
  }

  // 🔹 Verifica se já existe caixa aberto ao carregar
  if (mensagem) {
    buscarCaixaAberto()
      .then((res) => {
        if (res && res.data) {
          mensagem.textContent = "Já existe um caixa aberto.";
        }
      })
      .catch(() => {
        // ignora erro por enquanto
      });
  }

  // 🔹 Abrir caixa
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
});
