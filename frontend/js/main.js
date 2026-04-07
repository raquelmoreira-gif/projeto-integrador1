document.addEventListener("DOMContentLoaded", () => {
  console.log("Front funcionando");

  const btnAbrirCaixa = document.getElementById("btnAbrirCaixa");
  const mensagem = document.getElementById("mensagem");
  const dataCaixa = document.getElementById("dataCaixa");
  const valorInicial = document.getElementById("valorInicial");

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

        mensagem.textContent = resposta.message || "Caixa aberto com sucesso!";
      } catch (error) {
        mensagem.textContent = error.message;
      }
    });
  }
});
