// ================= CPF =================
const cpfInput = document.getElementById("cpf");

cpfInput.addEventListener("input", function (e) {
    let valor = e.target.value;

    valor = valor.replace(/\D/g, "");
    valor = valor.substring(0, 11);

    valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
    valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
    valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    e.target.value = valor;
});


// ================= MOSTRAR/OCULTAR SENHA =================
const eyeButtons = document.querySelectorAll(".eyeBtn");

eyeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {

        const input = btn.closest(".inputWrapper").querySelector("input");

        input.type = input.type === "password" ? "text" : "password";
        btn.classList.toggle("active");
    });
});


// ================= VALIDAÇÃO DE SENHA =================
const senha = document.getElementById("senha");
const confirmarSenha = document.getElementById("confirmarSenha");
const erroSenha = document.getElementById("erroSenha");
const forcaSenha = document.getElementById("forcaSenha");
const btnCriarConta = document.getElementById("btnCriarConta");

function verificarForcaSenha(valor) {

    let pontuacao = 0;

    if (valor.length >= 8) pontuacao++;
    if (/[a-z]/.test(valor)) pontuacao++;
    if (/[A-Z]/.test(valor)) pontuacao++;
    if (/[0-9]/.test(valor)) pontuacao++;
    if (/[^A-Za-z0-9]/.test(valor)) pontuacao++;

    if (valor.length === 0) {
        forcaSenha.textContent = "";
        forcaSenha.className = "forcaSenha";
        return false;
    }

    if (pontuacao <= 2) {
        forcaSenha.textContent = "Senha fraca";
        forcaSenha.className = "forcaSenha fraca";
        return false;
    }

    if (pontuacao <= 4) {
        forcaSenha.textContent = "Senha média";
        forcaSenha.className = "forcaSenha media";
        return false;
    }

    if (pontuacao === 5) {
        forcaSenha.textContent = "Senha forte";
        forcaSenha.className = "forcaSenha forte";
        return true;
    }
}

function validarFormulario() {

    const senhaForte = verificarForcaSenha(senha.value);

    if (confirmarSenha.value === "") {
        confirmarSenha.classList.remove("erro", "sucesso");
        erroSenha.textContent = "";
        btnCriarConta.disabled = true;
        return;
    }

    if (senha.value === confirmarSenha.value && senhaForte) {
        confirmarSenha.classList.remove("erro");
        confirmarSenha.classList.add("sucesso");

        erroSenha.textContent = "";
        btnCriarConta.disabled = false;
    } else {
        confirmarSenha.classList.remove("sucesso");
        confirmarSenha.classList.add("erro");

        if (!senhaForte) {
            erroSenha.textContent = "A senha precisa ser mais forte";
        } else {
            erroSenha.textContent = "As senhas não coincidem";
        }

        btnCriarConta.disabled = true;
    }
}

senha.addEventListener("input", validarFormulario);
confirmarSenha.addEventListener("input", validarFormulario);

function verificarForcaSenha(valor) {

    const reqTamanho = document.getElementById("reqTamanho");
    const reqMinuscula = document.getElementById("reqMinuscula");
    const reqMaiuscula = document.getElementById("reqMaiuscula");
    const reqNumero = document.getElementById("reqNumero");
    const reqEspecial = document.getElementById("reqEspecial");

    let pontuacao = 0;

    function atualizarRequisito(elemento, condicao) {
        if (condicao) {
            elemento.classList.add("ok");
            elemento.classList.remove("erro");
            pontuacao++;
        } else {
            elemento.classList.add("erro");
            elemento.classList.remove("ok");
        }
    }

    atualizarRequisito(reqTamanho, valor.length >= 8);
    atualizarRequisito(reqMinuscula, /[a-z]/.test(valor));
    atualizarRequisito(reqMaiuscula, /[A-Z]/.test(valor));
    atualizarRequisito(reqNumero, /[0-9]/.test(valor));
    atualizarRequisito(reqEspecial, /[^A-Za-z0-9]/.test(valor));

    if (pontuacao <= 2) {
        forcaSenha.textContent = "Senha fraca";
        forcaSenha.className = "forcaSenha fraca";
        return false;
    }

    if (pontuacao <= 4) {
        forcaSenha.textContent = "Senha média";
        forcaSenha.className = "forcaSenha media";
        return false;
    }

    forcaSenha.textContent = "Senha forte";
    forcaSenha.className = "forcaSenha forte";
    return true;
}

const requisitosLista = document.getElementById("requisitosSenha");

// Mostrar quando clicar
senha.addEventListener("focus", () => {
    requisitosLista.classList.add("ativo");
});

// Esconder se sair do campo E estiver vazio
senha.addEventListener("blur", () => {
    if (senha.value.length === 0) {
        requisitosLista.classList.remove("ativo");
    }
});