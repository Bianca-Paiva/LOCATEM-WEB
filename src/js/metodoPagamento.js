// ============================================================
//  Responsabilidades:
//    1. Seleção de forma de pagamento (botões)
//    2. Leitura de subtotal e frete via localStorage
//    3. Cálculo e exibição do total no DOM
//    4. Redirecionamento ao continuar pagamento
// ============================================================


// ============================================================
//  1. REFERÊNCIAS AO DOM
// ============================================================

const botoes = document.querySelectorAll('.btn-metodo');
const btnContinuar = document.querySelector('.btn-pagamento');

// Elementos do resumo do pedido
// Seletores baseados em classes específicas para evitar dependência de ordem no HTML
const elSubtotal = document.querySelector('.resumo-subtotal');
const elFrete = document.querySelector('.resumo-frete-topo');
const elTotal = document.querySelector('.resumo-total-valor');
const elLinhaDesconto = document.getElementById('linha-desconto');
const elDesconto = document.querySelector('.resumo-desconto-valor');


// =======================================================
//  2. SELEÇÃO DE FORMA DE PAGAMENTO
//  (Código mantido exatamente conforme especificado)
// =======================================================

botoes.forEach(botao => {
    botao.addEventListener('click', () => {
        // Passo 1: Remove a classe 'ativo' de TODOS os botões
        botoes.forEach(b => b.classList.remove('ativo'));

        // Passo 2: Adiciona a classe 'ativo' APENAS no botão que foi clicado
        botao.classList.add('ativo');
    });
});


// ======================================================
//  3. LEITURA DOS VALORES VIA localStorage
//  Os valores são salvos pela página carrinho.html
// ======================================================

/**
    * Converte string monetária do localStorage em número float.
    * Aceita tanto "184.00" quanto "184,00".
    * Retorna 0 caso o valor seja nulo ou inválido.
    *
    * @param {string} chave - Chave do localStorage
    * @returns {number}
*/
function lerValorLocalStorage(chave) {
    const valor = localStorage.getItem(chave);

    if (valor === null || valor === '') return 0;

    const numero = parseFloat(valor.replace(',', '.'));

    return isNaN(numero) ? 0 : numero;
}


// ========================================
//  4. FORMATAÇÃO DE VALORES MONETÁRIOS
// ========================================

/**
    * Formata um número para o padrão monetário brasileiro.
    * Exemplo: 184.5 → "R$ 184,50"
    *
    * @param {number} valor
    * @returns {string}
*/
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}


// ==============================================
//  5. CÁLCULO E ATUALIZAÇÃO DO RESUMO NO DOM
// ==============================================

/**
    * Lê subtotal e frete do localStorage, calcula o total e atualiza os elementos correspondentes na tela.
*/
function atualizarResumo() {
    const subtotal = lerValorLocalStorage('subtotal');
    const frete = lerValorLocalStorage('frete');
    const desconto = lerValorLocalStorage('desconto');
    const total    = Math.max(0, subtotal + frete - desconto);

    if (elSubtotal) elSubtotal.textContent = formatarMoeda(subtotal);
    if (elFrete) elFrete.textContent = frete === 0 ? 'Grátis' : formatarMoeda(frete);
    if (elTotal) elTotal.textContent = formatarMoeda(total);

    if (desconto > 0 && elDesconto && elLinhaDesconto) {
        elDesconto.textContent = `− ${formatarMoeda(desconto)}`;
        elLinhaDesconto.style.display = '';
    } else if (elLinhaDesconto) {
        elLinhaDesconto.style.display = 'none';
    }
}


// ==============================================
//  6. REDIRECIONAMENTO AO CONTINUAR PAGAMENTO
// ==============================================

/**
    * Retorna o botão de pagamento que está atualmente ativo, ou null caso nenhum esteja selecionado.
    *
    * @returns {Element|null}
*/
function obterMetodoAtivo() {
    return document.querySelector('.btn-metodo.ativo');
}

/**
    * Verifica o método de pagamento ativo e redireciona para a página correspondente.
    * Antes do redirecionamento, salva o método selecionado no localStorage para que
    * a tela selecionarCartao.html possa filtrar os cartões corretamente.
    * Exibe alerta se nenhum método estiver selecionado.
*/
function processarContinuarPagamento() {
    const metodoAtivo = obterMetodoAtivo();

    // Nenhum método selecionado
    if (!metodoAtivo) {
        alert('Por favor, selecione uma forma de pagamento para continuar.');
        return;
    }

    // Lê o método diretamente do atributo data-metodo para evitar
    // dependência do texto visual exibido no botão
    const metodo = metodoAtivo.dataset.metodo;

    // Persiste o método escolhido para a página de confirmação
    localStorage.setItem('metodoPagamento', metodo);

    // Mapeamento de método → rota de destino
    const rotas = {
        credito: '/selecionarCartao.html',
        debito: '/selecionarCartao.html',
        pix: '/pagamentoPix.html'
    };

    const destino = rotas[metodo];

    if (destino) {
        // Persiste o método escolhido para uso na próxima tela
        localStorage.setItem('metodoPagamento', metodo);

        window.location.href = destino;
    } else {
        // Segurança: método desconhecido (não deve ocorrer em produção)
        alert('Forma de pagamento não reconhecida. Por favor, selecione outra opção.');
    }
}

atualizarResumo();
// Associa o clique no botão "Continuar Pagamento"
btnContinuar.addEventListener('click', processarContinuarPagamento);