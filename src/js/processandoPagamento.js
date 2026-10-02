// ============================================================
//  RESPONSABILIDADES
//    1. Simular processamento do pagamento
//    2. Redirecionar para tela de sucesso
// ============================================================


// ============================================================
//  1. TEMPO DE PROCESSAMENTO
// ============================================================

const TEMPO_PROCESSAMENTO = 2000;


// ============================================================
//  2. REDIRECIONAMENTO
// ============================================================

setTimeout(() => {
    window.location.href = './pagamentoAprovado.html';
}, TEMPO_PROCESSAMENTO);