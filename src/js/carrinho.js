/* ========================================================
    LÓGICA DO CARRINHO

    VISAO GERAL:
    Controla toda a interatividade da página de carrinho:
    ajuste de dias/unidades por produto, remoção de itens,
    calculo de frete por CEP, aplicação e remoção de cupons,
    atualização do resumo do pedido e navegação para pagamento.

    ARQUITETURA GERAL:
    O código segue uma separação de responsabilidades em tres camadas:

    ESTADO
        - Global (objeto `estado`): frete e cupom (valem para o pedido todo)
        - Por produto (dataset do elemento HTML): dias e unidades O elemento HTML IS a fonte de verdade — não ha array de produtos em memória.

    LÓGICA (funções puras)
        - calcularSubtotal, calcularDesconto, calcularTotalCard
        - Recebem dados, devolvem números, não tocam no DOM

    DOM (output)
        - atualizarCardProduto, atualizarResumo
        - Usam `refs` para escrever; nunca calculam nada

    PONTO DE ENTRADA:
    document.addEventListener('DOMContentLoaded', ...) — ao final do arquivo.
    A ordem de inicialização esta documentada na secao BOOTSTRAP.
======================================================== */


/* ========================================================
    1. ESTADO GLOBAL E CONSTANTES
======================================================== */

/* OBJETO DE ESTADO GLOBAL
    Guarda apenas o que pertence ao pedido como um todo, não a nenhum produto específico:
        - frete:         valor calculado do frete (em reais)
        - cupomAplicado: booleano que indica se ha cupom ativo
        - cupomCodigo:   string com o código do cupom ativo (ex: "DESCONTO10")
        - cepValidado:   booleano que trava o avanço para pagamento enquanto o frete nao for calculado

    Estado por produto (dias, unidades) e salvo diretamente nos data-attributes do elemento HTML via setDias/setUnidades. */
const estado = {
    frete: 0,
    cupomAplicado: false,
    cupomCodigo: '',
    cepValidado: false,
};

/*
    TABELA DE CUPONS VALIDOS
    Em producao, estes dados viriam de uma API autenticada.
    A chave do objeto e o codigo que o usuario digita (case-insensitive,
    ja que o JS converte o input para maiusculas antes de consultar).

    TIPOS DE CUPOM:
        - 'percentual' → desconta uma porcentagem do subtotal (ex: DESCONTO10 tira 10% do subtotal)
        - 'fixo'       → desconta um valor fixo em reais (ex: FIXO50 desconta R$50,00)
        - 'frete'      → zera o frete sem alterar o subtotal (ex: FRETEGRATIS)

    IMPORTANTE: o campo `tipo` e a fonte de verdade para identificar cupons de frete grátis — a função cupomAtualIsFreteGratis() consulta este campo, evitando hardcode do nome "FRETEGRATIS" no restante do codigo.
    Se o cupom for renomeado, apenas esta tabela precisa ser atualizada. */
const CUPONS = {
    DESCONTO10: { tipo: 'percentual', valor: 10, label: '10% de desconto' },
    FRETEGRATIS: { tipo: 'frete', valor: 0, label: 'Frete grátis' },
    FIXO50: { tipo: 'fixo', valor: 50, label: 'R$\u00a050,00 de desconto' },
};

/* Limites mínimo e máximo de dias de aluguel por produto */
const DIAS_MIN = 1;
const DIAS_MAX = 30;

/* Limites mínimo e máximo de unidades por produto */
const UNID_MIN = 1;
const UNID_MAX = 10;

/* Valor fixo de frete simulado (em produção viria da API de logística) */
const FRETE_FIXO = 20;


/* ========================================================
    1.1 REFERENCIAS CENTRAIS AO DOM

    PROBLEMA RESOLVIDO:
    Chamar document.querySelector espalhado pelo código faz o navegador percorrer o DOM inteiro a cada chamada. Em interações rápidas (ex: cliques repetidos) isso gera custo desnecessário.

    SOLUÇÃO:
    Todos os elementos fixos da página são capturados UMA UNICA VEZ
    em inicializarRefs() e armazenados no objeto `refs`.
    Se um seletor mudar, só precisa ser corrigido em um lugar.

    NOTA: elementos criados dinamicamente (ex: a linha de desconto)
    NÃO ficam em refs, pois não existem no carregamento inicial.
======================================================== */

/* Objeto que centraliza as referencias aos elementos fixos do DOM.
    Declarado aqui vazio; populado por inicializarRefs() no DOMContentLoaded.*/
const refs = {};

/* inicializarRefs()
    Captura e armazena os elementos da pagina que sao consultados repetidamente ao longo da vida da aplicação.
    Chamada uma única vez, logo após o DOMContentLoaded.

    Sem retorno. Side effect: popula o objeto `refs`. */
function inicializarRefs() {
    /* Referências ao painel de resumo do pedido */
    refs.elSubtotal = document.querySelector('.resumo-linha strong');      // exibe o subtotal
    refs.elTotal    = document.querySelector('.resumo-total strong');      // exibe o total final
    refs.elFreteTopo = document.querySelector('.resumo-frete-topo');       // exibe o valor do frete
    refs.cardResumo  = document.querySelector('.card-resumo');             // painel inteiro do resumo

    /* Campos de entrada */
    refs.inputCep   = document.querySelector('.input-cep');               // input de CEP
    refs.inputCupom = document.querySelector('.input-cupom');             // input de cupom

    /* Botoes da sidebar */
    refs.btnUsar      = document.querySelector('.btn-usar');              // calcula frete
    refs.btnAplicar   = document.querySelector('.btn-aplicar');           // aplica cupom
    refs.btnRemover   = document.querySelector('.btn-remover-cupom');     // remove cupom ativo
    refs.btnContinuar = document.querySelector('.btn-continuar');         // avança para pagamento

    /* Container pai de todos os produtos (ponto de delegação de eventos) */
    refs.colunaProdutos = document.querySelector('.coluna-produtos');

    /* Região de toast global de acessibilidade */
    refs.avisoGlobal    = document.getElementById('aviso-global');

    /* Container e mensagem de erro/sucesso do campo de CEP */
    refs.campoCep = document.querySelector('.campo-cep');
    refs.erroCep  = document.getElementById('erro-cep');

    /* Container e mensagem de erro/sucesso do campo de cupom */
    refs.campoCupom = document.querySelector('.campo-cupom');
    refs.erroCupom  = document.getElementById('erro-cupom');
}


/* ========================================================
    2. HELPERS DE LEITURA E ESCRITA DE ESTADO POR CARD

    Cada produto mantém seu próprio estado (dias e unidades) diretamente no elemento HTML via `dataset`.
    O elemento HTML é a fonte de verdade — não ha objeto JS espelhando esses valores.
======================================================== */

/* getPrecoDia(card)
    Lê o preço por dia do data-attribute do card.
    Retorna 0 se o atributo nao existir ou for inválido.

    @param {Element} card - elemento .card-produto
    @returns {number} preco em reais por dia */
const getPrecoDia = (card) => parseFloat(card.dataset.precoDia) || 0;

/* getDias(card)
    Lê a quantidade atual de dias do data-attribute do card.

    USO DE Number.isNaN() ao invés de || (OR curto-circuito):
    Se parseInt retornar 0 (valor tecnicamente valido), o operador `|| fallback` trataria 0 como falsy e retornaria o fallback incorretamente. Number.isNaN() so aciona o fallback quando o parse genuinamente falha (retorna NaN).

    @param {Element} card - elemento .card-produto
    @returns {number} numero de dias selecionados (minimo DIAS_MIN) */
const getDias = (card) => {
    const valor = parseInt(card.dataset.dias, 10);
    return Number.isNaN(valor) ? DIAS_MIN : valor;
};

/* getUnidades(card)
    Lê a quantidade atual de unidades do data-attribute do card.
    Mesma lógica de segurança de getDias().

    @param {Element} card - elemento .card-produto
    @returns {number} número de unidades selecionadas (mínimo UNID_MIN) */
const getUnidades = (card) => {
    const valor = parseInt(card.dataset.unidades, 10);
    return Number.isNaN(valor) ? UNID_MIN : valor;
};

/* setDias(card, valor)
    Salva a quantidade de dias no data-attribute do card, aplicando clamp de seguranca entre DIAS_MIN e DIAS_MAX.

    Math.min + Math.max juntos garantem que o valor final nunca seja menor que DIAS_MIN nem maior que DIAS_MAX.

    Side effect: altera card.dataset.dias.

    @param {Element} card  - elemento .card-produto
    @param {number}  valor - numero de dias desejado (antes do clamp) */
function setDias(card, valor) {
    card.dataset.dias = Math.min(DIAS_MAX, Math.max(DIAS_MIN, valor));
}

/* setUnidades(card, valor)
    Salva a quantidade de unidades no data-attribute do card, aplicando clamp de seguranca entre UNID_MIN e UNID_MAX.
    NOTA: o limite de estoque e verificado ANTES de chamar setUnidades, em handleControle().

    Side effect: altera card.dataset.unidades.

    @param {Element} card  - elemento .card-produto
    @param {number}  valor - numero de unidades desejado (antes do clamp) */
function setUnidades(card, valor) {
    card.dataset.unidades = Math.min(UNID_MAX, Math.max(UNID_MIN, valor));
}

/* getEstoque(card)
    Lê a quantidade em estoque do data-attribute do card.
    Retorna 0 se o atributo nao existir ou for invalido.

    @param {Element} card - elemento .card-produto
    @returns {number} quantidade em estoque */
const getEstoque = (card) => {
    const valor = parseInt(card.dataset.estoque, 10);
    return Number.isNaN(valor) ? 0 : valor;
};


/* ========================================================
    3. CALCULOS PUROS
    (sem side effects; recebem dados, devolvem numeros)

    Funcoes puras nao alteram nada fora delas: recebem dados como parametros e devolvem um resultado. Isso facilita testar, depurar e compreender o codigo.
======================================================== */

/* calcularTotalCard(card)
    Calcula o custo total de um produto:
    preco/dia * quantidade de dias * quantidade de unidades.

    FUNÇÃO PURA — sem side effects.

    @param {Element} card - elemento .card-produto
    @returns {number} total em reais para aquele produto */
const calcularTotalCard = (card) =>
    getPrecoDia(card) * getDias(card) * getUnidades(card);

/* calcularSubtotal(cards)
    Soma os totais individuais de todos os produtos no carrinho.

    Usa Array.reduce para acumular a soma, iniciando em 0.
    FUNÇÃO PURA — sem side effects.

    @param {Element[]} cards - array de elementos .card-produto
    @returns {number} soma total em reais de todos os produtos */
const calcularSubtotal = (cards) =>
    cards.reduce((soma, card) => soma + calcularTotalCard(card), 0);

/* totalUnidadesCarrinho(cards)
    Soma a quantidade de unidades de TODOS os produtos no carrinho.
    Usado para calculos globais de limite e disponibilidade.

    FUNÇÃO PURA — sem side effects.

    @param {Element[]} cards - array de elementos .card-produto
    @returns {number} total de unidades em todo o carrinho */
const totalUnidadesCarrinho = (cards) =>
    cards.reduce((total, card) => total + getUnidades(card), 0);

/* calcularDesconto(subtotal)
    Calcula o valor do desconto com base no tipo do cupom ativo.

    TIPOS TRATADOS:
        - 'percentual' → (subtotal * valor) / 100
        - 'fixo'       → Math.min(valor, subtotal) — nao desconta mais que o subtotal
        - 'frete'      → retorna 0 (cupons de frete atuam sobre o freteReal em atualizarResumo)
        - sem cupom    → retorna 0

    FUNÇÃO PURA — sem side effects.
    Lê `estado.cupomAplicado` e `estado.cupomCodigo` como dados de entrada.

    @param {number} subtotal - valor total dos produtos sem frete
    @returns {number} valor do desconto em reais */
function calcularDesconto(subtotal) {
    if (!estado.cupomAplicado || !estado.cupomCodigo) return 0;

    const cupom = CUPONS[estado.cupomCodigo];
    if (!cupom) return 0;

    switch (cupom.tipo) {
        case 'percentual': return (subtotal * cupom.valor) / 100;
        case 'fixo': return Math.min(cupom.valor, subtotal);
        /* 'frete' e qualquer tipo desconhecido retornam 0 */
        default: return 0;
    }
}

/* cupomAtualIsFreteGratis()
    Verifica se o cupom ativo e do tipo 'frete'.

    FUNÇÃO PURA — sem side effects.

    @returns {boolean} true se o cupom ativo e do tipo 'frete' */
const cupomAtualIsFreteGratis = () =>
    CUPONS[estado.cupomCodigo]?.tipo === 'frete';


/* ========================================================
    4. INICIALIZACAO
======================================================== */

/* inicializarProdutos()
    Lê o estado inicial dos cards a partir do HTML e popula os data-attributes de cada produto, em seguida renderiza todos.

    SOLUÇÃO EM TRÊS PASSOS:
        Passo 1 → popula os datasets de TODOS os cards primeiro
        Passo 2 → calcula totalGlobal UMA VEZ com todos os dados prontos
        Passo 3 → renderiza todos os cards com o totalGlobal exato

        Side effect: altera datasets dos cards e atualiza o DOM. */
function inicializarProdutos() {
    const cards = getTodosCards();

    /* ── Passo 1: popula os datasets de todos os cards ── */
    cards.forEach((card) => {
        /* Para cada card, identifica os dois grupos de controle (dias e unidades) e marca cada um com data-type.
            A distincao e feita pela classe "controle-unidade":
                - tem a classe  → data-type="unidades"
                - nao tem       → data-type="dias" */
        card.querySelectorAll('.controle-grupo').forEach((grupo) => {
            grupo.dataset.type = grupo.classList.contains('controle-unidade')
                ? 'unidades'
                : 'dias';
        });

        /* Caches locais de grupoDias e grupoUnid para evitar dois querySelector separados logo em seguida. */
        const grupoDias = card.querySelector('[data-type="dias"]');
        const grupoUnid = card.querySelector('[data-type="unidades"]');

        /* Le os valores iniciais do texto HTML e os salva no dataset */
        const dias = parseInt(grupoDias?.querySelector('.controle-valor')?.textContent, 10);
        card.dataset.dias = Number.isNaN(dias) ? DIAS_MIN : dias;

        const unidades = parseInt(grupoUnid?.querySelector('.controle-valor')?.textContent, 10);
        card.dataset.unidades = Number.isNaN(unidades) ? UNID_MIN : unidades;
    });

    /* ── Passo 2: calcula o total global UMA vez, com todos os datasets prontos ── */
    const totalGlobal = totalUnidadesCarrinho(cards);

    /* ── Passo 3: renderiza todos os cards com o total global correto ── */
    cards.forEach((card) => atualizarCardProduto(card, cards, totalGlobal));
}


/* ========================================================
    5. COLETA DE CARDS (cache leve)
======================================================== */

/* getTodosCards()
    Centraliza o querySelectorAll('.card-produto').
    Array.from() converte NodeList em Array para poder usar .reduce() e .forEach() sem polyfills.

    IMPORTANTE: chamado a cada interacao (nao e um cache permanente), pois cards podem ser removidos do DOM pelo usuario.

    @returns {Element[]} array atual de todos os .card-produto na pagina */
const getTodosCards = () =>
    Array.from(document.querySelectorAll('.card-produto'));


/* ========================================================
    6. RENDERIZACAO
======================================================== */

/* formatarMoeda(valor)
    Formata um numero como moeda brasileira usando a API nativa do navegador.
    Exemplo: 1234.5 → "R$\u00a01.234,50"

    FUNÇÃO PURA — sem side effects.

    @param {number} valor - valor em reais
    @returns {string} valor formatado como moeda BRL */
const formatarMoeda = (valor) =>
    valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/* atualizarCardProduto(card, todosCards, totalGlobal)
    Atualiza todos os elementos visuais de um card de produto: texto de dias, texto de unidades, preco detalhado, total do card e estado dos botoes (habilitado/desabilitado).

    DECISAO DE PERFORMANCE:
    O parametro `totalGlobal` e passado pelo CHAMADOR, que o calcula UMA vez antes do loop. 

    Side effect: altera textContent e atributos de elementos do DOM.

    @param {Element}   card        - elemento .card-produto a ser atualizado
    @param {Element[]} todosCards  - array de todos os cards (para contexto global)
    @param {number}    totalGlobal - soma de unidades ja calculada pelo chamador */
function atualizarCardProduto(card, todosCards, totalGlobal) {
    const dias      = getDias(card);
    const unidades  = getUnidades(card);
    const precoDia  = getPrecoDia(card);
    const totalCard = calcularTotalCard(card);

    /* ── Atualiza label de disponibilidade em estoque ── */
    const labelDisp = card.querySelector('.controle-label-disp');

    if (labelDisp) {
        const estoque    = getEstoque(card);
        const unidades   = getUnidades(card);
        /* Disponivel = total em estoque menos unidades ja selecionadas */
        const disponivel = estoque - unidades;

        labelDisp.textContent = `+${disponivel} disponíveis`;
    }

    /* Cache local dos grupos de controle para evitar dois querySelector separados logo abaixo.
    */
    const grupoDias = card.querySelector('[data-type="dias"]');
    const grupoUnid = card.querySelector('[data-type="unidades"]');

    /* ── Grupo de dias: texto e estado dos botoes ── */
    if (grupoDias) {
        /* Texto com suporte a singular/plural: 1 dia / 2 dias */
        grupoDias.querySelector('.controle-valor').textContent =
            `${dias} ${dias === 1 ? 'dia' : 'dias'}`;

        /* Desabilita o botao "−" no minimo e o "+" no maximo */
        setBotaoEstado(grupoDias.querySelector('[data-action="decrement"]'), dias <= DIAS_MIN);
        setBotaoEstado(grupoDias.querySelector('[data-action="increment"]'), dias >= DIAS_MAX);
    }

    /* ── Grupo de unidades: texto e estado dos botoes ── */
    if (grupoUnid) {
        /* Texto com suporte a singular/plural */
        grupoUnid.querySelector('.controle-valor').textContent =
            `${unidades} ${unidades === 1 ? 'unidade' : 'unidades'}`;

        const estoque = getEstoque(card);
        /* O botao "+" de unidades e desabilitado se:
            - unidades atingiram UNID_MAX (limite absoluto), OU
            - unidades atingiram o estoque disponivel do produto */
        const atingiuLimiteMax = unidades >= estoque;

        setBotaoEstado(
            grupoUnid.querySelector('[data-action="decrement"]'),
            unidades <= UNID_MIN
        );

        setBotaoEstado(
            grupoUnid.querySelector('[data-action="increment"]'),
            unidades >= UNID_MAX || atingiuLimiteMax
        );
    }

    /* ── Texto de preco detalhado (ex: "R$15,00/dia × 2 dias") ── */
    const detalheEl = card.querySelector('.produto_preco');
    if (detalheEl) {
        detalheEl.textContent =
            `${formatarMoeda(precoDia)}/dia × ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
    }

    /* ── Texto de total do card (ex: "Total: R$30,00") ── */
    const totalEl = card.querySelector('.produto_total');
    if (totalEl) totalEl.textContent = `Total: ${formatarMoeda(totalCard)}`;
}

/* setBotaoEstado(btn, desabilitado)
    Liga ou desliga um botao de controle de forma acessivel.

    Usa tres mecanismos complementares:
        - btn.disabled         → bloqueia clique e teclado nativamente
        - aria-disabled="true" → informa leitores de tela do estado
        - classe CSS           → permite estilizar o botao desabilitado via CSS

    Side effect: altera atributos e classes do elemento btn.

    @param {Element|null} btn         - botao a ser atualizado
    @param {boolean}      desabilitado - true para desabilitar, false para habilitar */
function setBotaoEstado(btn, desabilitado) {
    if (!btn) return;
    btn.disabled = desabilitado;
    btn.setAttribute('aria-disabled', String(desabilitado));
    btn.classList.toggle('btn-controle--desabilitado', desabilitado);
}

/* atualizarResumo()
    Recalcula e exibe os valores do painel de resumo do pedido.
    Deve ser chamada apos QUALQUER alteracao no carrinho (adicionar/remover produto, mudar dias/unidades, aplicar cupom ou CEP).

    FLUXO INTERNO:
        1. Coleta todos os cards atuais
        2. Calcula subtotal e desconto
        3. Determina se o frete deve ser zerado (cupom de frete)
        4. Calcula o total final: subtotal + frete - desconto (min 0)
        5. Atualiza os elementos do DOM via refs
        6. Injeta/remove a linha de desconto se necessario
        7. Atualiza o label do frete
        8. Persiste os valores no localStorage

    Side effect: altera o DOM (refs.elSubtotal, refs.elTotal,
    refs.elFreteTopo) e o localStorage. */
function atualizarResumo() {
    const cards    = getTodosCards();
    const subtotal = calcularSubtotal(cards);
    const desconto = calcularDesconto(subtotal);

    /* Verifica se o cupom ativo e do tipo 'frete' para zerar o frete. Desacoplado do nome do cupom — consulta o tipo via CUPONS. */
    const freteIsento = cupomAtualIsFreteGratis();
    const freteReal   = freteIsento ? 0 : estado.frete;

    /* Garante que o total nunca seja negativo */
    const total = Math.max(0, subtotal + freteReal - desconto);

    /* Atualiza os textos do painel usando refs (sem querySelector) */
    if (refs.elSubtotal) refs.elSubtotal.textContent = formatarMoeda(subtotal);
    if (refs.elTotal)    refs.elTotal.textContent    = formatarMoeda(total);

    /* Cria, atualiza ou remove a linha de desconto dinamicamente */
    renderizarLinhaDesconto(desconto);

    /* Atualiza o label de frete de acordo com o estado atual:
            - "Grátis"         → cupom de frete ativo
            - formatarMoeda(x) → CEP validado e frete calculado
            - "--"             → CEP ainda nao informado */
    if (refs.elFreteTopo) {
        if (freteIsento) {
            refs.elFreteTopo.textContent = 'Grátis';
        } else if (freteReal > 0) {
            refs.elFreteTopo.textContent = formatarMoeda(estado.frete);
        } else {
            refs.elFreteTopo.textContent = '--';
        }
    }

    /* Persiste os valores para uso na proxima etapa (metodoPagamento.html) */
    salvarResumoNoLocalStorage(subtotal, freteReal, total, desconto);
}

/* renderizarLinhaDesconto(desconto)
    Cria, atualiza ou remove a linha de desconto no painel de resumo.

    LÓGICA:
        - Se desconto <= 0: remove a linha (se existir) e retorna
        - Se desconto > 0 e linha nao existe: cria e insere ANTES do <hr>
        - Se desconto > 0 e linha ja existe: atualiza o valor

    O ponto de insercao e a referencia `.linha-divisoria` dentro de refs.cardResumo, garantindo que a linha de desconto fique sempre acima do divisor e abaixo dos campos de frete/cupom.

    Side effect: pode criar ou remover elemento do DOM.

    @param {number} desconto - valor do desconto em reais */
function renderizarLinhaDesconto(desconto) {
    const divisor = refs.cardResumo?.querySelector('.linha-divisoria');
    let linhaEl   = refs.cardResumo?.querySelector('.resumo-linha--desconto');

    /* Sem desconto: remove a linha se ela existir */
    if (desconto <= 0) {
        if (linhaEl) linhaEl.remove();
        return;
    }

    /* Com desconto: cria o elemento se ainda nao existir */
    if (!linhaEl) {
        linhaEl = document.createElement('div');
        linhaEl.className = 'resumo-linha resumo-linha--desconto';
        linhaEl.innerHTML = '<span>Desconto</span><strong class="resumo-desconto-valor"></strong>';
        /* Insere antes do divisor, mantendo a ordem visual do resumo */
        divisor?.parentNode.insertBefore(linhaEl, divisor);
    }

    /* Atualiza o valor exibido (com sinal de negativo) */
    linhaEl.querySelector('.resumo-desconto-valor')
        .textContent = `− ${formatarMoeda(desconto)}`;
}

/* verificarCarrinhoVazio(cardsRestantes)
    Redireciona para a pagina de carrinho vazio se nao houver mais produtos.
    Chamada apos cada remocao de produto.

    Side effect: pode redirecionar a pagina (window.location.href).

    @param {Element[]} cardsRestantes - array de cards ainda presentes no DOM */
function verificarCarrinhoVazio(cardsRestantes) {
    if (cardsRestantes.length === 0) {
        window.location.href = '/carrinhoVazio.html';
    }
}


/* ========================================================
    6.1 PERSISTENCIA — localStorage

    Os valores do resumo sao salvos no localStorage para que a proxima etapa (metodoPagamento.html) possa acessa-los sem precisar recalcular.

    CHAVES SALVAS:
        - 'subtotal'  → soma dos produtos
        - 'frete'     → valor do frete calculado
        - 'total'     → valor final a pagar
        - 'desconto'  → valor do desconto aplicado
======================================================== */

/* formatarParaStorage(valor)
    Garante que o valor salvo tenha sempre duas casas decimais.
    Retorna "0.00" se o valor for undefined, null ou NaN.

    FUNÇÃO PURA — sem side effects.

    @param {*} valor - valor a ser formatado
    @returns {string} numero com duas casas decimais (ex: "184.00") */
function formatarParaStorage(valor) {
    return Number(valor || 0).toFixed(2);
}

/* salvarResumoNoLocalStorage(subtotal, frete, total, desconto)
    Persiste os valores do resumo do pedido no localStorage.
    Chamada ao final de atualizarResumo().

    Side effect: escreve no localStorage do navegador.

    @param {number} subtotal - soma dos produtos
    @param {number} frete    - valor do frete (ja com isenção aplicada)
    @param {number} total    - total final a pagar
    @param {number} desconto - valor do desconto */
function salvarResumoNoLocalStorage(subtotal, frete, total, desconto) {
    localStorage.setItem('subtotal', formatarParaStorage(subtotal));
    localStorage.setItem('frete',    formatarParaStorage(frete));
    localStorage.setItem('total',    formatarParaStorage(total));
    localStorage.setItem('desconto', formatarParaStorage(desconto));
}


/* ========================================================
    7. HANDLERS DE EVENTOS
======================================================== */

/* handleRemoverProduto(btn)
    Remove um produto do carrinho com animacao de fade-out.

    FLUXO:
        1. Encontra o card pai do botao clicado
        2. Aplica animacao de desaparecimento (opacity 0, 250ms)
        3. Apos a animacao, remove o elemento do DOM
        4. Se o grupo de loja ficar vazio, remove o grupo tambem
        5. Recalcula e renderiza os cards restantes
        6. Atualiza o resumo
        7. Verifica se o carrinho ficou vazio

    REMOÇÃO DO GRUPO:
    Se todos os produtos de uma loja forem removidos, o elemento ".grupo-loja" e removido junto, limpando o cabecalho da loja.

    Side effect: remove elementos do DOM, atualiza resumo e pode redirecionar.

    @param {Element} btn - botao de remover clicado (data-action="remover") */
function handleRemoverProduto(btn) {
    const card = btn.closest('.card-produto');
    if (!card) return;

    /* Inicia animacao de fade-out */
    card.style.transition = 'opacity .25s';
    card.style.opacity    = '0';

    setTimeout(() => {
        const grupoPai = card.closest('.lista-produtos');
        card.remove();

        /* Se a lista ficou vazia, remove o grupo de loja inteiro */
        if (grupoPai && !grupoPai.querySelector('.card-produto')) {
            grupoPai.closest('.grupo-loja')?.remove();
        }

        const cardsRestantes = getTodosCards();

        /* totalGlobal calculado UMA vez antes do loop de renderizacao.
            Evita O(N^2) ao passar o valor calculado para cada chamada
            de atualizarCardProduto. */
        const totalGlobal = totalUnidadesCarrinho(cardsRestantes);
        cardsRestantes.forEach((c) => atualizarCardProduto(c, cardsRestantes, totalGlobal));

        atualizarResumo();
        verificarCarrinhoVazio(cardsRestantes);
    }, 250); /* Aguarda o fim da animacao de fade-out */
}

/* handleControle(btn)
    Incrementa ou decrementa dias ou unidades de um produto.

    IDENTIFICACAO DO TIPO:
    O tipo de controle (dias/unidades) e lido via grupo.dataset.type, que foi definido em inicializarProdutos() com base na classe CSS.

    LOGICA POR TIPO:
        - 'dias':      chama setDias com +/-1; sempre pode atualizar
        - 'unidades':  verifica estoque antes de incrementar;
            se exceder, exibe aviso e interrompe o fluxo

    FLUXO APOS ALTERACAO:
        1. Aplica a mudança no dataset do card
        2. Calcula totalGlobal uma vez
        3. Renderiza todos os cards com o novo estado
        4. Atualiza o resumo do pedido

    Side effect: altera datasets dos cards, atualiza o DOM e o resumo.

    @param {Element} btn - botão de controle clicado (increment ou decrement) */
function handleControle(btn) {
    const grupo = btn.closest('.controle-grupo');
    const card  = btn.closest('.card-produto');
    if (!grupo || !card) return;

    const tipo  = grupo.dataset.type;
    const delta = btn.dataset.action === 'increment' ? 1 : -1;

    const todosCards = getTodosCards();

    /* Mapa de ações por tipo de controle.
        Cada função retorna:
            - true  → a alteração foi valida, prosseguir com a renderização
            - false → a alteração foi bloqueada (ex: estoque esgotado), interromper */
    const actions = {
        dias: () => {
            setDias(card, getDias(card) + delta);
            return true;
        },

        unidades: () => {
            if (delta > 0) {
                const estoque  = getEstoque(card);
                const novaQtd  = getUnidades(card) + 1;

                /* REGRA DE NEGÓCIO:
                    Não permite adicionar mais unidades que o estoque disponível.
                    Exibe aviso via toast e interrompe o fluxo (retorna false). */
                if (novaQtd > estoque) {
                    exibirAviso('Você atingiu o limite de estoque deste produto.', 'erro');
                    return false;
                }
            }

            setUnidades(card, getUnidades(card) + delta);
            return true;
        }
    };

    const podeAtualizar = actions[tipo]?.();

    /* Se a ação retornou false (ex: estoque), encerra aqui sem renderizar */
    if (!podeAtualizar) return;

    /* totalGlobal calculado UMA vez antes do loop de renderização. Custo O(N) em vez de O(N^2). */
    const totalGlobal = totalUnidadesCarrinho(todosCards);
    todosCards.forEach((c) => atualizarCardProduto(c, todosCards, totalGlobal));

    atualizarResumo();
}


/* ========================================================
    8. CUPONS E FRETE
======================================================== */

/* Variável de controle do timeout do calculo de frete.
    Permite cancelar um calculo anterior caso o usuario clique rapidamente em "Usar" varias vezes seguidas (debounce). */
let _freteTimeout = null;

/* handleCalcularFrete()
    Simula uma consulta de frete por CEP com delay de 800ms.

    VALIDAÇÃO:
    CEP deve ter exatamente 8 digitos numericos (mascara 00000-000).
    Se invalido, exibe erro inline e interrompe.

    ESTADOS DO BOTÃO "Usar" DURANTE O CALCULO:
        1. Exibe spinner de carregamento (btn-loading)
        2. Apos 800ms: volta ao texto "Usar" e registra o frete

    REGRA DE NEGÓCIO:
    estado.cepValidado = true apenas apos calculo bem-sucedido.
    Este flag e verificado em handleContinuarPagamento() antes de permitir avanco para pagamento.

    Side effect: altera estado.frete, estado.cepValidado, DOM e resumo. */
function handleCalcularFrete() {
    const cep = refs.inputCep?.value.replace(/\D/g, '') ?? '';

    if (cep.length !== 8) {
        setCepErro(true, 'Informe um CEP válido.');
        return;
    }

    /* Cancela timeout anterior se existir (previne duplo calculo) */
    clearTimeout(_freteTimeout);

    /* Exibe spinner de carregamento no botao */
    if (refs.btnUsar) {
        refs.btnUsar.textContent = '';
        refs.btnUsar.classList.add('btn-loading');
        refs.btnUsar.disabled = true;
    }

    /* Simula latencia de API (800ms) */
    _freteTimeout = setTimeout(() => {
        estado.frete = FRETE_FIXO;
        atualizarResumo();

        /* Restaura o botao ao estado normal */
        if (refs.btnUsar) {
            refs.btnUsar.textContent = 'Usar';
            refs.btnUsar.classList.remove('btn-loading');
            refs.btnUsar.disabled = false;
        }

        /* Marca CEP como validado — libera o avanco para pagamento */
        estado.cepValidado = true;

        setCepErro(false);
        setCepSucesso(`Frete: ${formatarMoeda(FRETE_FIXO)}`);
    }, 800);
}

/* setCepErro(ativo, msg)
    Exibe ou oculta o erro inline abaixo do campo de CEP.
    Centraliza toda a manipulacao de estado visual do campo.

    ESTADOS POSSIVEIS:
        - Erro ativo:   adiciona classe de erro, exibe mensagem, foca o input
        - Erro inativo: remove classes, limpa mensagem

    NOTA: ao ativar erro, garante que a classe de sucesso seja removida,
    e vice-versa, evitando conflito de estilos.

    Side effect: altera classes CSS e textContent de elementos do DOM.

    @param {boolean} ativo - true para exibir erro, false para limpar
    @param {string}  msg   - mensagem de erro a exibir (ignorada se ativo=false) */
function setCepErro(ativo, msg = '') {
    if (!refs.campoCep || !refs.erroCep) return;

    refs.campoCep.classList.toggle('campo-cep--erro', ativo);

    refs.erroCep.textContent = ativo ? msg : '';

    refs.erroCep.classList.toggle('erro-cep--visivel', ativo);

    /* Garante que apenas a classe correta (erro) esteja ativa */
    refs.erroCep.classList.toggle('erro-cep--erro', ativo);
    refs.erroCep.classList.remove('erro-cep--sucesso');

    if (ativo) refs.inputCep?.focus();
}

/* Timeout de auto-remocao da mensagem de sucesso do CEP.
    Referencia global para permitir cancelamento caso uma nova mensagem de sucesso seja exibida antes do timeout anterior expirar. */
let _cepSucessoTimeout = null;

/* setCepSucesso(msg)
    Exibe uma mensagem de sucesso abaixo do campo de CEP.
    Remove a mensagem automaticamente apos 8 segundos.

    FLUXO:
        1. Cancela timeout anterior se existir
        2. Remove classe de erro, adiciona classe de sucesso
        3. Exibe a mensagem
        4. Agenda remocao automatica apos 8s

    Side effect: altera classes CSS e textContent do DOM.
    Agenda timeout (side effect assincrono).

    @param {string} msg - mensagem de sucesso a exibir */
function setCepSucesso(msg) {
    if (!refs.campoCep || !refs.erroCep) return;

    clearTimeout(_cepSucessoTimeout);

    refs.campoCep.classList.remove('campo-cep--erro');
    refs.campoCep.classList.add('campo-cep--sucesso');

    refs.erroCep.textContent = msg;

    refs.erroCep.classList.add('erro-cep--visivel');
    refs.erroCep.classList.add('erro-cep--sucesso');
    refs.erroCep.classList.remove('erro-cep--erro');

    /* Remove a mensagem de sucesso automaticamente apos 8 segundos */
    _cepSucessoTimeout = setTimeout(() => {
        refs.erroCep.textContent = '';
        refs.erroCep.classList.remove('erro-cep--visivel', 'erro-cep--sucesso');
        refs.campoCep.classList.remove('campo-cep--sucesso');
    }, 8000);
}

/* setCupomErro(ativo, msg)
    Exibe ou oculta o erro inline abaixo do campo de cupom.
    Lógica identica a setCepErro(), garantindo consistencia visual entre os dois campos de entrada da sidebar.

    Side effect: altera classes CSS e textContent de elementos do DOM.

    @param {boolean} ativo - true para exibir erro, false para limpar
    @param {string}  msg   - mensagem de erro a exibir (ignorada se ativo=false) */
function setCupomErro(ativo, msg = '') {
    if (!refs.campoCupom || !refs.erroCupom) return;

    refs.campoCupom.classList.toggle('campo-cupom--erro', ativo);

    refs.erroCupom.textContent = ativo ? msg : '';
    refs.erroCupom.classList.toggle('erro-cupom--visivel', ativo);

    /* Garante que apenas a classe correta (erro) esteja ativa */
    refs.erroCupom.classList.toggle('erro-cupom--erro', ativo);
    refs.erroCupom.classList.remove('erro-cupom--sucesso');

    if (ativo) refs.inputCupom?.focus();
}

/* Timeout de auto-remocao da mensagem de sucesso do cupom. Mesmo padrao do _cepSucessoTimeout. */
let _cupomSucessoTimeout = null;

/* setCupomSucesso(msg)
    Exibe uma mensagem de sucesso abaixo do campo de cupom.
    Remove a mensagem automaticamente apos 8 segundos.
    Logica identica a setCepSucesso().

    Side effect: altera classes CSS e textContent do DOM.
    Agenda timeout (side effect assincrono).

    @param {string} msg - mensagem de sucesso a exibir */
function setCupomSucesso(msg) {
    if (!refs.campoCupom || !refs.erroCupom) return;

    clearTimeout(_cupomSucessoTimeout);

    refs.campoCupom.classList.remove('campo-cupom--erro');
    refs.campoCupom.classList.add('campo-cupom--sucesso');

    refs.erroCupom.textContent = msg;

    refs.erroCupom.classList.add('erro-cupom--visivel');
    refs.erroCupom.classList.add('erro-cupom--sucesso');
    refs.erroCupom.classList.remove('erro-cupom--erro');

    /* Remove a mensagem de sucesso automaticamente apos 8 segundos */
    _cupomSucessoTimeout = setTimeout(() => {
        refs.erroCupom.textContent = '';
        refs.erroCupom.classList.remove('erro-cupom--visivel', 'erro-cupom--sucesso');
        refs.campoCupom.classList.remove('campo-cupom--sucesso');
    }, 8000);
}

/* handleAplicarCupom()
    Válida e aplica o cupom digitado pelo usuário.

    FLUXO DE VALIDAÇÃO (em ordem):
        1. Ja existe cupom aplicado → erro inline, interrompe
        2. Campo vazio → erro inline, interrompe
        3. Exibe spinner de 800ms (simula chamada de API)
        4. Codigo nao encontrado em CUPONS → erro inline, interrompe
        5. Codigo valido → aplica o cupom, atualiza resumo

    DECISAO DE UX:
    Erros de validação sao exibidos inline abaixo do campo de cupom via setCupomErro(), mantendo consistencia com o campo de CEP.
    O toast global (exibirAviso) e reservado apenas para confirmações de sucesso, não para erros.

    SEGURANÇA:
    Usa Object.prototype.hasOwnProperty.call() para verificar se o codigo existe em CUPONS, evitando falso-positivo com chaves herdadas do prototype.

    Side effect: altera estado.cupomAplicado, estado.cupomCodigo, DOM e resumo. */
function handleAplicarCupom() {
    /* Bloqueia se ja ha cupom ativo — permite apenas um por vez */
    if (estado.cupomAplicado) {
        setCupomErro(true, 'Já existe um cupom aplicado. Remova-o para usar outro.');
        return;
    }

    const codigo = (refs.inputCupom?.value ?? '').trim().toUpperCase();

    if (!codigo) {
        setCupomErro(true, 'Digite um código de cupom.');
        return;
    }

    /* Exibe spinner de carregamento no botao durante a simulacao */
    if (refs.btnAplicar) {
        refs.btnAplicar.textContent = '';
        refs.btnAplicar.classList.add('btn-loading');
        refs.btnAplicar.disabled = true;
    }

    /* Simula latencia de API (800ms) */
    setTimeout(() => {
        /* Verificacao segura: hasOwnProperty evita que chaves herdadas do Object.prototype (ex: 'constructor', 'toString') sejam confundidas com cupons validos. */
        const cupom = Object.prototype.hasOwnProperty.call(CUPONS, codigo)
            ? CUPONS[codigo]
            : null;

        if (!cupom) {
            setCupomErro(true, 'Cupom inválido ou expirado.');

            /* Restaura o botao antes de retornar */
            if (refs.btnAplicar) {
                refs.btnAplicar.disabled    = false;
                refs.btnAplicar.textContent = 'Aplicar';
                refs.btnAplicar.classList.remove('btn-loading');
            }
            return;
        }

        /* Cupom valido: atualiza o estado global */
        estado.cupomAplicado = true;
        estado.cupomCodigo   = codigo;

        /* Limpa qualquer erro inline anterior */
        setCupomErro(false);
        setCupomSucesso(`Cupom "${cupom.label}" aplicado`);

        if (refs.inputCupom) {
            refs.inputCupom.value = codigo;
            refs.inputCupom.blur();
            refs.inputCupom.classList.remove('input--erro', 'input--sucesso');
        }

        /* Exibe o botao de remover cupom (estava oculto com hidden) */
        if (refs.btnRemover) refs.btnRemover.style.display = 'inline-block';

        /* Recalcula o resumo com o desconto do cupom aplicado */
        atualizarResumo();

        /* Restaura o botao ao estado normal */
        if (refs.btnAplicar) {
            refs.btnAplicar.textContent = 'Aplicar';
            refs.btnAplicar.classList.remove('btn-loading');
            refs.btnAplicar.disabled = false;
        }
    }, 800);
}

/* temCupomNaoAplicado()
    Verifica se o usuario digitou algo no campo de cupom mas nao clicou em "Aplicar".

    Usada em handleContinuarPagamento() para bloquear o avanco quando ha cupom digitado mas pendente de aplicacao.

    FUNÇÃO PURA em relacao ao DOM — sem side effects.

    @returns {boolean} true se ha texto no input E nenhum cupom foi aplicado */
function temCupomNaoAplicado() {
    const valor = (refs.inputCupom?.value ?? '').trim();

    return valor !== '' && !estado.cupomAplicado;
}

/* handleRemoverCupom()
    Remove o cupom ativo e restaura o estado inicial do campo.

    FLUXO:
        1. Reabilita o botao "Aplicar" (pode ter ficado desabilitado)
        2. Reseta estado.cupomAplicado e estado.cupomCodigo
        3. Limpa e reabilita o input de cupom
        4. Limpa mensagens de erro inline via setCupomErro(false)
        5. Oculta o botao "×" de remocao
        6. Recalcula o resumo sem o desconto
        7. Exibe confirmacao de sucesso

    Side effect: altera estado global, DOM e resumo. */
function handleRemoverCupom() {
    if (refs.btnAplicar) refs.btnAplicar.disabled = false;

    estado.cupomAplicado = false;
    estado.cupomCodigo   = '';

    if (refs.inputCupom) {
        refs.inputCupom.value    = '';
        refs.inputCupom.disabled = false;
        refs.inputCupom.classList.remove('input--sucesso', 'input--erro');
    }

    /* Limpa qualquer erro inline que possa ter ficado visivel */
    setCupomErro(false);

    /* Oculta o botao de remover cupom */
    if (refs.btnRemover) refs.btnRemover.style.display = 'none';

    /* Recalcula o resumo — o desconto agora e 0 */
    atualizarResumo();
    setCupomSucesso('Cupom removido com sucesso');
}


/* ========================================================
    9. TOAST DE FEEDBACK (NAO-BLOQUEANTE)

    O toast e um aviso flutuante centralizado no topo da tela
    que aparece e desaparece automaticamente.

    USO RESERVADO PARA:
        - Limite de estoque atingido ao tentar adicionar unidades
        - Qualquer feedback positivo ou negativo de alto nivel

    NÃO USAR PARA:
        - Erros de validacao de cupom (usar setCupomErro)
        - Erros de validacao de CEP (usar setCepErro)
======================================================== */

/* Timeout de auto-remocao do toast */
let _avisoTimeout = null;

/* Guarda a ultima mensagem exibida para evitar re-exibicao da mesma mensagem enquanto o timeout anterior ainda esta ativo. */
let _ultimaMensagem = '';

/* exibirAviso(msg, tipo)
    Exibe um aviso flutuante (toast) no topo da tela.

    DEDUPLICACAO:
    Se a mesma mensagem ja estiver visivel (mesmo texto E timeout ativo), a funcao retorna sem fazer nada — evita piscar ou duplicar o aviso.

    TIPOS:
        - 'sucesso' → fundo verde (#22c55e), some apos 8 segundos
        - 'erro'    → fundo vermelho (#ef4444), some apos 4 segundos

    Os estilos do #aviso-global sao injetados por injetarEstilosJS().

    Side effect: altera o DOM (refs.avisoGlobal), agenda timeout assincrono.

    @param {string} msg  - texto do aviso
    @param {string} tipo - 'sucesso' (padrao) ou 'erro' */
function exibirAviso(msg, tipo = 'sucesso') {
    if (msg === _ultimaMensagem && _avisoTimeout) return;

    _ultimaMensagem = msg;

    if (!refs.avisoGlobal) return;

    refs.avisoGlobal.textContent = msg;
    refs.avisoGlobal.style.opacity = '1';

    refs.avisoGlobal.style.background =
        tipo === 'sucesso' ? '#22c55e' : '#ef4444';

    refs.avisoGlobal.style.color = '#fff';

    clearTimeout(_avisoTimeout);

    /* Durações diferentes por tipo: sucesso fica mais tempo na tela */
    _avisoTimeout = setTimeout(() => {
        refs.avisoGlobal.style.opacity = '0';
        _ultimaMensagem = '';
    }, tipo === 'sucesso' ? 8000 : 4000);
}


/* ========================================================
    10. CSS DINAMICO (estados funcionais injetados por JS)

    DECISAO TÉCNICA:
    Alguns estilos são dependentes de comportamento JavaScript (ex: spinner de loading, botao desabilitado, animacoes de aviso).
    Em vez de distribuir esses estilos em um arquivo .css separado (onde poderiam se desconectar da logica), eles ficam aqui, proximos do codigo que os aciona.

    QUANDO USAR ESTE PADRÃO:
        - Estilos que so fazem sentido quando uma classe e adicionada pelo JS
        - Animacoes e estados visuais controlados programaticamente
        - Componentes como o toast (#aviso-global) que sao 100% gerenciados pelo JS

    QUANDO NAO USAR:
        - Layout estatico, cores base, tipografia — esses ficam em .css
======================================================== */

/* injetarEstilosJS()
    Cria um elemento <style> e o insere no <head> da pagina.
    Chamada UMA vez no bootstrap, antes de qualquer renderizacao.

    Side effect: adiciona elemento ao <head> do documento. */
function injetarEstilosJS() {
    const style = document.createElement('style');
    style.textContent = `
    /* Botao de controle desabilitado: visualmente apagado e sem interacao */
    .btn-controle--desabilitado {
        opacity: .35;
        cursor: not-allowed;
        pointer-events: none;
    }

    /* Estados de validacao dos inputs (aplicados pelo JS via classList) */
    .input--erro    { border-color: #ef4444 !important; color: #ef4444; }
    .input--sucesso { color: #22c55e; font-weight: 600; }

    /* Linha de desconto: valor em verde para destaque positivo */
    .resumo-linha--desconto strong { color: #22c55e; }

    /* Animacao de entrada para linhas dinamicas do resumo */
    .resumo-linha--desconto,
    .resumo-linha--frete { animation: fadeIn .3s ease; }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to   { opacity: 1; transform: translateY(0);    }
    }

    /*
        Toast de aviso global (#aviso-global):
        Fixo no topo, centralizado horizontalmente.
        Inicia invisivel (opacity: 0) e aparece quando o JS
        altera para opacity: 1 via exibirAviso().
        pointer-events: none previne que o toast bloqueie cliques.
    */
    #aviso-global {
        position: fixed;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: .875rem;
        font-weight: 600;
        font-family: Inter, sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,.15);
        transition: opacity .3s;
        max-width: 90vw;
        text-align: center;
        pointer-events: none;
        opacity: 0;
    }

    /*
        Spinner de carregamento para botoes em estado de loading.
        O pseudo-elemento ::after cria o spinner giratorio.
        pointer-events: none impede cliques enquanto carrega.
    */
    .btn-loading {
        position: relative;
        pointer-events: none;
        opacity: 0.7;
    }
    .btn-loading::after {
        content: '';
        width: 14px;
        height: 14px;
        border: 2px solid currentColor;
        border-top-color: transparent;
        border-radius: 50%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        animation: spin .6s linear infinite;
    }
    @keyframes spin {
        from { transform: translate(-50%, -50%) rotate(0deg);   }
        to   { transform: translate(-50%, -50%) rotate(360deg); }
    }
`;
    document.head.appendChild(style);
}


/* ========================================================
    11. REGISTRO DE EVENTOS (DELEGACAO)

    DECISAO TECNICA — DELEGACAO DE EVENTOS:
    Em vez de adicionar um listener a cada botao individualmente,
    um unico listener e adicionado ao container pai (.coluna-produtos).
    Qualquer clique em qualquer botao dentro do container borbulha
    ate o listener, que identifica a acao pelo data-action do botao.

    VANTAGENS:
        - Memoria: um listener em vez de dezenas
        - Dinamismo: funciona automaticamente para cards adicionados futuramente (sem precisar re-registrar listeners)
        - Manutencao: logica de roteamento centralizada em um lugar
======================================================== */

/* registrarListenersProdutos()
    Registra o listener de delegacao de eventos no container de produtos.

    ROTEAMENTO POR data-action:
        - "remover"   → handleRemoverProduto(btn)
        - "increment" → handleControle(btn)
        - "decrement" → handleControle(btn)

    Side effect: adiciona um event listener ao DOM. */
function registrarListenersProdutos() {
    if (!refs.colunaProdutos) return;

    refs.colunaProdutos.addEventListener('click', (e) => {
        /* btn.closest('button[data-action]') garante que mesmo que o clique ocorra no <img> filho do botao, o botao correto seja identificado (subindo na arvore DOM). */
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;

        switch (btn.dataset.action) {
            case 'remover':    handleRemoverProduto(btn); break;
            case 'increment':
            case 'decrement':  handleControle(btn);       break;
        }
    });
}

/* registrarListenersResumo()
    Registra todos os listeners da sidebar de resumo:
    CEP, cupom e botao de continuar.

    COMPORTAMENTOS REGISTRADOS:
        - btnUsar    → clique dispara handleCalcularFrete
        - inputCep   → formata CEP em tempo real (mascara 00000-000), limpa erro ao digitar, invalida frete ao apagar
        - btnAplicar → clique dispara handleAplicarCupom
        - inputCupom → Enter dispara handleAplicarCupom, converte para maiusculas em tempo real, limpa erro ao digitar
        - btnRemover → clique dispara handleRemoverCupom
        - btnContinuar → clique dispara handleContinuarPagamento

    Side effect: adiciona event listeners ao DOM. */
function registrarListenersResumo() {
    /* Botao "Usar" do campo de CEP */
    refs.btnUsar?.addEventListener('click', handleCalcularFrete);

    /* Input de CEP: formatacao em tempo real e limpeza de estado */
    refs.inputCep?.addEventListener('input', () => {
        /* Formatacao da mascara de CEP:
            1. Remove tudo que nao e numero
            2. Limita a 8 digitos
            3. Se tiver mais de 5 digitos, insere o traco no meio (00000-000) */
        let valor = refs.inputCep.value.replace(/\D/g, '').slice(0, 8);

        if (valor.length > 5) {
            valor = valor.replace(/^(\d{5})(\d{0,3})$/, '$1-$2');
        }

        refs.inputCep.value = valor;

        /* Remove mensagem de erro assim que o usuario comeca a corrigir */
        setCepErro(false);

        /* Se o campo foi esvaziado, zera o frete e atualiza o resumo */
        if (!valor) {
            estado.frete = 0;
            atualizarResumo();
        }

        /* Invalida o CEP: o usuario pode ter digitado um novo valor */
        estado.cepValidado = false;
    });

    /* Botao "Aplicar" do campo de cupom */
    refs.btnAplicar?.addEventListener('click', handleAplicarCupom);

    /* Input de cupom: Enter como atalho para aplicar */
    refs.inputCupom?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); handleAplicarCupom(); }
    });

    /* Input de cupom: converte para maiusculas e limpa erro ao digitar */
    refs.inputCupom?.addEventListener('input', () => {
        refs.inputCupom.value = refs.inputCupom.value.toUpperCase();
        /* Limpa o erro inline assim que o usuario comeca a corrigir */
        setCupomErro(false);
    });

    /* Botao "×" de remocao de cupom ativo */
    refs.btnRemover?.addEventListener('click', handleRemoverCupom);

    /* Botao de avanco para pagamento */
    refs.btnContinuar?.addEventListener('click', handleContinuarPagamento);
}


/* ========================================================
    12. CONTINUAR PARA PAGAMENTO
======================================================== */

/**
    * Serializa os produtos do carrinho para o localStorage.
    * Cada card é lido pelo DOM e convertido num objeto simples,
    * que é então armazenado como JSON.
    *
    * Salvo em: 'produtos' → array de objetos com nome, imagem, dias e unidades.
    * Chamado uma única vez, imediatamente antes de navegar — garante que o
    * snapshot reflete o estado final escolhido pelo usuário.
*/
function salvarProdutosNoLocalStorage() {
    const produtos = getTodosCards().map((card) => ({
        nome:      card.querySelector('.produto_nome')?.textContent.trim() ?? '',
        imagem:    card.querySelector('.produto-imagem')?.src             ?? '',
        dias:      getDias(card),
        unidades:  getUnidades(card),
    }));

    localStorage.setItem('produtos', JSON.stringify(produtos));
}


/* ========================================================
    13. CONTINUAR PARA PAGAMENTO
======================================================== */

/* handleContinuarPagamento()
    Valida o estado do carrinho antes de redirecionar para o pagamento.

    VALIDACOES EM ORDEM (curto-circuito: falha em qualquer uma interrompe):
        1. Cupom digitado mas nao aplicado → erro inline no campo de cupom
        2. CEP com menos de 8 digitos     → erro inline no campo de CEP
        3. CEP nao validado (frete nao calculado) → erro inline no campo de CEP

    Se todas as validacoes passarem:
        - Limpa o erro do CEP (por seguranca)
        - Redireciona para /metodoPagamento.html

    DECISAO DE UX:
    Erros sao exibidos inline (sem toast) para deixar claro
    qual campo precisa de atencao. O toast seria muito generico aqui.

    Side effect: pode redirecionar a pagina (window.location.href)
    ou exibir erros inline via setCepErro/setCupomErro. */
function handleContinuarPagamento() {
    /* Valida cupom: digitado mas nao aplicado */
    if (temCupomNaoAplicado()) {
        setCupomErro(true, 'Você digitou um cupom, mas não aplicou.');
        return;
    }

    const cep = refs.inputCep?.value.replace(/\D/g, '') ?? '';

    /* Valida formato do CEP (8 digitos numericos) */
    if (cep.length !== 8) {
        setCepErro(true, 'Informe um CEP válido para continuar.');
        return;
    }

    /* Valida que o frete foi efetivamente calculado (nao apenas digitado) */
    if (!estado.cepValidado) {
        setCepErro(true, 'Calcule o frete antes de continuar.');
        return;
    }

    salvarProdutosNoLocalStorage();
    
    /* Todas as validacoes passaram — limpa erros e redireciona */
    setCepErro(false);
    window.location.href = '/metodoPagamento.html';
}


/* ========================================================
    BOOTSTRAP — PONTO DE ENTRADA

    DOMContentLoaded garante que todo o HTML esteja no DOM
    antes de qualquer codigo JavaScript ser executado.

    ORDEM DE INICIALIZACAO (a ordem importa):
        1. injetarEstilosJS()        — CSS antes de qualquer renderizacao
        2. inicializarRefs()         — captura elementos (DOM pronto)
        3. inicializarProdutos()     — le HTML, popula datasets, renderiza
        4. registrarListenersProdutos() — events nos produtos
        5. registrarListenersResumo() — events na sidebar
        6. atualizarResumo()         — calcula e exibe estado inicial do resumo
        7. verificarCarrinhoVazio()  — redireciona se nao houver produtos
======================================================== */

document.addEventListener('DOMContentLoaded', () => {
    injetarEstilosJS();
    inicializarRefs();
    inicializarProdutos();
    registrarListenersProdutos();
    registrarListenersResumo();
    atualizarResumo();

    verificarCarrinhoVazio(getTodosCards());

    /* Confirmacao no console de que a inicializacao ocorreu com sucesso */
    console.log('[LOCATEM] Carrinho inicializado ✓');
    console.log('Cupons disponíveis:', Object.keys(CUPONS).join(', '));
});


/* ========================================================
    ARQUITETURA GERAL DO SISTEMA

    ┌──────────────────────────────────────────────────────────┐
    │  ESTADO                                                  │
    │  - Global (objeto `estado`): frete e cupom               │
    │  - Por produto (dataset do elemento): dias e unidades    │
    └───────────────────────┬──────────────────────────────────┘
                            │ handlers leem e escrevem
    ┌───────────────────────▼──────────────────────────────────┐
    │  LOGICA (funcoes puras)                                  │
    │  calcularSubtotal / calcularDesconto / calcularTotalCard │
    │  → recebem dados, devolvem numeros, sem tocar no DOM     │
    └───────────────────────┬──────────────────────────────────┘
                            │ renderizacao le os resultados
    ┌───────────────────────▼──────────────────────────────────┐
    │  DOM (output apenas)                                     │
    │  atualizarCardProduto / atualizarResumo                  │
    │  → usam `refs` para escrever; nunca calculam nada        │
    └──────────────────────────────────────────────────────────┘
======================================================== */