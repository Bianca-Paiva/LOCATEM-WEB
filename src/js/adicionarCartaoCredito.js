/* =========================================================
    CAPTURA DOS ELEMENTOS DO HTML
    Esses elementos serão manipulados pelo JavaScript.
========================================================= */
const numeroCartao = document.getElementById("numeroCartao");
const iconeBandeira = document.getElementById("iconeBandeira");
const nomeTitular = document.getElementById("nomeTitular");
const validade = document.getElementById("validade");
const cvv = document.getElementById("cvv");
const parcelamento = document.getElementById("parcelamento");

const btnPagar = document.querySelector(".btn-pagamento");

/*
    Controla se o pagamento já está sendo processado.
    Isso evita que o usuário clique várias vezes no botão e simule/envie o pagamento mais de uma vez.
*/
let pagamentoEmProcessamento = false;

/*
    Valor total usado para calcular as parcelas.
    Futuramente esse valor pode vir do carrinho ou da API.
*/
const valorTotal = atualizarResumoCartao();

/* =========================================================
    MAPA DE BANDEIRAS
    Relaciona o nome detectado da bandeira com o caminho do ícone.
========================================================= */
const mapaBandeiras = {
    VISA: "/src/images/bandeiras/visa.png",
    MASTER: "/src/images/bandeiras/master.png",
    AMEX: "/src/images/bandeiras/amex.png",
    ELO: "/src/images/bandeiras/elo.png",
    DISCOVER: "/src/images/bandeiras/discover.png",
    DINERS: "/src/images/bandeiras/diners.png"
};

/* =========================================================
    MENSAGENS PADRONIZADAS
    Centraliza todas as mensagens de erro para facilitar manutenção.
========================================================= */
const mensagensErro = {
    numeroCartaoIncompleto: "Confira o número do cartão.",
    numeroCartaoLimite: "O número do cartão deve ter 16 dígitos.",

    nomeTitularInvalido: "Digite o nome como aparece no cartão.",
    nomeTitularLimite: "O nome deve ter no máximo 40 caracteres.",

    validadeFormato: "Informe a validade no formato MM/AA.",
    validadeMesInvalido: "Informe um mês válido.",
    validadeVencida: "Este cartão está vencido.",

    cvvIncompleto: "Informe o código de segurança.",
    cvvLimite: "O CVV deve ter 3 dígitos.",

    parcelamento: "Escolha uma opção de parcelamento."
};


// =========================================================
//  LEITURA DO RESUMO VIA localStorage
// =========================================================

function lerValorLocalStorage(chave) {
    const valor = localStorage.getItem(chave);
    if (valor === null || valor === '') return 0;
    const numero = parseFloat(valor.replace(',', '.'));
    return isNaN(numero) ? 0 : numero;
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function atualizarResumoCartao() {
    const subtotal = lerValorLocalStorage('subtotal');
    const frete    = lerValorLocalStorage('frete');
    const desconto = lerValorLocalStorage('desconto');
    const total    = Math.max(0, subtotal + frete - desconto);

    const elSubtotal      = document.querySelector('.resumo-subtotal');
    const elFrete         = document.querySelector('.resumo-frete-topo');
    const elTotal         = document.querySelector('.resumo-total-valor');
    const elLinhaDesconto = document.getElementById('linha-desconto');
    const elDesconto      = document.querySelector('.resumo-desconto-valor');

    if (elSubtotal) elSubtotal.textContent = formatarMoeda(subtotal);
    if (elFrete)    elFrete.textContent    = frete === 0 ? 'Grátis' : formatarMoeda(frete);
    if (elTotal)    elTotal.textContent    = formatarMoeda(total);

    if (desconto > 0 && elDesconto && elLinhaDesconto) {
        elDesconto.textContent        = `− ${formatarMoeda(desconto)}`;
        elLinhaDesconto.style.display = '';
    } else if (elLinhaDesconto) {
        elLinhaDesconto.style.display = 'none';
    }

    return total; // retorna para usar no cálculo de parcelas
}


/* =========================================================
    NÚMERO DO CARTÃO
    - Remove caracteres que não são números
    - Limita a 16 dígitos
    - Formata em blocos de 4 números
    - Detecta a bandeira e exibe o ícone correspondente
========================================================= */
numeroCartao.addEventListener("input", () => {
    limparErro(numeroCartao);

    let valor = numeroCartao.value.replace(/\D/g, "");

    // DETECTA BANDEIRA
    const bandeira = detectarBandeira(valor);

    // TROCA ÍCONE
    if (bandeira && mapaBandeiras[bandeira]) {
        iconeBandeira.src = mapaBandeiras[bandeira];
        iconeBandeira.classList.add("ativo");
    } else {
        iconeBandeira.src = "";
        iconeBandeira.classList.remove("ativo");
    }

    // VALIDA TAMANHO
    if (valor.length > 16) {
        valor = valor.slice(0, 16);
        mostrarErro(numeroCartao, mensagensErro.numeroCartaoLimite);
    }

    // FORMATA
    numeroCartao.value = valor.replace(/(\d{4})(?=\d)/g, "$1 ");
});

/* =========================================================
    DETECTOR DA BANDEIRA DO CARTÃO
    Usa os primeiros dígitos do cartão para identificar a bandeira.
    Essa detecção é visual/UX; a validação real deve ocorrer na API.
========================================================= */
function detectarBandeira(numero) {
    numero = numero.replace(/\D/g, "");

    if (/^4/.test(numero)) return "VISA";
    if (/^5[1-5]/.test(numero)) return "MASTER";
    if (/^2(2[2-9]|[3-6]|7[01]|720)/.test(numero)) return "MASTER";
    if (/^3[47]/.test(numero)) return "AMEX";
    if (/^6(?:011|5)/.test(numero)) return "DISCOVER";
    if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(numero)) return "ELO";
    if (/^3(?:0[0-5]|[68])/.test(numero)) return "DINERS";

    return "";

    // *TESTES*
    // detectarBandeira("4") ou detectarBandeira("4111 1111 1111 1111")   // VISA
    // detectarBandeira("51") ou detectarBandeira("5555 5555 5555 4444")     // MASTER
    // detectarBandeira("2221")   // MASTER (faixa nova)
    // detectarBandeira("34") ou detectarBandeira("3714 4963 5398 431")     // AMEX
    // detectarBandeira("6362")   // ELO
    // detectarBandeira("6011")   // DISCOVER
    // detectarBandeira("300")    // DINERS
}

/* =========================================================
    NOME DO TITULAR
    - Permite apenas letras e espaços
    - Limita a 40 caracteres
    - Converte automaticamente para maiúsculo
========================================================= */
nomeTitular.addEventListener("input", () => {
    limparErro(nomeTitular);

    let valor = nomeTitular.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");

    if (valor.length > 40) {
        valor = valor.slice(0, 40);
        mostrarErro(nomeTitular, mensagensErro.nomeTitularLimite);
    }

    nomeTitular.value = valor.toUpperCase();
});

/* =========================================================
    VALIDADE DO CARTÃO
    - Permite apenas números
    - Formata automaticamente no padrão MM/AA
========================================================= */
validade.addEventListener("input", () => {
    limparErro(validade);

    let valor = validade.value.replace(/\D/g, "");

    if (valor.length > 4) {
        valor = valor.slice(0, 4);
        mostrarErro(validade, mensagensErro.validadeFormato);
    }

    if (valor.length >= 3) {
        valor = valor.slice(0, 2) + "/" + valor.slice(2);
    }

    validade.value = valor;
});

/* =========================================================
    VALIDAÇÃO DA DATA DE VALIDADE
    Ao sair do campo, verifica:
    - se o mês é válido
    - se o cartão não está vencido
========================================================= */
validade.addEventListener("blur", () => {
    if (validade.value.length !== 5) return;

    const [mes, ano] = validade.value.split("/").map(Number);

    if (mes < 1 || mes > 12) {
        mostrarErro(validade, mensagensErro.validadeMesInvalido);
        validade.value = "";
        return;
    }

    const anoAtual = new Date().getFullYear() % 100;
    const mesAtual = new Date().getMonth() + 1;

    const cartaoVencido =
        ano < anoAtual || (ano === anoAtual && mes < mesAtual);

    if (cartaoVencido) {
        mostrarErro(validade, mensagensErro.validadeVencida);
        validade.value = "";
    }
});

/* =========================================================
    CVV
    - Permite apenas números
    - Limita a 3 dígitos
========================================================= */
cvv.addEventListener("input", () => {
    limparErro(cvv);

    let valor = cvv.value.replace(/\D/g, "");

    if (valor.length > 3) {
        valor = valor.slice(0, 3);
        mostrarErro(cvv, mensagensErro.cvvLimite);
    }

    cvv.value = valor;
});

/* =========================================================
    PARCELAMENTO
    Gera as opções de parcela automaticamente.
    Regra: cada parcela precisa ter valor mínimo de R$10.
========================================================= */
function gerarParcelas() {
    parcelamento.innerHTML = '<option value="">Selecione</option>';

    const valorMinimoParcela = 10;
    const maxParcelas = Math.floor(valorTotal / valorMinimoParcela);
    const totalParcelas = Math.max(1, maxParcelas);

    for (let i = 1; i <= totalParcelas; i++) {
        const valorParcela = valorTotal / i;

        const option = document.createElement("option");
        option.value = i;
        option.textContent = `${i}x de R$ ${valorParcela.toFixed(2).replace(".", ",")} sem juros`;

        parcelamento.appendChild(option);
    }

    /*
        Pré-seleciona 1x automaticamente.
        Caso exista apenas uma opção, o select é desabilitado para evitar interação desnecessária.
    */
    parcelamento.value = "1";

    if (totalParcelas === 1) {
        parcelamento.disabled = true;
    }
}

gerarParcelas();


/* =========================================================
    FUNÇÕES DE VALIDAÇÃO
    Retornam true ou false conforme cada campo esteja correto.
========================================================= */
function validarNumeroCartao() {
    return numeroCartao.value.replace(/\D/g, "").length === 16;
}

function validarNomeTitular() {
    return nomeTitular.value.trim().length >= 3;
}

function validarValidade() {
    if (validade.value.length !== 5) return false;

    const [mes, ano] = validade.value.split("/").map(Number);

    if (mes < 1 || mes > 12) return false;

    const anoAtual = new Date().getFullYear() % 100;
    const mesAtual = new Date().getMonth() + 1;

    return ano > anoAtual || (ano === anoAtual && mes >= mesAtual);
}

function validarCvv() {
    return cvv.value.length === 3;
}

function validarParcelamento() {
    return parcelamento.value !== "";
}

/* =========================================================
    UI DE ERRO
    Controla a exibição e remoção das mensagens de erro.
========================================================= */
function mostrarErro(input, mensagem) {
    const campo = input.closest(".campo");
    const erro = campo.querySelector(".erro");

    if (!erro) return;

    /*
        Remove e adiciona a classe novamente para reiniciar a animação de erro sempre que necessário.
    */
    campo.classList.remove("erro-ativo"); // reset animação
    void campo.offsetWidth; // força reflow (truque do CSS)

    campo.classList.add("erro-ativo");
    erro.textContent = mensagem;
}

function limparErro(input) {
    const campo = input.closest(".campo");
    const erro = campo.querySelector(".erro");

    if (!erro) return;

    campo.classList.remove("erro-ativo");
    erro.textContent = "";
}

// =========================================================
//  SALVAR CARTÃO — localStorage
// =========================================================

const checkboxSalvar = document.querySelector('.salvar-cartao input[type="checkbox"]');

// Ao carregar a página, verifica se há cartão salvo e preenche os campos
function carregarCartaoSalvo() {
    // Se o usuário veio para ADICIONAR um cartão novo, não pré-preenche
    const veioDeTela = localStorage.getItem('tipoNovoCartao');
    if (veioDeTela) {
        localStorage.removeItem('tipoNovoCartao'); // limpa o sinalizador após usar
        return; // interrompe — página deve ficar em branco
    }
    
    const cartao = localStorage.getItem('cartaoCredito');
    if (!cartao) return;

    const dados = JSON.parse(cartao);

    numeroCartao.value = dados.numero ?? '';
    nomeTitular.value = dados.nome ?? '';
    validade.value = dados.validade ?? '';
    // CVV nunca é salvo — o usuário sempre precisa redigitar

    // Detecta e exibe a bandeira com base no número recuperado
    const bandeira = detectarBandeira(dados.numero.replace(/\s/g, ''));
    if (bandeira && mapaBandeiras[bandeira]) {
        iconeBandeira.src = mapaBandeiras[bandeira];
        iconeBandeira.classList.add('ativo');
    }

    // Marca o checkbox para indicar que há um cartão salvo
    if (checkboxSalvar) checkboxSalvar.checked = true;
}

function salvarCartao() {
    // Lê cartões existentes ou usa os padrão
    const cartoesExistentes = JSON.parse(localStorage.getItem('cartoes')) || [];

    const tipo = localStorage.getItem('tipoNovoCartao') || 'credito'; // 'credito' ou 'debito'

    const novoCartao = {
        id: Date.now(), // ID único baseado no timestamp
        metodoPagamento: tipo,
        bandeira: detectarBandeiraNome(numeroCartao.value),
        final: numeroCartao.value.replace(/\s/g, '').slice(-4),
        titular: nomeTitular.value,
    };

    cartoesExistentes.push(novoCartao);
    localStorage.setItem('cartoes', JSON.stringify(cartoesExistentes));
}

function detectarBandeiraNome(numero) {
    const codigo = detectarBandeira(numero.replace(/\s/g, ''));
    const nomes = {
        VISA:     'Visa',
        MASTER:   'Mastercard',
        AMEX:     'American Express',
        ELO:      'Elo',
        DISCOVER: 'Discover',
        DINERS:   'Diners',
    };
    return nomes[codigo] || 'Cartão';
}

function removerCartaoSalvo() {
    localStorage.removeItem('cartaoCredito');
}

carregarCartaoSalvo();

/* =========================================================
    CONFIRMAR PAGAMENTO
    - Valida todos os campos
    - Bloqueia clique duplo
    - Mostra estado de carregamento
    - Redireciona para a tela de pagamento aprovado
========================================================= */
btnPagar.addEventListener("click", () => {
    if (pagamentoEmProcessamento) return;

    limparErro(numeroCartao);
    limparErro(nomeTitular);
    limparErro(validade);
    limparErro(cvv);
    limparErro(parcelamento);

    let formularioValido = true;

    if (!validarNumeroCartao()) {
        mostrarErro(numeroCartao, mensagensErro.numeroCartaoIncompleto);
        formularioValido = false;
    }

    if (!validarNomeTitular()) {
        mostrarErro(nomeTitular, mensagensErro.nomeTitularInvalido);
        formularioValido = false;
    }

    if (!validarValidade()) {
        mostrarErro(validade, mensagensErro.validadeFormato);
        formularioValido = false;
    }

    if (!validarCvv()) {
        mostrarErro(cvv, mensagensErro.cvvIncompleto);
        formularioValido = false;
    }

    if (!validarParcelamento()) {
        mostrarErro(parcelamento, mensagensErro.parcelamento);
        formularioValido = false;
    }

    if (!formularioValido) return;

    pagamentoEmProcessamento = true;
    btnPagar.disabled = true;
    btnPagar.classList.add("carregando");
    btnPagar.textContent = "Processando pagamento";

    // Salva ou remove o cartão conforme o estado do checkbox
    if (checkboxSalvar?.checked) {
        salvarCartao();
    } else {
        removerCartaoSalvo();
    }
    
    setTimeout(() => {
        window.location.href = "./pagamentoAprovado.html";
    }, 1500);
});