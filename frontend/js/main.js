
document.addEventListener("DOMContentLoaded", () => {
  console.log("Front funcionando");

  const btn = document.getElementById("btnAbrirCaixa");

  if (btn) {
    btn.addEventListener("click", () => {
      alert("Caixa aberto com sucesso!");
    });
  }
});
