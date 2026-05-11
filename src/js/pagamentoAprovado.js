/* ========================================================
    pagamentoAprovado.js
    Lê os dados do localStorage escritos ao longo do funil
    (carrinho → método de pagamento) e preenche a página
    de confirmação dinamicamente.

    Chaves esperadas:
      'total'           → string "380.00"
      'metodoPagamento' → string "PIX" | "Cartão de Crédito" | "Cartão de Débito"
      'produtos'        → JSON array de objetos { nome, imagem, dias, unidades }
======================================================== */


/* ========================================================
    1. LEITURA DO localStorage
======================================================== */

/**
    * Lê e normaliza todos os dados do funil de compra.
    * Valores ausentes recebem fallbacks seguros para
    * evitar que a página quebre caso uma chave esteja faltando.
    *
    * @returns {{ total: number, metodo: string, produtos: Array }}
*/
function lerDadosDaLocacao() {
    const total = parseFloat(localStorage.getItem('total') || '0');
    const metodo = localStorage.getItem('metodoPagamento') ?? 'Não informado';
    const produtos = JSON.parse(localStorage.getItem('produtos') || '[]');

    return { total, metodo, produtos };
}


/* ========================================================
    2. FORMATAÇÃO
======================================================== */

// Formata número para moeda brasileira. Ex: 380 → "R$ 380,00"
const formatarMoeda = (valor) =>
    valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
    * Retorna a data e hora atual no formato brasileiro.
    * Ex: "12/04/2026 - 14:30"
*/
function obterDataHoraAtual() {
    const agora = new Date();

    const data = agora.toLocaleDateString('pt-BR');          // "12/04/2026"
    const hora = agora.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });                                                       // "14:30"

    return `${data} - ${hora}`;
}


/* ========================================================
    3. RENDERIZAÇÃO
======================================================== */

/**
    * Preenche o valor total em destaque no topo da página (hero).
*/
function renderizarTotal(total) {
    const el = document.querySelector('.hero-price');
    if (el) el.textContent = formatarMoeda(total);
}

/**
    * Preenche a data e hora da transação com o momento atual.
    * Em produção isso viria da resposta da API de pagamento.
*/
function renderizarDataHora() {
    // Seleciona a linha cujo label é "Data e Hora"
    const linhas = document.querySelectorAll('.detail-row');

    linhas.forEach((linha) => {
        const label = linha.querySelector('.label')?.textContent.trim();

        if (label === 'Data e Hora') {
            const value = linha.querySelector('.value');
            if (value) value.textContent = obterDataHoraAtual();
        }
    });
}

/**
    * Atualiza o ícone e texto do método de pagamento.
    *
    * O ícone SVG do PIX já existe no HTML — ele é mantido
    * para PIX e ocultado para métodos de cartão, que exibem
    * apenas o texto.
*/
// Deixa a primeira letra maiúscula
const capitalizar = (texto) =>
    texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();

function renderizarMetodoPagamento(metodo) {
    const linhas = document.querySelectorAll('.detail-row');

    linhas.forEach((linha) => {
        const label = linha.querySelector('.label')?.textContent.trim();

        if (label === 'Método de pagamento') {
            const value = linha.querySelector('.value');
            if (!value) return;

            // Capitaliza o método
            const metodosPagamento = {
                pix: 'PIX',
                credito: 'Cartão de Crédito',
                debito: 'Cartão de Débito'
            };

            const metodoFormatado = metodosPagamento[metodo.toLowerCase()] || metodo;

            // Atualiza somente o nó de texto, preservando o SVG no DOM
            const textoNode = [...value.childNodes].find((n) => n.nodeType === Node.TEXT_NODE);

            if (textoNode) {
                textoNode.textContent = ` ${metodoFormatado}`;
            } else {
                value.insertAdjacentText('beforeend', ` ${metodoFormatado}`);
            }
        }
    });
}

/**
    * Preenche o card do produto com os dados do primeiro item do carrinho.
    *
    * Por que só o primeiro produto?
    * A página de confirmação exibe um resumo visual simplificado — um card
    * único representa o pedido. Itens adicionais são acessíveis em
    * "Ver detalhes do aluguel".
    *
    * Se não houver produtos (array vazio), o card permanece com
    * os valores do HTML estático — comportamento seguro de fallback.
*/
function renderizarTodosProdutos(produtos) {
    if (!produtos.length) return;

    const container = document.querySelector('.lista-produtos-confirmacao');

    produtos.forEach((produto) => {
        const labelUnid = produto.unidades === 1 ? 'unidade' : 'unidades';
        const labelDia  = produto.dias     === 1 ? 'dia'     : 'dias';

        const card = document.createElement('article');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${produto.imagem}" alt="${produto.nome}" />
            <div class="product-info">
                <h2>${produto.nome}</h2>
                <p>Quantidade: ${produto.unidades} ${labelUnid} • Locação: ${produto.dias} ${labelDia}</p>
            </div>
        `;
        container.appendChild(card);
    });
}


/* ========================================================
    4. LIMPEZA (opcional — boa prática)
======================================================== */

/**
    * Remove as chaves do funil do localStorage após a confirmação.
    *
    * Por que limpar?
    * Evita que dados de um pedido anterior apareçam se o usuário
    * voltar para o carrinho e fizer uma nova compra.
    *
    * Chamado APÓS preencher a página — nunca antes.
*/
function limparDadosDaLocacao() {
    ['subtotal', 'frete', 'total', 'metodoPagamento', 'produtos']
        .forEach((chave) => localStorage.removeItem(chave));
}


/* ========================================================
    BOOTSTRAP
======================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const { total, metodo, produtos } = lerDadosDaLocacao();

    renderizarTotal(total);
    renderizarDataHora();
    renderizarMetodoPagamento(metodo);
    renderizarTodosProdutos(produtos);

    // Limpa o localStorage após preencher a tela com sucesso
    limparDadosDaLocacao();
});