// ================= CPF / CNPJ DINÂMICO =================

// Captura os radios que definem se é locador (CNPJ) ou locatário (CPF)
const radioLocador = document.getElementById("locador");
const radioLocatario = document.getElementById("locatario");

// Campo de documento e seu label
const documentoInput = document.getElementById("documento");
const labelDocumento = document.getElementById("labelDocumento");


// Aplica máscara de CPF no formato 000.000.000-00
function aplicarMascaraCPF(valor) {

    // Remove tudo que não for número e limita a 11 dígitos
    valor = valor.replace(/\D/g, "").substring(0, 11);

    // Aplica os pontos
    valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
    valor = valor.replace(/(\d{3})(\d)/, "$1.$2");

    // Aplica o hífen final
    valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    return valor;
}


// Aplica máscara de CNPJ no formato 00.000.000/0000-00
function aplicarMascaraCNPJ(valor) {

    // Remove tudo que não for número e limita a 14 dígitos
    valor = valor.replace(/\D/g, "").substring(0, 14);

    // Aplica os pontos iniciais
    valor = valor.replace(/^(\d{2})(\d)/, "$1.$2");
    valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");

    // Aplica barra
    valor = valor.replace(/\.(\d{3})(\d)/, ".$1/$2");

    // Aplica hífen final
    valor = valor.replace(/(\d{4})(\d)/, "$1-$2");

    return valor;
}


// Atualiza label e placeholder conforme o tipo selecionado
function atualizarTipoDocumento() {

    // Limpa o campo ao trocar tipo
    documentoInput.value = "";

    if (radioLocador.checked) {
        labelDocumento.textContent = "CNPJ";
        documentoInput.placeholder = "00.000.000/0000-00";
    } else {
        labelDocumento.textContent = "CPF";
        documentoInput.placeholder = "000.000.000-00";
    }
}


// Aplica máscara dinamicamente enquanto o usuário digita
documentoInput.addEventListener("input", (e) => {

    if (radioLocador.checked) {
        e.target.value = aplicarMascaraCNPJ(e.target.value);
    } else {
        e.target.value = aplicarMascaraCPF(e.target.value);
    }
});


// Escuta mudança nos radios para atualizar tipo de documento
document.querySelectorAll('input[name="tipo"]').forEach(radio => {
    radio.addEventListener("change", atualizarTipoDocumento);
});

// Garante estado inicial correto ao carregar a página
atualizarTipoDocumento();


// ================= VALIDAÇÃO CPF / CNPJ =================

// Elemento onde mensagem de erro será exibida
const erroDocumento = document.getElementById("erroDocumento");

function validarDocumento() {

    // Remove máscara para validar apenas os números
    const valorNumerico = documentoInput.value.replace(/\D/g, "");

    let valido = false;

    if (radioLocador.checked) {

        // CNPJ precisa ter exatamente 14 dígitos
        valido = valorNumerico.length === 14;

        if (!valido) {
            erroDocumento.textContent = "Digite seu CNPJ completo";
        }

    } else {

        // CPF precisa ter exatamente 11 dígitos
        valido = valorNumerico.length === 11;

        if (!valido) {
            erroDocumento.textContent = "Digite seu CPF completo";
        }
    }

    // Aplica feedback visual
    if (!valido) {
        documentoInput.classList.add("erro");
        documentoInput.classList.remove("sucesso");
        erroDocumento.style.display = "block";
    } else {
        documentoInput.classList.remove("erro");
        documentoInput.classList.add("sucesso");
        erroDocumento.style.display = "none";
    }

    return valido;
}

// Valida quando o usuário sai do campo
documentoInput.addEventListener("blur", validarDocumento);


// ================= VALIDAÇÃO NOME COMPLETO =================

const nomeInput = document.getElementById("nome");
const erroNome = document.getElementById("erroNome");

function validarNomeCompleto(valor) {

    // Remove espaços extras do começo e fim
    const nome = valor.trim();

    // Divide o nome em partes e remove espaços vazios
    const partes = nome.split(" ").filter(parte => parte.length > 0);

    // Precisa ter pelo menos nome + sobrenome
    if (partes.length < 2) return false;

    // Cada parte precisa ter pelo menos 2 caracteres
    return partes.every(parte => parte.length >= 2);
}


// Valida ao sair do campo
nomeInput.addEventListener("blur", () => {

    const valido = validarNomeCompleto(nomeInput.value);

    if (!valido) {
        nomeInput.classList.add("erro");
        nomeInput.classList.remove("sucesso");
        erroNome.textContent = "Por favor, digite seu nome completo";
    } else {
        nomeInput.classList.remove("erro");
        nomeInput.classList.add("sucesso");
        erroNome.textContent = "";
    }
});


// ================= MOSTRAR / OCULTAR SENHA =================

const eyeButtons = document.querySelectorAll(".eyeBtn");

eyeButtons.forEach((btn) => {

    btn.addEventListener("click", () => {

        // Busca o input dentro do mesmo wrapper
        const input = btn.closest(".inputWrapper").querySelector("input");

        // Alterna entre password e text
        input.type = input.type === "password" ? "text" : "password";

        // Ativa/desativa estilo visual do botão
        btn.classList.toggle("active");
    });
});


// ================= VALIDAÇÃO DE SENHA =================

const senha = document.getElementById("senha");
const confirmarSenha = document.getElementById("confirmarSenha");
const erroSenha = document.getElementById("erroSenha");
const forcaSenha = document.getElementById("forcaSenha");
const btnCriarConta = document.getElementById("btnCriarConta");


// Valida formulário antes de permitir envio
function validarFormulario() {

    const senhaForte = verificarForcaSenha(senha.value);
    const senhasIguais = senha.value === confirmarSenha.value;

    // Se campo confirmar estiver vazio
    if (confirmarSenha.value.length === 0) {
        erroSenha.textContent = "";
        confirmarSenha.classList.remove("erro", "sucesso");
        btnCriarConta.disabled = true;
        return;
    }

    // Se senhas forem diferentes
    if (!senhasIguais) {
        erroSenha.textContent = "As senhas não coincidem";
        confirmarSenha.classList.remove("sucesso");
        confirmarSenha.classList.add("erro");
        btnCriarConta.disabled = true;
        return;
    }

    // Se senha não for forte
    if (!senhaForte) {
        erroSenha.textContent = "A senha precisa ser mais forte";
        confirmarSenha.classList.remove("sucesso");
        confirmarSenha.classList.add("erro");
        btnCriarConta.disabled = true;
        return;
    }

    // Caso esteja tudo certo
    erroSenha.textContent = "";
    confirmarSenha.classList.remove("erro");
    confirmarSenha.classList.add("sucesso");
    btnCriarConta.disabled = false;
}


// Bloqueia envio do formulário se houver erro
const form = document.querySelector("form");

form.addEventListener("submit", function (e) {

    const senhaForte = verificarForcaSenha(senha.value);
    const senhasIguais = senha.value === confirmarSenha.value;

    if (!senhaForte || !senhasIguais) {
        e.preventDefault();
        validarFormulario();
    }
});


// Atualiza validação enquanto digita
senha.addEventListener("input", validarFormulario);
confirmarSenha.addEventListener("input", validarFormulario);


// ================= VERIFICAÇÃO DETALHADA DE REQUISITOS =================

function verificarForcaSenha(valor) {

    // Elementos visuais de cada requisito
    const reqTamanho = document.getElementById("reqTamanho");
    const reqMinuscula = document.getElementById("reqMinuscula");
    const reqMaiuscula = document.getElementById("reqMaiuscula");
    const reqNumero = document.getElementById("reqNumero");
    const reqEspecial = document.getElementById("reqEspecial");

    let pontuacao = 0;

    // Atualiza visualmente cada requisito
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

    // Testes de força
    atualizarRequisito(reqTamanho, valor.length >= 8);
    atualizarRequisito(reqMinuscula, /[a-z]/.test(valor));
    atualizarRequisito(reqMaiuscula, /[A-Z]/.test(valor));
    atualizarRequisito(reqNumero, /[0-9]/.test(valor));
    atualizarRequisito(reqEspecial, /[^A-Za-z0-9]/.test(valor));

    // Define nível de força
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


// ================= MOSTRAR / OCULTAR LISTA DE REQUISITOS =================

const requisitosLista = document.getElementById("requisitosSenha");

// Mostra lista ao focar no campo senha
senha.addEventListener("focus", () => {
    requisitosLista.classList.add("ativo");
});

// Esconde se sair do campo e estiver vazio
senha.addEventListener("blur", () => {
    if (senha.value.length === 0) {
        requisitosLista.classList.remove("ativo");
    }
});

// ================= TELEFONE =================

const telefoneInput = document.getElementById("telefone");
const erroTelefone = document.getElementById("erroTelefone");

// Máscara (11) 91234-5678
function aplicarMascaraTelefone(valor) {

    // Remove tudo que não for número e limita a 11 dígitos
    valor = valor.replace(/\D/g, "").substring(0, 11);

    // Aplica DDD
    valor = valor.replace(/^(\d{2})(\d)/g, "($1) $2");

    // Aplica hífen (formato 9 dígitos)
    valor = valor.replace(/(\d{5})(\d)/, "$1-$2");

    return valor;
}

// Aplica máscara enquanto digita
telefoneInput.addEventListener("input", (e) => {
    e.target.value = aplicarMascaraTelefone(e.target.value);
});

// Validação
function validarTelefone() {

    // Remove máscara para validar só números
    const numero = telefoneInput.value.replace(/\D/g, "");

    // Telefone válido no Brasil tem 10 ou 11 dígitos
    const valido = numero.length === 10 || numero.length === 11;

    if (!valido) {
        telefoneInput.classList.add("erro");
        telefoneInput.classList.remove("sucesso");
        erroTelefone.textContent = "Digite um telefone válido com DDD";
    } else {
        telefoneInput.classList.remove("erro");
        telefoneInput.classList.add("sucesso");
        erroTelefone.textContent = "";
    }

    return valido;
}

// Valida ao sair do campo
telefoneInput.addEventListener("blur", validarTelefone);