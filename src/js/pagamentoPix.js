const tempoExpiracaoElemento = document.getElementById("tempoExpiracao");
const estadoAguardandoPagamento = document.getElementById("estadoAguardandoPagamento");
const estadoPixExpirado = document.getElementById("estadoPixExpirado");

const codigoPixInput = document.getElementById("codigoPix");
const btnCopiarIcone = document.getElementById("btnCopiarIcone");
const btnCopiarPix = document.getElementById("btnCopiarPix");

const btnGerarNovoQrCode = document.getElementById("btnGerarNovoQrCode");
const estadoErroPagamento = document.getElementById("estadoErroPagamento");
const btnTentarNovamente = document.getElementById("btnTentarNovamente");


// ========================================
// ESTADO DO FEEDBACK FLUTUANTE
// ========================================

let feedbackFlutuanteAtual = null;
let timeoutFeedback = null;
let elementoReferenciaFeedback = null;


// ========================================
// ESTADO DO TIMER DO PIX
// ========================================

let tempoRestanteSegundos = 24 * 3600;
let intervaloExpiracao = null;


// ========================================
// FUNÇÕES DE FEEDBACK VISUAL
// ========================================

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

function removerFeedbackFlutuante() {
    if (feedbackFlutuanteAtual) {
        feedbackFlutuanteAtual.remove();
        feedbackFlutuanteAtual = null;
    }

    elementoReferenciaFeedback = null;
    clearTimeout(timeoutFeedback);
}

window.addEventListener("scroll", atualizarPosicaoFeedback);
window.addEventListener("resize", atualizarPosicaoFeedback);


// ========================================
// FUNÇÃO PARA FORMATAR O TEMPO
// ========================================

function formatarTempo(segundosTotais) {
    const horas = Math.floor(segundosTotais / 3600);
    const minutos = Math.floor((segundosTotais % 3600) / 60);
    const segundos = segundosTotais % 60;

    const horasFormatadas = String(horas).padStart(2, "0");
    const minutosFormatados = String(minutos).padStart(2, "0");
    const segundosFormatados = String(segundos).padStart(2, "0");

    return `${horasFormatadas}:${minutosFormatados}:${segundosFormatados}`;
}


// ========================================
// FUNÇÃO PARA ATUALIZAR O TIMER NA TELA
// ========================================

function atualizarTimerNaTela() {
    tempoExpiracaoElemento.textContent = `Expira em ${formatarTempo(tempoRestanteSegundos)}`;
}


// ========================================
// FUNÇÃO PARA TROCAR ESTADO DA TELA
// ========================================

function trocarEstadoTela(estado) {
    estadoAguardandoPagamento.classList.add("escondido");
    estadoPixExpirado.classList.add("escondido");

    if (estadoErroPagamento) {
        estadoErroPagamento.classList.add("escondido");
    }

    if (estado === "aguardando") {
        estadoAguardandoPagamento.classList.remove("escondido");
    }

    if (estado === "expirado") {
        estadoPixExpirado.classList.remove("escondido");
    }

    if (estado === "erro") {
        estadoErroPagamento.classList.remove("escondido");
    }
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
// FUNÇÃO PARA RESETAR O TIMER
// ========================================

function resetarTimerExpiracao() {
    clearInterval(intervaloExpiracao);
    tempoRestanteSegundos = 24 * 3600;
    atualizarTimerNaTela();
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
// FUNÇÃO TENTAR GERAR NOVO QR CODE NOVAMENTE
// ========================================

function tentarNovamentePagamento() {
    resetarTimerExpiracao();
    trocarEstadoTela("aguardando");
    iniciarTimerExpiracao();
}


// ========================================
// FUNÇÃO PARA COPIAR O CÓDIGO PIX
// ========================================

async function copiarCodigoPix(event) {
    if (!codigoPixInput || codigoPixInput.value.trim() === "") {
        mostrarFeedbackProximo(event.currentTarget, "Código PIX indisponível.", "erro");
        return;
    }

    const codigoPix = codigoPixInput.value;
    const elementoOrigem = event.currentTarget;

    try {
        await navigator.clipboard.writeText(codigoPix);
        mostrarFeedbackProximo(elementoOrigem, "Código PIX copiado.", "sucesso");
    } catch (erro) {
        console.error("Erro ao copiar o código PIX:", erro);
        mostrarFeedbackProximo(elementoOrigem, "Não foi possível copiar o código PIX.", "erro");
    }
}


// ========================================
// FUNÇÃO DE PAGAMENTO APROVADO
// ========================================
function pagamentoAprovado() {
    window.location.href = "./pagamentoAprovado.html";
}


// ========================================
// EVENTOS
// ========================================

if (btnCopiarIcone) {
    btnCopiarIcone.addEventListener("click", copiarCodigoPix);
}

if (btnCopiarPix) {
    btnCopiarPix.addEventListener("click", copiarCodigoPix);
}

if (btnGerarNovoQrCode) {
    btnGerarNovoQrCode.addEventListener("click", gerarNovoQrCode);
}

if (btnTentarNovamente) {
    btnTentarNovamente.addEventListener("click", tentarNovamentePagamento);
}


// ========================================
// INICIALIZAÇÃO
// ========================================

trocarEstadoTela("aguardando");
iniciarTimerExpiracao();
// trocarEstadoTela("erro");
// pagamentoAprovado();