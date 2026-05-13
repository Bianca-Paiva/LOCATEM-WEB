/* ================================================================
   LOCATEM — TELA DE MENSAGENS
   Arquivo: mensagens.js
   Descrição: lógica completa da tela de chat — dados mockados,
              renderização dinâmica, animações e interações.
   ================================================================ */

'use strict';

/* ================================================================
   1. DADOS MOCKADOS
   Simula o retorno de uma API REST.
   Substituir pelos endpoints reais quando disponível.
   ================================================================ */

/** @type {Object} Usuário logado no sistema */
const USUARIO_LOGADO = {
  id: 'eu',
  nome: 'Atendente Locatem',
  avatar: null,
};

/**
 * @type {Array<Object>} Lista de contatos/conversas
 * Campos: id, nome, status ('online'|'ausente'|'offline'),
 *         ultimaVez (string), naoLidas (number), mensagens (Array)
 */
const CONTATOS_MOCK = [
  {
    id: 'marcos',
    nome: 'Marcos',
    status: 'online',
    ultimaVez: null,
    naoLidas: 0,
    mensagens: [
      { id: 1, remetente: 'marcos', texto: 'Oi! Tudo bem com você? Preciso de ajuda com um pedido que fiz ontem.', hora: '11:20', lida: true },
      { id: 2, remetente: 'marcos', texto: 'Apareceu como entregue mas ainda não recebi nada aqui.', hora: '11:21', lida: true },
      { id: 3, remetente: 'eu',     texto: 'Olá, Marcos! Deixa eu verificar o status do seu pedido agora mesmo.', hora: '11:22', lida: true },
      { id: 4, remetente: 'marcos', texto: 'Muito obrigado! Aqui está o número do pedido: #2026-04871.', hora: '11:24', lida: true },
      { id: 5, remetente: 'eu',     texto: 'Encontrei aqui! O pedido saiu para entrega hoje às 09:15. O prazo estimado é até às 18h.', hora: '11:26', lida: true },
      { id: 6, remetente: 'eu',     texto: 'Caso não chegue até lá, me avise e abro uma ocorrência para você!', hora: '11:27', lida: true },
      { id: 7, remetente: 'marcos', texto: 'Perfeito! Fico aguardando. Muito obrigado pelo atendimento rápido! 👍', hora: '11:29', lida: true },
    ],
  },
  {
    id: 'junior',
    nome: 'Junior',
    status: 'online',
    ultimaVez: null,
    naoLidas: 3,
    mensagens: [
      { id: 1, remetente: 'junior', texto: 'Boa tarde! Fiz um pedido semana passada.', hora: '10:50', lida: true },
      { id: 2, remetente: 'eu',     texto: 'Boa tarde, Junior! Como posso ajudar?', hora: '10:52', lida: true },
      { id: 3, remetente: 'junior', texto: 'Quando chega meu pedido?', hora: '11:00', lida: false },
      { id: 4, remetente: 'junior', texto: 'O número é #2026-04512.', hora: '11:01', lida: false },
      { id: 5, remetente: 'junior', texto: 'Preciso com urgência para amanhã!', hora: '11:15', lida: false },
    ],
  },
  {
    id: 'leo',
    nome: 'Léo',
    status: 'ausente',
    ultimaVez: 'Visto às 10:30',
    naoLidas: 0,
    mensagens: [
      { id: 1, remetente: 'leo', texto: 'Oi, tenho uma dúvida sobre o frete.', hora: '09:40', lida: true },
      { id: 2, remetente: 'eu',  texto: 'Claro! Qual é a sua dúvida?', hora: '09:42', lida: true },
      { id: 3, remetente: 'leo', texto: 'Vocês entregam para o interior do Paraná?', hora: '10:10', lida: true },
      { id: 4, remetente: 'eu',  texto: 'Sim! Entregamos para todo o Brasil. O prazo para o interior do PR é de 3 a 5 dias úteis.', hora: '10:20', lida: true },
      { id: 5, remetente: 'leo', texto: 'Ok, entendido. Obrigado!', hora: '10:52', lida: true },
    ],
  },
  {
    id: 'ana',
    nome: 'Ana Paula',
    status: 'offline',
    ultimaVez: 'Visto há 2 horas',
    naoLidas: 1,
    mensagens: [
      { id: 1, remetente: 'ana', texto: 'Preciso cancelar meu pedido.', hora: '08:15', lida: false },
    ],
  },
  {
    id: 'rodrigo',
    nome: 'Rodrigo S.',
    status: 'online',
    ultimaVez: null,
    naoLidas: 0,
    mensagens: [
      { id: 1, remetente: 'rodrigo', texto: 'Vocês aceitam troca?', hora: '07:30', lida: true },
      { id: 2, remetente: 'eu',      texto: 'Sim! Temos política de troca em até 7 dias.', hora: '07:35', lida: true },
      { id: 3, remetente: 'rodrigo', texto: 'Perfeito, muito obrigado!', hora: '07:36', lida: true },
    ],
  },
];

/**
 * Respostas automáticas simuladas por contato.
 * Em produção, substituir por chamada à API de IA ou backend.
 */
const RESPOSTAS_AUTO = {
  marcos:  ['Entendido! Vou verificar isso.', 'Certo, um momento por favor.', 'Obrigado pela informação! 👍'],
  junior:  ['Oi Junior! Já vou verificar.', 'Encontrei seu pedido aqui.', 'Pode ficar tranquilo que já estou resolvendo!'],
  leo:     ['Claro, Léo! Sem problemas.', 'Pode contar com a gente 😊'],
  ana:     ['Olá Ana Paula! Vou te ajudar com isso.', 'Cancelamento realizado com sucesso.'],
  rodrigo: ['Com certeza! Como posso ajudar mais?', 'Ótimo, qualquer dúvida é só chamar.'],
};


/* ================================================================
   2. ESTADO DA APLICAÇÃO
   Centraliza tudo que muda durante o uso — fácil de depurar
   e preparado para integração com gerenciadores de estado (Redux etc.)
   ================================================================ */

const Estado = {
  /** ID do contato atualmente aberto no chat */
  contatoAtivo: 'marcos',

  /** Próximo ID disponível para novas mensagens */
  proximoIdMensagem: 100,

  /** Texto atual que o usuário está digitando */
  textoDigitado: '',

  /** Indica se o "digitando..." está sendo exibido */
  digitandoVisivel: false,

  /** Contatos filtrados pela busca (null = sem filtro ativo) */
  filtroContatos: null,
};


/* ================================================================
   3. SELETORES DO DOM
   Centraliza todas as referências ao HTML — evita querySelector
   espalhado pelo código.
   ================================================================ */

const DOM = {
  // Cabeçalho do chat
  cabecalhoChatFoto:   document.querySelector('.foto-usuario-chat'),
  cabecalhoChatNome:   document.querySelector('.nome-usuario-chat'),
  cabecalhoChatStatus: document.querySelector('.status-usuario-chat'),

  // Área de mensagens
  areaMensagens: document.getElementById('area-mensagens'),

  // Campo de envio
  inputMensagem: document.getElementById('inputMensagem'),
  botaoEnviar:   document.getElementById('botaoEnviar'),
  botaoAnexo:    document.getElementById('botaoAnexo'),

  // Sidebar
  listaContatos:  document.querySelector('.lista-contatos'),
  buscaContatos:  document.getElementById('buscaContatos'),
  sidebarContatos: document.getElementById('sidebar-contatos'),
};


/* ================================================================
   4. UTILITÁRIOS
   Funções puras sem efeitos colaterais — reutilizáveis em todo o app.
   ================================================================ */

/**
 * Retorna a hora atual formatada como "HH:MM".
 * @returns {string}
 */
function horaAtual() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Escapa caracteres HTML para prevenir XSS.
 * @param {string} texto
 * @returns {string}
 */
function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

/**
 * Retorna um elemento aleatório de um array.
 * @param {Array} arr
 * @returns {*}
 */
function aleatorio(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Adiciona a classe de animação de entrada em um elemento e a remove após concluir.
 * @param {HTMLElement} el
 * @param {string} classe
 * @param {number} duracao - ms
 */
function animarEntrada(el, classe = 'animacao-entrada', duracao = 300) {
  el.classList.add(classe);
  setTimeout(() => el.classList.remove(classe), duracao);
}

/**
 * Anima saída de um elemento e o remove do DOM ao terminar.
 * @param {HTMLElement} el
 * @param {string} classe
 * @param {number} duracao - ms
 */
function animarSaida(el, classe = 'animacao-saida', duracao = 250) {
  el.classList.add(classe);
  setTimeout(() => el.remove(), duracao);
}

/**
 * Rola suavemente a área de mensagens até o final.
 */
function rolarParaBaixo() {
  DOM.areaMensagens.scrollTo({
    top: DOM.areaMensagens.scrollHeight,
    behavior: 'smooth',
  });
}

/**
 * Busca um contato pelo ID nos dados mockados.
 * @param {string} id
 * @returns {Object|undefined}
 */
function buscarContato(id) {
  return CONTATOS_MOCK.find(c => c.id === id);
}


/* ================================================================
   5. RENDERIZAÇÃO DE CONTATOS
   Constrói e atualiza a lista lateral de conversas.
   ================================================================ */

/**
 * Gera o HTML de um único item de contato.
 * @param {Object} contato
 * @returns {string} HTML string
 */
function templateContato(contato) {
  const ultimaMensagem = contato.mensagens[contato.mensagens.length - 1];
  const preview        = ultimaMensagem ? escaparHTML(ultimaMensagem.texto) : 'Sem mensagens';
  const hora           = ultimaMensagem ? ultimaMensagem.hora : '';
  const ativo          = contato.id === Estado.contatoAtivo ? 'ativo' : '';
  const statusClasse   = contato.status !== 'online' ? 'ausente' : '';
  const badge          = contato.naoLidas > 0
    ? `<span class="contador-nao-lidas" aria-label="${contato.naoLidas} mensagens não lidas">${contato.naoLidas}</span>`
    : '';

  return `
    <li
      class="contato ${ativo}"
      data-contato-id="${contato.id}"
      role="listitem"
      tabindex="0"
      aria-label="Conversa com ${escaparHTML(contato.nome)}"
    >
      <div class="foto-contato">
        <span class="status-bolinha ${statusClasse}" aria-hidden="true"></span>
      </div>
      <div class="info-contato">
        <div class="linha-superior-contato">
          <span class="nome-contato">${escaparHTML(contato.nome)}</span>
          <time class="horario-contato">${hora}</time>
        </div>
        <p class="preview-mensagem-contato">${preview}</p>
      </div>
      ${badge}
    </li>
  `;
}

/**
 * Renderiza (ou re-renderiza) a lista completa de contatos na sidebar.
 * Aplica o filtro de busca se houver texto digitado.
 */
function renderizarContatos() {
  const filtro  = Estado.filtroContatos ? Estado.filtroContatos.toLowerCase() : null;
  const lista   = filtro
    ? CONTATOS_MOCK.filter(c => c.nome.toLowerCase().includes(filtro))
    : CONTATOS_MOCK;

  if (lista.length === 0) {
    DOM.listaContatos.innerHTML = `
      <li class="sem-resultados" aria-live="polite">
        Nenhuma conversa encontrada.
      </li>`;
    return;
  }

  DOM.listaContatos.innerHTML = lista.map(templateContato).join('');

  // Re-vincula eventos de clique após re-renderizar
  vincularEventosContatos();
}

/**
 * Atualiza visualmente apenas o item de contato afetado (sem re-renderizar tudo).
 * Útil após receber/enviar mensagem.
 * @param {string} idContato
 */
function atualizarItemContato(idContato) {
  const el = DOM.listaContatos.querySelector(`[data-contato-id="${idContato}"]`);
  if (!el) return;

  const contato        = buscarContato(idContato);
  const ultimaMensagem = contato.mensagens[contato.mensagens.length - 1];
  const preview        = el.querySelector('.preview-mensagem-contato');
  const hora           = el.querySelector('.horario-contato');
  let   badge          = el.querySelector('.contador-nao-lidas');

  if (preview) preview.textContent = ultimaMensagem.texto;
  if (hora)    hora.textContent    = ultimaMensagem.hora;

  // Atualiza ou cria badge de não lidas
  if (contato.naoLidas > 0) {
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'contador-nao-lidas';
      el.appendChild(badge);
    }
    badge.textContent  = contato.naoLidas;
    badge.setAttribute('aria-label', `${contato.naoLidas} mensagens não lidas`);
    animarEntrada(badge, 'animacao-badge');
  } else if (badge) {
    badge.remove();
  }

  // Movimenta contato para o topo da lista com animação
  const lista = DOM.listaContatos;
  lista.prepend(el);
  animarEntrada(el, 'animacao-subir');
}


/* ================================================================
   6. RENDERIZAÇÃO DE MENSAGENS
   Constrói o histórico de conversa e mensagens individuais.
   ================================================================ */

/**
 * Gera o HTML de uma única mensagem.
 * @param {Object} msg  - objeto de mensagem
 * @param {string} tipo - 'enviada' | 'recebida'
 * @returns {string} HTML string
 */
function templateMensagem(msg, tipo) {
  const checkLida = tipo === 'enviada' && msg.lida
    ? `<span class="indicador-lido" aria-label="Lido">✓✓</span>`
    : tipo === 'enviada'
      ? `<span class="indicador-lido pendente" aria-label="Enviado">✓</span>`
      : '';

  return `
    <article
      class="mensagem mensagem-${tipo}"
      data-mensagem-id="${msg.id}"
      data-remetente-id="${msg.remetente}"
    >
      <div class="bolha-mensagem">
        <p class="texto-mensagem">${escaparHTML(msg.texto)}</p>
        <time class="horario-mensagem" datetime="${msg.hora}">
          ${msg.hora}${checkLida}
        </time>
      </div>
    </article>
  `;
}

/**
 * Renderiza todo o histórico de mensagens do contato ativo.
 * Limpa a área antes de preencher.
 */
function renderizarMensagens() {
  const contato = buscarContato(Estado.contatoAtivo);
  if (!contato) return;

  DOM.areaMensagens.innerHTML = `<div class="separador-data">Hoje</div>`;

  contato.mensagens.forEach(msg => {
    const tipo = msg.remetente === USUARIO_LOGADO.id ? 'enviada' : 'recebida';
    DOM.areaMensagens.insertAdjacentHTML('beforeend', templateMensagem(msg, tipo));
  });

  rolarParaBaixo();
}

/**
 * Injeta uma única mensagem nova na área de chat com animação.
 * @param {Object} msg   - objeto de mensagem
 * @param {string} tipo  - 'enviada' | 'recebida'
 */
function injetarMensagem(msg, tipo) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = templateMensagem(msg, tipo);
  const el = wrapper.firstElementChild;

  // CSS de entrada: começa invisível e desliza para cima
  el.style.opacity   = '0';
  el.style.transform = tipo === 'enviada' ? 'translateX(20px)' : 'translateX(-20px)';

  DOM.areaMensagens.appendChild(el);

  // Força reflow antes de animar
  void el.offsetHeight;

  el.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
  el.style.opacity    = '1';
  el.style.transform  = 'translateX(0)';

  rolarParaBaixo();
}


/* ================================================================
   7. INDICADOR "DIGITANDO..."
   Exibe bolha animada quando o contato remoto está respondendo.
   ================================================================ */

/**
 * Cria e exibe a bolha "digitando..." na área de mensagens.
 */
function mostrarDigitando() {
  if (Estado.digitandoVisivel) return;
  Estado.digitandoVisivel = true;

  const el = document.createElement('div');
  el.id        = 'indicador-digitando';
  el.className = 'mensagem mensagem-recebida';
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-label', 'Contato está digitando');
  el.innerHTML = `
    <div class="bolha-mensagem bolha-digitando">
      <span class="ponto-digitando"></span>
      <span class="ponto-digitando"></span>
      <span class="ponto-digitando"></span>
    </div>
  `;

  el.style.opacity   = '0';
  el.style.transform = 'translateX(-10px)';
  DOM.areaMensagens.appendChild(el);

  void el.offsetHeight;
  el.style.transition = 'opacity 0.2s, transform 0.2s';
  el.style.opacity    = '1';
  el.style.transform  = 'translateX(0)';

  rolarParaBaixo();
}

/**
 * Remove a bolha "digitando..." com animação de saída.
 */
function ocultarDigitando() {
  const el = document.getElementById('indicador-digitando');
  if (!el) return;
  Estado.digitandoVisivel = false;

  el.style.transition = 'opacity 0.15s, transform 0.15s';
  el.style.opacity    = '0';
  el.style.transform  = 'translateX(-10px)';

  setTimeout(() => el.remove(), 160);
}


/* ================================================================
   8. ENVIO DE MENSAGEM
   Captura, valida e processa o envio de uma nova mensagem.
   ================================================================ */

/**
 * Envia a mensagem digitada no input.
 * Valida, cria o objeto, atualiza os dados e dispara a resposta automática.
 */
function enviarMensagem() {
  const texto = DOM.inputMensagem.value.trim();
  if (!texto) {
    // Anima o input para indicar campo vazio
    sacudirElemento(DOM.inputMensagem);
    return;
  }

  const contato = buscarContato(Estado.contatoAtivo);
  if (!contato) return;

  // Cria objeto da nova mensagem
  const novaMensagem = {
    id:       Estado.proximoIdMensagem++,
    remetente: USUARIO_LOGADO.id,
    texto,
    hora:     horaAtual(),
    lida:     false,
  };

  // Adiciona aos dados mockados
  contato.mensagens.push(novaMensagem);

  // Renderiza no DOM
  injetarMensagem(novaMensagem, 'enviada');

  // Atualiza item na sidebar
  atualizarItemContato(Estado.contatoAtivo);

  // Limpa input e reseta altura
  DOM.inputMensagem.value = '';
  DOM.inputMensagem.style.height = '';
  atualizarBotaoEnviar();

  // Anima botão de envio
  animarBotaoEnvio();

  // Simula resposta automática do contato (apenas se online/ausente)
  if (contato.status !== 'offline') {
    simularResposta(contato);
  }
}

/**
 * Anima o botão de envio com um efeito de pulso.
 */
function animarBotaoEnvio() {
  DOM.botaoEnviar.style.transform = 'scale(0.88)';
  setTimeout(() => {
    DOM.botaoEnviar.style.transform = 'scale(1.12)';
    setTimeout(() => {
      DOM.botaoEnviar.style.transform = '';
    }, 150);
  }, 80);
}

/**
 * Aplica animação de "sacudir" em um elemento (campo vazio, erro etc.).
 * @param {HTMLElement} el
 */
function sacudirElemento(el) {
  el.style.transition = 'transform 0.07s';
  const passos = [6, -6, 4, -4, 2, 0];
  passos.forEach((px, i) => {
    setTimeout(() => {
      el.style.transform = `translateX(${px}px)`;
    }, i * 60);
  });
}


/* ================================================================
   9. RESPOSTA AUTOMÁTICA SIMULADA
   Imita um contato respondendo após um intervalo aleatório.
   Em produção: substituir por WebSocket ou polling da API.
   ================================================================ */

/**
 * Simula o contato digitando e depois enviando uma resposta.
 * @param {Object} contato
 */
function simularResposta(contato) {
  // Delay aleatório entre 1.2s e 3s
  const delayDigitando = Math.random() * 800 + 1200;
  const delayResposta  = Math.random() * 1500 + 1500;

  setTimeout(() => {
    // Só mostra "digitando" se ainda for a conversa ativa
    if (Estado.contatoAtivo === contato.id) {
      mostrarDigitando();
    }

    setTimeout(() => {
      ocultarDigitando();

      // Delay pequeno entre ocultar "digitando" e aparecer a mensagem
      setTimeout(() => {
        const respostas  = RESPOSTAS_AUTO[contato.id] || ['Ok!'];
        const textoResp  = aleatorio(respostas);

        const novaResp = {
          id:        Estado.proximoIdMensagem++,
          remetente: contato.id,
          texto:     textoResp,
          hora:      horaAtual(),
          lida:      Estado.contatoAtivo === contato.id,
        };

        contato.mensagens.push(novaResp);

        // Só renderiza na tela se for a conversa ativa
        if (Estado.contatoAtivo === contato.id) {
          injetarMensagem(novaResp, 'recebida');
        } else {
          // Incrementa contador de não lidas na sidebar
          contato.naoLidas++;
          atualizarItemContato(contato.id);
          notificarNovaMensagem(contato);
        }

        atualizarItemContato(contato.id);
      }, 180);
    }, delayResposta);
  }, delayDigitando);
}


/* ================================================================
   10. NOTIFICAÇÃO DE NOVA MENSAGEM
   Banner não-intrusivo quando chega mensagem em conversa inativa.
   ================================================================ */

/**
 * Exibe um toast de notificação na tela.
 * @param {Object} contato
 */
function notificarNovaMensagem(contato) {
  // Remove toast anterior se existir
  const anterior = document.getElementById('toast-notificacao');
  if (anterior) anterior.remove();

  const ultimaMensagem = contato.mensagens[contato.mensagens.length - 1];

  const toast = document.createElement('div');
  toast.id        = 'toast-notificacao';
  toast.className = 'toast-notificacao';
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.innerHTML = `
    <div class="toast-avatar"></div>
    <div class="toast-info">
      <strong class="toast-nome">${escaparHTML(contato.nome)}</strong>
      <p class="toast-preview">${escaparHTML(ultimaMensagem.texto)}</p>
    </div>
    <button class="toast-fechar" aria-label="Fechar notificação">×</button>
  `;

  document.body.appendChild(toast);

  // Anima entrada
  void toast.offsetHeight;
  toast.classList.add('toast-visivel');

  // Clique abre a conversa
  toast.addEventListener('click', (e) => {
    if (!e.target.classList.contains('toast-fechar')) {
      abrirConversa(contato.id);
    }
    fecharToast(toast);
  });

  // Auto-fecha após 4s
  setTimeout(() => fecharToast(toast), 4000);
}

/**
 * Remove o toast com animação de saída.
 * @param {HTMLElement} toast
 */
function fecharToast(toast) {
  toast.classList.remove('toast-visivel');
  setTimeout(() => toast.remove(), 300);
}


/* ================================================================
   11. TROCA DE CONVERSA
   Atualiza o cabeçalho e mensagens ao clicar em um contato.
   ================================================================ */

/**
 * Abre a conversa de um contato específico.
 * @param {string} idContato
 */
function abrirConversa(idContato) {
  const contato = buscarContato(idContato);
  if (!contato || idContato === Estado.contatoAtivo) return;

  // Marca todas as mensagens desse contato como lidas
  contato.mensagens.forEach(m => { m.lida = true; });
  contato.naoLidas = 0;

  // Atualiza estado
  Estado.contatoAtivo = idContato;

  // Remove classe ativo de todos os contatos
  document.querySelectorAll('.contato').forEach(el => el.classList.remove('ativo'));

  // Ativa o novo
  const novoItem = DOM.listaContatos.querySelector(`[data-contato-id="${idContato}"]`);
  if (novoItem) {
    novoItem.classList.add('ativo');
    const badge = novoItem.querySelector('.contador-nao-lidas');
    if (badge) animarSaida(badge);
  }

  // Anima transição do cabeçalho
  atualizarCabecalhoChat(contato);

  // Anima transição da área de mensagens
  transicaoMensagens(() => renderizarMensagens());

  // Fecha sidebar em mobile
  if (window.innerWidth <= 768) {
    DOM.sidebarContatos.classList.remove('sidebar-visivel');
  }

  // Garante foco no input
  DOM.inputMensagem.focus();
}

/**
 * Atualiza nome, foto e status no cabeçalho do chat com fade.
 * @param {Object} contato
 */
function atualizarCabecalhoChat(contato) {
  const cabecalho = document.getElementById('cabecalho-chat');

  cabecalho.style.transition = 'opacity 0.18s';
  cabecalho.style.opacity    = '0';

  setTimeout(() => {
    DOM.cabecalhoChatNome.textContent = contato.nome;

    const statusEl = DOM.cabecalhoChatStatus;
    if (contato.status === 'online') {
      statusEl.textContent = 'Online';
      statusEl.dataset.status = 'online';
      statusEl.classList.remove('ausente');
    } else if (contato.status === 'ausente') {
      statusEl.textContent = contato.ultimaVez || 'Ausente';
      statusEl.dataset.status = 'ausente';
      statusEl.classList.add('ausente');
    } else {
      statusEl.textContent = contato.ultimaVez || 'Offline';
      statusEl.dataset.status = 'offline';
      statusEl.classList.add('ausente');
    }

    cabecalho.dataset.contatoId = contato.id;
    cabecalho.style.opacity     = '1';
  }, 180);
}

/**
 * Anima a saída das mensagens antigas e chama o callback para renderizar as novas.
 * @param {Function} callback
 */
function transicaoMensagens(callback) {
  DOM.areaMensagens.style.transition = 'opacity 0.15s, transform 0.15s';
  DOM.areaMensagens.style.opacity    = '0';
  DOM.areaMensagens.style.transform  = 'translateY(6px)';

  setTimeout(() => {
    callback();
    DOM.areaMensagens.style.opacity   = '1';
    DOM.areaMensagens.style.transform = 'translateY(0)';
  }, 155);
}


/* ================================================================
   12. BUSCA DE CONTATOS
   Filtra a lista lateral em tempo real.
   ================================================================ */

/**
 * Handler do input de busca — filtra e re-renderiza a lista.
 */
function handleBuscaContatos() {
  const valor = DOM.buscaContatos.value.trim();
  Estado.filtroContatos = valor.length > 0 ? valor : null;
  renderizarContatos();
}


/* ================================================================
   13. INPUT COM AUTO-EXPAND
   O campo de mensagem cresce conforme o texto digitado.
   ================================================================ */

/**
 * Ajusta a altura do input de mensagem dinamicamente.
 * Ativa/desativa o botão de envio conforme há texto.
 */
function handleInputMensagem() {
  Estado.textoDigitado = DOM.inputMensagem.value;
  atualizarBotaoEnviar();
}

/**
 * Habilita ou desabilita visualmente o botão de envio.
 */
function atualizarBotaoEnviar() {
  const temTexto = DOM.inputMensagem.value.trim().length > 0;
  DOM.botaoEnviar.style.opacity    = temTexto ? '1' : '0.5';
  DOM.botaoEnviar.style.transform  = temTexto ? 'scale(1)' : 'scale(0.92)';
  DOM.botaoEnviar.style.transition = 'opacity 0.2s, transform 0.2s';
}


/* ================================================================
   14. SIDEBAR MOBILE
   Botão para abrir/fechar a lista de contatos em telas pequenas.
   ================================================================ */

/**
 * Cria e injeta o botão de toggle da sidebar no cabeçalho do chat (mobile).
 */
function criarBotaoMobileSidebar() {
  const btn = document.createElement('button');
  btn.id          = 'botaoAbrirSidebar';
  btn.className   = 'btn-acao-chat btn-mobile-sidebar';
  btn.setAttribute('aria-label', 'Ver contatos');
  btn.title        = 'Contatos';
  btn.innerHTML   = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  `;

  btn.addEventListener('click', () => {
    DOM.sidebarContatos.classList.toggle('sidebar-visivel');
  });

  // Insere antes das ações existentes
  const acoes = document.querySelector('.acoes-cabecalho-chat');
  acoes.prepend(btn);

  // Fecha sidebar ao clicar fora
  document.addEventListener('click', (e) => {
    if (
      window.innerWidth <= 768 &&
      !DOM.sidebarContatos.contains(e.target) &&
      e.target !== btn &&
      !btn.contains(e.target)
    ) {
      DOM.sidebarContatos.classList.remove('sidebar-visivel');
    }
  });
}


/* ================================================================
   15. INJEÇÃO DE ESTILOS DINÂMICOS
   CSS necessário para as animações JS que não estão no mensagens.css.
   ================================================================ */

/**
 * Injeta no <head> os estilos de animação usados pelo JavaScript.
 */
function injetarEstilosAnimacao() {
  const style = document.createElement('style');
  style.id = 'estilos-js';
  style.textContent = `

    /* --- Bolha "digitando..." --- */
    .bolha-digitando {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 12px 16px !important;
      min-width: 52px;
    }

    .ponto-digitando {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background-color: #aaa9a0;
      display: inline-block;
      animation: pular-ponto 1.2s ease-in-out infinite;
    }

    .ponto-digitando:nth-child(2) { animation-delay: 0.2s; }
    .ponto-digitando:nth-child(3) { animation-delay: 0.4s; }

    @keyframes pular-ponto {
      0%, 60%, 100% { transform: translateY(0);    opacity: 0.5; }
      30%            { transform: translateY(-6px); opacity: 1;   }
    }

    /* --- Toast de notificação --- */
    .toast-notificacao {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 12px;
      background: #ffffff;
      border: 1px solid #e4e4de;
      border-left: 4px solid #f5c800;
      border-radius: 12px;
      padding: 12px 14px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.12);
      max-width: 320px;
      cursor: pointer;
      transform: translateX(calc(100% + 30px));
      opacity: 0;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
      user-select: none;
    }

    .toast-notificacao.toast-visivel {
      transform: translateX(0);
      opacity: 1;
    }

    .toast-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #e4e4de;
      flex-shrink: 0;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 38 38'%3E%3Ccircle cx='19' cy='19' r='19' fill='%23e4e4de'/%3E%3Ccircle cx='19' cy='14' r='7' fill='%23b0b0a8'/%3E%3Cellipse cx='19' cy='33' rx='11' ry='8' fill='%23b0b0a8'/%3E%3C/svg%3E");
      background-size: cover;
    }

    .toast-info { flex: 1; min-width: 0; }

    .toast-nome {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: #1a1a18;
      margin-bottom: 2px;
    }

    .toast-preview {
      font-size: 0.75rem;
      color: #7a7a72;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .toast-fechar {
      background: none;
      border: none;
      font-size: 1.2rem;
      color: #aaa9a0;
      cursor: pointer;
      line-height: 1;
      padding: 0 2px;
      flex-shrink: 0;
      transition: color 0.15s;
    }

    .toast-fechar:hover { color: #1a1a18; }

    /* --- Animações de contato na sidebar --- */
    @keyframes subir-contato {
      from { opacity: 0.5; transform: translateY(-8px); }
      to   { opacity: 1;   transform: translateY(0); }
    }

    .animacao-subir {
      animation: subir-contato 0.28s ease-out both;
    }

    @keyframes aparecer-badge {
      from { transform: scale(0); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }

    .animacao-badge {
      animation: aparecer-badge 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    /* --- Itens sem resultado na busca --- */
    .sem-resultados {
      padding: 20px 18px;
      font-size: 0.8rem;
      color: #aaa9a0;
      text-align: center;
      list-style: none;
    }

    /* --- Botão mobile sidebar (aparece só em tela pequena) --- */
    .btn-mobile-sidebar {
      display: none;
    }

    @media (max-width: 768px) {
      .btn-mobile-sidebar { display: flex; }
    }

    /* --- Check de mensagem pendente (não lida pelo destino) --- */
    .indicador-lido.pendente {
      opacity: 0.45;
    }
  `;
  document.head.appendChild(style);
}


/* ================================================================
   16. VINCULAÇÃO DE EVENTOS
   Centraliza todos os addEventListener da aplicação.
   ================================================================ */

/**
 * Vincula eventos aos itens de contato renderizados na sidebar.
 * Chamado após cada re-renderização da lista.
 */
function vincularEventosContatos() {
  DOM.listaContatos.querySelectorAll('.contato').forEach(item => {
    item.addEventListener('click', () => abrirConversa(item.dataset.contatoId));

    // Acessibilidade: abre conversa com Enter ou Espaço
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        abrirConversa(item.dataset.contatoId);
      }
    });
  });
}

/**
 * Vincula todos os eventos fixos da interface.
 */
function vincularEventos() {
  // Envio por clique
  DOM.botaoEnviar.addEventListener('click', enviarMensagem);

  // Envio por Enter (Shift+Enter quebra linha futuramente)
  DOM.inputMensagem.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  });

  // Atualiza estado do botão conforme digitação
  DOM.inputMensagem.addEventListener('input', handleInputMensagem);

  // Busca de contatos em tempo real
  DOM.buscaContatos.addEventListener('input', handleBuscaContatos);

  // Limpa busca ao pressionar Escape
  DOM.buscaContatos.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      DOM.buscaContatos.value  = '';
      Estado.filtroContatos    = null;
      renderizarContatos();
      DOM.buscaContatos.blur();
    }
  });

  // Botão de anexo — placeholder para futura funcionalidade
  DOM.botaoAnexo.addEventListener('click', () => {
    sacudirElemento(DOM.botaoAnexo);
    // TODO: abrir seletor de arquivo
    console.info('[Locatem] Anexo: funcionalidade em desenvolvimento.');
  });
}


/* ================================================================
   17. INICIALIZAÇÃO
   Ponto de entrada — executado quando o DOM estiver pronto.
   ================================================================ */

/**
 * Inicializa toda a aplicação de mensagens.
 */
function inicializar() {
  // 1. Injeta CSS das animações JS
  injetarEstilosAnimacao();

  // 2. Renderiza a lista de contatos
  renderizarContatos();

  // 3. Renderiza o histórico de mensagens do contato ativo
  renderizarMensagens();

  // 4. Atualiza o cabeçalho com os dados do contato ativo
  const contatoInicial = buscarContato(Estado.contatoAtivo);
  if (contatoInicial) atualizarCabecalhoChat(contatoInicial);

  // 5. Vincula todos os eventos
  vincularEventos();

  // 6. Cria botão de toggle para mobile
  criarBotaoMobileSidebar();

  // 7. Estado inicial do botão enviar
  atualizarBotaoEnviar();

  // 8. Foco no input
  DOM.inputMensagem.focus();

  console.info('[Locatem] Chat inicializado com sucesso ✓');
}

// Aguarda o DOM estar completamente carregado antes de inicializar
document.addEventListener('DOMContentLoaded', inicializar);