'use strict';

// ==================== CARROSSEL ====================
// Controla a navegação entre slides do produto.
// Suporta: botões de seta, clique nos indicadores e swipe touch.
const initCarrossel = () => {
  const lista = document.querySelector('.carrossel-lista');
  const itens = document.querySelectorAll('.carrossel-item');
  const circulos = document.querySelectorAll('.circulo');
  const btnAntes = document.querySelector('.btn-anterior');
  const btnProx = document.querySelector('.btn-proximo');

  // Aborta se o carrossel não existir na página
  if (!lista || itens.length === 0) return;

  let indexAtual = 0;

  // Remove a classe "ativo" do slide atual, navega para o novo índice
  // e aplica "ativo" no próximo slide e no indicador correspondente.
  // O módulo garante navegação cíclica (do último volta ao primeiro).
  const irPara = (novoIndex) => {
    itens[indexAtual].classList.remove('ativo');
    circulos[indexAtual]?.classList.remove('ativo');
    indexAtual = (novoIndex + itens.length) % itens.length;
    itens[indexAtual].classList.add('ativo');
    circulos[indexAtual]?.classList.add('ativo');
  };

  btnAntes?.addEventListener('click', () => irPara(indexAtual - 1));
  btnProx?.addEventListener('click', () => irPara(indexAtual + 1));

  // ── SWIPE TOUCH ──
  // Detecta a direção do arrasto e navega de acordo.
  // threshold de 40px evita ativação por toques acidentais.
  let touchStartX = 0;
  lista.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  lista.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) irPara(diff > 0 ? indexAtual + 1 : indexAtual - 1);
  }, { passive: true });

  // Clique direto nos indicadores (pontos) navega para o slide correspondente
  circulos.forEach((circulo, i) => {
    circulo.addEventListener('click', () => irPara(i));
  });
};

// ==================== FAVORITAR ====================
// Alterna o estado favoritado do produto.
// Atualiza aria-pressed, aria-label e filtro visual do ícone.
const initFavoritar = () => {
  const btn = document.querySelector('.btn-favoritar');
  if (!btn) return;

  let favoritado = btn.dataset.favoritado === 'true';

  // Sincroniza o visual e atributos de acessibilidade com o estado atual
  const atualizar = () => {
    btn.setAttribute('aria-pressed', favoritado);
    btn.setAttribute('aria-label', favoritado
      ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
    btn.classList.toggle('ativo', favoritado);

    // Aplica filtro CSS para colorir o ícone quando favoritado
    const img = btn.querySelector('img');
    if (img) img.style.filter = favoritado
      ? 'invert(50%) sepia(100%) saturate(500%) hue-rotate(330deg)' : '';
  };

  btn.addEventListener('click', () => { favoritado = !favoritado; atualizar(); });
  atualizar();
};

// ==================== VOLTAGEM ====================
// Seleção exclusiva de voltagem (127V / 220V / Bivolt).
// Apenas um botão pode estar ativo por vez.
const initVoltagem = () => {
  const botoes = document.querySelectorAll('.btn-voltagem');
  if (!botoes.length) return;

  botoes.forEach((btn) => {
    btn.addEventListener('click', () => {
      botoes.forEach((b) => b.classList.remove('selecionado'));
      btn.classList.add('selecionado');
    });
  });
};

// ==================== QUANTIDADE ====================
// Controla o incremento e decremento da quantidade do produto.
// Respeita os limites mínimo (1) e máximo (99).
// O botão de decrementar é desabilitado ao atingir o mínimo.
const initQuantidade = () => {
  const grupo = document.querySelector('.controle-grupo');
  if (!grupo) return;

  const btnDecr = grupo.querySelector('[data-action="decrement"]');
  const btnIncr = grupo.querySelector('[data-action="increment"]');
  const valorSpan = grupo.querySelector('.controle-valor');
  const MIN = 1, MAX = 99;
  let quantidade = parseInt(valorSpan?.textContent, 10) || 1;

  // Atualiza o display e o estado do botão de decremento
  const atualizar = () => {
    if (valorSpan) valorSpan.textContent = quantidade;
    if (btnDecr) btnDecr.disabled = quantidade <= MIN;
  };

  btnDecr?.addEventListener('click', () => { if (quantidade > MIN) { quantidade--; atualizar(); } });
  btnIncr?.addEventListener('click', () => { if (quantidade < MAX) { quantidade++; atualizar(); } });
  atualizar();
};

//=================ADICIONAR CARRINHO=====================
const initAdicionarCarrinho = () => {

  const btnAddCarrinho =
    document.getElementById("btn-adicionar-carrinho");

  if (!btnAddCarrinho) return;

  btnAddCarrinho.addEventListener("click", () => {

    window.location.href = "carrinho.html";

  });

};


// ==================== SEÇÕES EXPANSÍVEIS ====================
// Controla o expand/collapse das seções de Descrição e Especificações.
// A animação usa max-height + opacity para transição suave.
//
// ATENÇÃO: O seletor inclui tanto '.card-secao' quanto '.especificacoes-produto'
// porque a seção de especificações herda os dois — garantir que ambos continuem
// sendo selecionados ao refatorar o HTML.
const initExpandiveis = () => {
  const secoes = document.querySelectorAll('.card-secao, .especificacoes-produto');

  secoes.forEach((secao) => {
    const btn = secao.querySelector('.btn-expandir');
    const conteudo = secao.querySelector('.descricao-conteudo, .especificacoes-conteudo');
    if (!btn || !conteudo) return;

    let aberto = btn.classList.contains('aberto');

    // Aplica max-height e opacity conforme o estado.
    // Na inicialização (animado=false) não aplica transition para evitar
    // animação indesejada no carregamento da página.
    const aplicarEstado = (animado = false) => {
      if (animado) conteudo.style.transition = 'max-height 0.3s ease, opacity 0.3s ease';
      conteudo.style.maxHeight = aberto ? conteudo.scrollHeight + 'px' : '0';
      conteudo.style.opacity = aberto ? '1' : '0';
      conteudo.style.overflow = aberto ? 'visible' : 'hidden';
      btn.classList.toggle('aberto', aberto);
      btn.setAttribute('aria-expanded', String(aberto));
    };

    btn.addEventListener('click', () => { aberto = !aberto; aplicarEstado(true); });
    aplicarEstado(false);
  });
};

// ==================== FEEDBACK "FOI ÚTIL" ====================
// Permite marcar comentários como úteis.
// Ao clicar:
// - ativa estado visual
// - impede múltiplos votos
// - incrementa contador

const initFeedbackUtil = () => {

  document.querySelectorAll('.btn-util').forEach((btn) => {

    btn.addEventListener('click', () => {

      // Impede múltiplos votos
      if (btn.classList.contains('is-active')) return;

      // Ativa estado visual
      btn.classList.add('is-active');

      // Busca contador relacionado
      const feedbackContainer = btn.closest('.feedback-util');

      if (!feedbackContainer) return;

      const contagem =
        feedbackContainer.querySelector('.contagem-util');

      if (!contagem) return;

      // Extrai número atual
      const numeroAtual =
        parseInt(contagem.textContent.match(/\d+/)?.[0] || 0, 10);

      // Atualiza contador
      contagem.textContent =
        contagem.textContent.replace(/\d+/, numeroAtual + 1);

    });

  });

};

// ==================== VER MAIS COMENTÁRIOS ====================
// Alterna a visibilidade dos comentários marcados como ".comentario--oculto".
// Atualiza o texto e a seta do botão conforme o estado.
const initVerMais = () => {
  const btn = document.querySelector('.btn-ver-mais');
  if (!btn) return;

  let expandido = false;

  btn.addEventListener('click', () => {
    expandido = !expandido;
    const span = btn.querySelector('span');

    // Exibe ou oculta todos os comentários com a classe de ocultação
    document.querySelectorAll('.comentario--oculto').forEach((el) => {
      el.style.display = expandido ? 'flex' : 'none';
    });

    // Atualiza texto e rotação da seta conforme o estado
    if (span) span.textContent = expandido ? 'Ver menos' : 'Ver mais';
    const seta = btn.querySelector('img');
    if (seta) seta.style.transform = expandido ? 'rotate(180deg)' : '';
  });
};

const parametros = new URLSearchParams(window.location.search);

const id = parametros.get('id');

console.log(id);

// ==================== INICIALIZAÇÃO ====================
// Chama todos os módulos em sequência.
// Aguarda o DOM estar pronto antes de executar, caso o script
// seja carregado de forma síncrona no <head> (não é o caso atual,
// mas o guard garante segurança em refatorações futuras).
const init = () => {
  initCarrossel();
  initFavoritar();
  initVoltagem();
  initQuantidade();
  initExpandiveis();
  initFeedbackUtil();
  initVerMais();

  initAdicionarCarrinho();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}