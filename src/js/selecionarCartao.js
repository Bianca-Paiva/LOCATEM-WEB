// ============================================================
//  Responsabilidades:
//    1. Leitura do método de pagamento via localStorage
//    2. Filtragem dos cartões compatíveis com o método
//    3. Renderização dinâmica dos cartões no DOM
//    4. Seleção visual do cartão escolhido
//    5. Adição de novo cartão com persistência do tipo
//    6. Confirmação e redirecionamento ao continuar pagamento
// ============================================================


// ============================================================
//  1. REFERÊNCIAS AO DOM
// ============================================================

const listaCartoes = document.querySelector('.lista-cartoes');
const btnAdicionar = document.querySelector('.btn-adicionar');
const formCartao   = document.querySelector('.formulario-cartao');
const tituloPagina = document.querySelector('.cabecalho h1');


// ============================================================
//  2. DADOS PADRÃO
//  Simulam os cartões cadastrados pelo usuário.
//  Utilizados como fallback enquanto não existe cadastro real.
//  Substituir futuramente por chamada à API.
// ============================================================

const cartoesPadrao = [
    {
        id: 1,
        metodoPagamento: 'credito',
        bandeira: 'Visa',
        final: '1234',
        titular: 'JOÃO SILVA'
    },
    {
        id: 2,
        metodoPagamento: 'credito',
        bandeira: 'Mastercard',
        final: '5678',
        titular: 'JOÃO SILVA'
    },
    {
        id: 3,
        metodoPagamento: 'debito',
        bandeira: 'Visa',
        final: '9012',
        titular: 'JOÃO SILVA'
    },
    {
        id: 4,
        metodoPagamento: 'debito',
        bandeira: 'Elo',
        final: '3456',
        titular: 'JOÃO SILVA'
    }
];

// Lê cartões persistidos no localStorage (cadastrados pelo usuário).
// Mantém os dados padrão como fallback enquanto não há cartões salvos.
// const cartoesSalvos = JSON.parse(localStorage.getItem('cartoes')) || cartoesPadrao;

const cartoesSalvos = JSON.parse(localStorage.getItem('cartoes')) 
    ?? (() => {
        localStorage.setItem('cartoes', JSON.stringify(cartoesPadrao));
        return cartoesPadrao;
    })();


// ============================================================
//  3. LEITURA DO MÉTODO DE PAGAMENTO
//  Valor persistido pela página metodoPagamento.js
// ============================================================

const metodoPagamento = localStorage.getItem('metodoPagamento');

// Métodos de pagamento considerados válidos para esta página
const metodosValidos = ['credito', 'debito'];

// Redireciona caso o método seja ausente ou inválido
if (!metodosValidos.includes(metodoPagamento)) {
    window.location.href = 'metodoPagamento.html';
}


// ============================================================
//  4. FILTRAGEM DE CARTÕES
//  Retorna apenas os cartões compatíveis com o método ativo.
// ============================================================

/**
    * Filtra o array de cartões pelo método de pagamento informado.
    *
    * @param {Array}  cartoes - Lista completa de cartões
    * @param {string} metodo  - Método de pagamento ('credito' | 'debito')
    * @returns {Array} Cartões compatíveis com o método
*/
function filtrarCartoesPorMetodo(cartoes, metodo) {
    return cartoes.filter(cartao => cartao.metodoPagamento === metodo);
}


// ============================================================
//  5. RENDERIZAÇÃO DOS CARTÕES
//  Constrói e injeta dinamicamente os cards no DOM.
// ============================================================

/**
    * Cria o elemento <label> de um cartão com base nos dados recebidos.
    * Mantém a estrutura visual e as classes originais do HTML.
    *
    * @param {Object} dadosCartao - Objeto com os dados do cartão
    * @returns {HTMLElement} Elemento <label> pronto para inserção no DOM
*/
function criarElementoCartao(dadosCartao) {
    const inputId = `cartao-${dadosCartao.id}`;

    const label = document.createElement('label');
    label.classList.add('cartao');
    label.dataset.cartaoId = dadosCartao.id;

    label.innerHTML = `
        <div class="cartao-icone">
            <img src="./src/images/cartao.svg" alt="Icone de Cartao" />
        </div>
        <div class="cartao-info">
            <h3>${dadosCartao.bandeira} - Final ${dadosCartao.final}</h3>
            <p>${dadosCartao.titular}</p>
        </div>
        <input
            type="radio"
            id="${inputId}"
            name="cartaoSelecionado"
            value="${dadosCartao.id}"
        />
    `;

    return label;
}

/**
    * Exibe mensagem de estado vazio quando nenhum cartao compativel for encontrado.
    *
    * @returns {HTMLElement} Paragrafo com a mensagem amigavel
*/
function criarMensagemListaVazia() {
    const mensagem = document.createElement('p');
    mensagem.classList.add('lista-vazia');
    mensagem.textContent = 'Nenhum cartao disponivel para esta forma de pagamento.';
    return mensagem;
}

/**
    * Renderiza os cartões filtrados dentro do container .lista-cartoes.
    * O botão "Adicionar novo cartão" permanece fixo no HTML e não é afetado.
    *
    * @param {Array} cartoesFiltrados - Cartões já filtrados pelo método de pagamento
*/
function renderizarCartoes(cartoesFiltrados) {
    // Limpa o container exclusivo de cartões
    listaCartoes.innerHTML = '';

    if (cartoesFiltrados.length === 0) {
        listaCartoes.appendChild(criarMensagemListaVazia());
        return;
    }

    cartoesFiltrados.forEach(dadosCartao => {
        const elementoCartao = criarElementoCartao(dadosCartao);
        listaCartoes.appendChild(elementoCartao);

        // Associa o evento de seleção visual ao radio recém-criado
        const radio = elementoCartao.querySelector('input[type="radio"]');
        radio.addEventListener('change', () => aplicarSelecaoVisual(elementoCartao));
    });
}

/**
    * Atualiza o titulo da pagina de acordo com o método de pagamento ativo.
*/
function atualizarTituloPagina() {
    if (metodoPagamento === 'credito') {
        tituloPagina.textContent = 'Selecionar Cartão de Crédito';
    } else if (metodoPagamento === 'debito') {
        tituloPagina.textContent = 'Selecionar Cartão de Débito';
    }
}


// ============================================================
//  6. SELEÇÃO VISUAL DO CARTÃO
//  Adiciona/remove a classe 'ativo' conforme o radio selecionado.
// ============================================================

/**
    * Remove a classe 'ativo' de todos os cartões e aplica apenas no selecionado.
    *
    * @param {HTMLElement} cartaoSelecionado - Elemento <label> do cartão escolhido
*/
function aplicarSelecaoVisual(cartaoSelecionado) {
    const todosOsCartoes = listaCartoes.querySelectorAll('.cartao');
    todosOsCartoes.forEach(cartao => cartao.classList.remove('ativo'));
    cartaoSelecionado.classList.add('ativo');
}


// ============================================================
//  7. ADICIONAR NOVO CARTÃO
//  Persiste o tipo de cartão e redireciona para o formulário.
// ============================================================

/**
    * Salva o tipo de cartão que o usuário deseja adicionar e redireciona
    * para a tela de cadastro.
*/
function adicionarNovoCartao() {
    // Salva o tipo do novo cartão que será cadastrado
    localStorage.setItem('tipoNovoCartao', metodoPagamento);

    // Rotas de cadastro conforme o tipo do cartão
    const rotasCadastro = {
        credito : '/adicionarCartaoCredito.html',
        debito  : '/adicionarCartaoDebito.html'
    };

    const destino = rotasCadastro[metodoPagamento];

    if (destino) {
        window.location.href = destino;
    } else {
        alert('Tipo de cartão inválido.');
    }
}

btnAdicionar.addEventListener('click', adicionarNovoCartao);


// ============================================================
//  8. CONTINUAÇÃO DO PAGAMENTO
//  Valida a seleção, persiste o cartão e redireciona.
// ============================================================

/**
    * Retorna o radio input atualmente marcado, ou null se nenhum estiver selecionado.
    *
    * @returns {HTMLInputElement|null}
*/
function obterRadioSelecionado() {
    return formCartao.querySelector('input[name="cartaoSelecionado"]:checked');
}

/**
    * Mapeamento de método de pagamento para a rota de destino.
*/
const rotasPorMetodo = {
    credito : '/processandoPagamento.html',
    debito  : '/processandoPagamento.html'
};

/**
    * Processa o envio do formulário:
    *   - impede o reload da pagina
    *   - valida se um cartao foi selecionado
    *   - persiste o cartao no localStorage
    *   - redireciona para a tela correta conforme o método
    *
    * @param {Event} evento - Evento de submit do formulário
*/
function processarContinuarPagamento(evento) {
    evento.preventDefault();

    const radioSelecionado = obterRadioSelecionado();

    if (!radioSelecionado) {
        alert('Selecione um cartao para continuar.');
        return;
    }

    localStorage.setItem('cartaoSelecionado', radioSelecionado.value);

    const destino = rotasPorMetodo[metodoPagamento];

    if (destino) {
        window.location.href = destino;
    } else {
        // Seguranca: método desconhecido (não deve ocorrer em producao)
        alert('Metodo de pagamento invalido. Retorne e selecione uma opcao valida.');
    }
}

formCartao.addEventListener('submit', processarContinuarPagamento);


// ============================================================
//  9. INICIALIZAÇÃO
//  Executa assim que o script é carregado
// ============================================================

(function inicializar() {
    atualizarTituloPagina();

    const cartoesFiltrados = filtrarCartoesPorMetodo(cartoesSalvos, metodoPagamento);
    renderizarCartoes(cartoesFiltrados);
})();