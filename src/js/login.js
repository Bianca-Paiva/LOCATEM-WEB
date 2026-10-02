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

const form = document.getElementById("formLogin");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    const dados = {
        email: email,
        senha: senha
    };

    try {
        const response = await fetch("https://localhost:7127/api/Login/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        const data = await response.json();

        if (response.ok) {
            // salva token
            localStorage.setItem("token", data.token);
            localStorage.setItem("nome", data.nome);

            alert("Login realizado com sucesso!");

            window.location.href = "./principalPage.html";

        } else {
            alert(data.mensagem || "Erro ao fazer login");
        }

    } catch (error) {
        console.error(error);
        alert("Erro ao conectar com o servidor");
    }
});