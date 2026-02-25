// Seleciona o botão do "olho" (mostrar/ocultar senha)
const eyeBtn = document.querySelector(".eyeBtn");

// Seleciona o campo de input da senha pelo ID
const senha = document.getElementById("senha");

// Adiciona um evento de clique no botão do olho
eyeBtn.addEventListener("click", () => {

    // Verifica o tipo atual do input:
    // Se for "password", altera para "text" (mostra a senha)
    // Se for "text", altera para "password" (oculta a senha)
    senha.type = senha.type === "password" ? "text" : "password";

    // Alterna a classe "active" no botão
    // Isso normalmente é usado no CSS para trocar o ícone
    // (ex: mostrar olho aberto ou fechado)
    eyeBtn.classList.toggle("active");
});