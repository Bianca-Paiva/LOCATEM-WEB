// src/js/carrinhoStorage.js
// Funções puras de leitura/escrita do carrinho no localStorage.
// Usadas tanto por produtoPage.js quanto por carrinho.js.

const CHAVE_CARRINHO = 'locatem_carrinho';

/** Retorna o array atual de itens do carrinho (nunca null). */
function lerCarrinho() {
    try {
        return JSON.parse(localStorage.getItem(CHAVE_CARRINHO)) ?? [];
    } catch {
        return [];
    }
}

/** Substitui o array inteiro no localStorage. */
function salvarCarrinho(itens) {
    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens));
}

/**
 * Adiciona ou atualiza um item no carrinho.
 * Se o produto (mesmo id) já existir, incrementa dias e unidades.
 *
 * @param {{ id, nome, imagem, precoDia, estoque, dias, unidades }} item
 */
function adicionarAoCarrinho(item) {
    const carrinho = lerCarrinho();
    const index = carrinho.findIndex((p) => p.id === item.id);

    if (index !== -1) {
        // Produto já existe — soma os valores, respeitando os limites
        carrinho[index].unidades = Math.min(
            carrinho[index].unidades + item.unidades,
            item.estoque
        );
        carrinho[index].dias = Math.max(carrinho[index].dias, item.dias);
    } else {
        carrinho.push(item);
    }

    salvarCarrinho(carrinho);
}