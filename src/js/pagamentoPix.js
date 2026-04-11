// Tarefa 2. Implementar cálculo automático do total e atualizar o resumo do pedido.
// Tarefa 3. Implementar renderização de desconto.
// Tarefa 4. Implementar a funcionalidade de copiar o código PIX.
// Tarefa 5. Implementar sistema de feedback visual.

// ========================================
// ELEMENTOS DO RESUMO DO PEDIDO
// ========================================

const subtotalElemento = document.getElementById("subtotal");
const freteElemento = document.getElementById("frete");
const totalElemento = document.getElementById("total");
const descontoElemento = document.getElementById("desconto");
const linhaDescontoElemento = document.getElementById("linhaDesconto");
const inputCupom = document.getElementById("inputCupom");
const btnAplicarCupom = document.getElementById("btnAplicarCupom");
const tempoExpiracaoElemento = document.getElementById("tempoExpiracao");
const estadoAguardandoPagamento = document.getElementById("estadoAguardandoPagamento");
const estadoPixExpirado = document.getElementById("estadoPixExpirado");
const estadoPagamentoAprovado = document.getElementById("estadoPagamentoAprovado");
const estadoErroPagamento = document.getElementById("estadoErroPagamento");
const btnGerarNovoQrCode = document.getElementById("btnGerarNovoQrCode");
const btnConfirmarPagamento = document.querySelector(".btn-confirmar");
const btnTentarNovamente = document.getElementById("btnTentarNovamente");


// ========================================
// ELEMENTOS DO CÓDIGO PIX
// ========================================

const codigoPixInput = document.getElementById("codigoPix");
const btnCopiarIcone = document.getElementById("btnCopiarIcone");
const btnCopiarPix = document.getElementById("btnCopiarPix");


// ========================================
// ESTADO DOS VALORES DO PEDIDO
// ========================================

const pedido = {
    subtotal: Number(subtotalElemento.dataset.valor) || 0,
    frete: Number(freteElemento.dataset.valor) || 0,
    desconto: 0
};


// ========================================
// CUPONS DISPONÍVEIS PARA TESTE
// ========================================

const cupons = {
    LOCA10: 10,
    LOCA20: 20,
    BEMVINDO30: 30
};


// ========================================
// FUNÇÕES DE FEEDBACK VISUAL
// ========================================

let feedbackFlutuanteAtual = null;
let timeoutFeedback = null;
let elementoReferenciaFeedback = null;

function mostrarFeedbackProximo(elemento, mensagem, tipo) {
    if (feedbackFlutuanteAtual) {
        feedbackFlutuanteAtual.remove();
        clearTimeout(timeoutFeedback);
    }

    const feedback = document.createElement("div");
    feedback.className = `feedback-flutuante ${tipo}`;
    feedback.textContent = mensagem;

    document.body.appendChild(feedback);

    feedbackFlutuanteAtual = feedback;
    elementoReferenciaFeedback = elemento;

    atualizarPosicaoFeedback();

    timeoutFeedback = setTimeout(() => {
        removerFeedbackFlutuante();
    }, 2500);
}

function atualizarPosicaoFeedback() {
    if (!feedbackFlutuanteAtual || !elementoReferenciaFeedback) return;

    const rect = elementoReferenciaFeedback.getBoundingClientRect();

    const topo = rect.bottom + 8;
    let esquerda = rect.left + (rect.width / 2) - (feedbackFlutuanteAtual.offsetWidth / 2);

    const margemMinima = 12;
    const margemMaxima = window.innerWidth - feedbackFlutuanteAtual.offsetWidth - 12;

    if (esquerda < margemMinima) {
        esquerda = margemMinima;
    }

    if (esquerda > margemMaxima) {
        esquerda = margemMaxima;
    }

    feedbackFlutuanteAtual.style.top = `${topo}px`;
    feedbackFlutuanteAtual.style.left = `${esquerda}px`;
}

window.addEventListener("scroll", atualizarPosicaoFeedback);
window.addEventListener("resize", atualizarPosicaoFeedback);

function removerFeedbackFlutuante() {
    if (feedbackFlutuanteAtual) {
        feedbackFlutuanteAtual.remove();
        feedbackFlutuanteAtual = null;
    }

    elementoReferenciaFeedback = null;
    clearTimeout(timeoutFeedback);
}


// ===============================================
// EVENTO DE INPUT DO CUPOM PARA HABILITAR/DESABILITAR O BOTÃO DE APLICAR CUPOM
// ===============================================

inputCupom.addEventListener("input", () => {
    const valor = inputCupom.value.trim().toUpperCase();

    inputCupom.value = valor;

    btnAplicarCupom.disabled = valor === "";
});


// ========================================
// FUNÇÃO DE FORMATAÇÃO MONETÁRIA
// ========================================

function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}


// ========================================
// FUNÇÃO PARA TROCAR O ESTADO DA TELA
// ========================================

function trocarEstadoTela(estado) {
    estadoAguardandoPagamento.classList.add("escondido");
    estadoPixExpirado.classList.add("escondido");
    estadoPagamentoAprovado.classList.add("escondido");
    estadoErroPagamento.classList.add("escondido");

    if (estado === "aguardando") {
        estadoAguardandoPagamento.classList.remove("escondido");
    }

    if (estado === "expirado") {
        estadoPixExpirado.classList.remove("escondido");
    }

    if (estado === "aprovado") {
        estadoPagamentoAprovado.classList.remove("escondido");
    }

    if (estado === "erro") {
        estadoErroPagamento.classList.remove("escondido");
    }
}


// ========================================
// FUNÇÃO PARA RENDERIZAR O RESUMO
// ========================================

function renderizarResumo() {
    const total = pedido.subtotal + pedido.frete - pedido.desconto;

    subtotalElemento.textContent = formatarMoeda(pedido.subtotal);

    freteElemento.textContent =
        pedido.frete === 0 ? "Grátis" : formatarMoeda(pedido.frete);

    totalElemento.textContent = formatarMoeda(total);

    if (pedido.desconto > 0) {
        descontoElemento.textContent = `- ${formatarMoeda(pedido.desconto)}`;
        linhaDescontoElemento.classList.remove("escondido");
    } else {
        descontoElemento.textContent = "- R$ 0,00";
        linhaDescontoElemento.classList.add("escondido");
    }
}


// ========================================
// FUNÇÃO PARA APLICAR DESCONTO
// ========================================

function aplicarDesconto(valorDesconto) {
    pedido.desconto = valorDesconto;
    renderizarResumo();
}


// ========================================
// ESTADO DO TIMER DO PIX
// ========================================

 let tempoRestanteSegundos = 15 * 60; // **************
let intervaloExpiracao = null;


// ========================================
// FUNÇÃO PARA FORMATAR O TEMPO
// ========================================

function formatarTempo(segundosTotais) {
    const minutos = Math.floor(segundosTotais / 60);
    const segundos = segundosTotais % 60;

    const minutosFormatados = String(minutos).padStart(2, "0");
    const segundosFormatados = String(segundos).padStart(2, "0");

    return `${minutosFormatados}:${segundosFormatados}`;
}


// ========================================
// FUNÇÃO PARA ATUALIZAR O TIMER NA TELA
// ========================================

function atualizarTimerNaTela() {
    tempoExpiracaoElemento.textContent = `Expira em ${formatarTempo(tempoRestanteSegundos)}`;
}


// ========================================
// FUNÇÃO PARA INICIAR O TIMER
// ========================================

function iniciarTimerExpiracao() {
    clearInterval(intervaloExpiracao);

    atualizarTimerNaTela();

    intervaloExpiracao = setInterval(() => {
        tempoRestanteSegundos--;

        atualizarTimerNaTela();

        if (tempoRestanteSegundos <= 0) {
            clearInterval(intervaloExpiracao);
            tempoRestanteSegundos = 0;
            atualizarTimerNaTela();
            trocarEstadoTela("expirado");
        }
    }, 1000);
}


// ========================================
// FUNÇÃO PARA GERAR NOVO QR CODE
// ========================================

function gerarNovoQrCode() {
    resetarTimerExpiracao();
    trocarEstadoTela("aguardando");
    iniciarTimerExpiracao();
}


// ========================================
// FUNÇÃO PARA RESETAR O TIMER
// ========================================

function resetarTimerExpiracao() {
    clearInterval(intervaloExpiracao);
    tempoRestanteSegundos = 15 * 60;
    atualizarTimerNaTela();
}


// ========================================
// FUNÇÃO PARA COPIAR O CÓDIGO PIX
// ========================================

async function copiarCodigoPix(event) {
    const codigoPix = codigoPixInput.value;
    const elementoOrigem = event.currentTarget;

    try {
        await navigator.clipboard.writeText(codigoPix);
        mostrarFeedbackProximo(elementoOrigem, "Código PIX copiado para a área de transferência.", "sucesso");
    } catch (erro) {
        console.error("Erro ao copiar o código PIX:", erro);
        mostrarFeedbackProximo(elementoOrigem, "Não foi possível copiar o código PIX.", "erro");
    }
}


// ========================================
// FUNÇÃO PARA APLICAR CUPOM
// ========================================

function aplicarCupom() {
    const cupomDigitado = inputCupom.value.trim().toUpperCase();

    if (cupomDigitado === "") {
        mostrarFeedbackProximo(inputCupom, "Digite um cupom antes de aplicar.", "aviso");
        return;
    }

    const percentualDesconto = cupons[cupomDigitado];

    if (!percentualDesconto) {
        pedido.desconto = 0;
        renderizarResumo();
        mostrarFeedbackProximo(inputCupom, "Cupom inválido.", "erro");
        return;
    }

    const valorDesconto = (pedido.subtotal * percentualDesconto) / 100;

    aplicarDesconto(valorDesconto);
    mostrarFeedbackProximo(btnAplicarCupom, `Cupom ${cupomDigitado} aplicado com sucesso.`, "sucesso");
}


// ========================================
// EVENTOS
// ========================================

btnCopiarIcone.addEventListener("click", copiarCodigoPix);
btnCopiarPix.addEventListener("click", copiarCodigoPix);
btnAplicarCupom.addEventListener("click", aplicarCupom);

inputCupom.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        aplicarCupom();
    }
});

btnGerarNovoQrCode.addEventListener("click", gerarNovoQrCode);
btnConfirmarPagamento.addEventListener("click", () => {
    return;
});
if (btnTentarNovamente) {
    btnTentarNovamente.addEventListener("click", tentarNovamentePagamento);
}

function tentarNovamentePagamento() {
    resetarTimerExpiracao();
    trocarEstadoTela("aguardando");
    iniciarTimerExpiracao();
}
function simularPagamentoAprovado() {
    clearInterval(intervaloExpiracao);
    trocarEstadoTela("aprovado");
}


// ========================================
// INICIALIZAÇÃO
// ========================================

renderizarResumo();
// trocarEstadoTela("aguardando");
// trocarEstadoTela("expirado");
// trocarEstadoTela("erro");
// trocarEstadoTela("aprovado");
iniciarTimerExpiracao();

simularPagamentoAprovado();