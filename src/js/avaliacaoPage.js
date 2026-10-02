/* ============================================================
    DADOS DOS PRODUTOS
    Array central que funciona como "banco de dados" em memória.
    status: "pendente" | "realizada"
============================================================ */
const products = [
    {
        id: 1,
        name: "Furadeira Parafusadeira The Black Tools",
        date: "Locado em 02 de ago.",
        img: "https://http2.mlstatic.com/D_Q_NP_836965-MLA108103121007_032026-B.webp",
        status: "pendente",
        globalRating: 0,
        subRatings: { locador: 0, entrega: 0, produto: 0 },
        obs: "",
    },
    {
        id: 2,
        name: "Serra Mármore Corte Seco 1450w 4100 Nh2z Makito",
        date: "Locado em 25 de Jul.",
        img: "https://http2.mlstatic.com/D_NQ_NP_701344-MLB77327889785_072024-O.webp",
        status: "pendente",
        globalRating: 0,
        subRatings: { locador: 0, entrega: 0, produto: 0 },
        obs: "",
    },
    // {
    //     id: 3,
    //     name: "Parafusadeira Furadeira De Impacto Profissional Com Luz 2 Baterias 24v",
    //     date: "Locado em 02 de ago.",
    //     img: "https://http2.mlstatic.com/D_Q_NP_836965-MLA108103121007_032026-B.webp",
    //     status: "realizada",
    //     globalRating: 3,
    //     subRatings: { locador: 3, entrega: 5, produto: 4 },
    //     obs: "A ferramenta não era o que eu esperava, mas deu pro gasto, o locador Mario foi ótimo e super educado comigo, e a entrega perfeita",
    // }
];

/* ID do produto atualmente aberto no modal */
let currentId = null;


/* ============================================================
    starsHTML
    Gera o HTML das 5 estrelas de um produto.
    - count: quantas estrelas já preenchidas
    - context: identificador da categoria (global, locador, etc.)
    - id: id do produto
    - interactive: false desabilita role e tabindex (realizadas)
============================================================ */
function starsHTML(count, context, id, interactive = true) {
    return Array.from({ length: 5 }, (_, i) => {
        const filled = i < count;
        return `<span
            class="star ${filled ? 'active' : ''}"
            data-value="${i + 1}"
            data-context="${context}"
            data-id="${id}"
            ${interactive ? 'role="button" tabindex="0"' : ''}
            aria-label="Estrela ${i + 1}"
        >★</span>`;
    }).join('');
}


/* ============================================================
    renderList
    Desenha todos os cards de uma tab (pendente ou realizada).
    Chamada na inicialização e sempre que uma avaliação é enviada.
============================================================ */
function renderList(status) {
    const listId = status === 'pendente' ? 'pendentes-list' : 'realizadas-list';
    const container = document.getElementById(listId);
    const items = products.filter(p => p.status === status);

    /* Estado vazio — nenhum item na tab */
    if (!items.length) {
        const emptyConfig = {
            pendente: {
                icon: 'Parabéns, você está em dia!',
                text: 'Nenhuma avaliação pendente por aqui.',
            },
            realizada: {
                icon: 'Ainda sem avaliações realizadas.',
                text: 'Suas avaliações enviadas aparecerão aqui.',
            },
        };

        const { icon, text } = emptyConfig[status];
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">${icon}</div>
                <p>${text}</p>
            </div>`;
        return;
    }

    /* Monta o HTML de cada card */
    container.innerHTML = items.map(p => `
        <div class="section-group">
            <div class="store-badge">
                <span class="dot">
                    <img src="./src/images/makitaLogo.png" alt="Makita" />
                </span>
                Loja oficial <a href="#" class="store-link">Makita</a>
                <span class="verified-icon">
                    <img src="./src/images/verificado.png" alt="Verificado" />
                </span>
            </div>
            <article class="card" data-id="${p.id}" role="button" tabindex="0" aria-label="Avaliar ${p.name}">
                <div class="card-inner">
                    <img class="card-img" src="${p.img}" alt="${p.name}" loading="lazy" />
                    <div class="card-info">
                        <p class="card-name">${p.name}</p>
                        <p class="card-date">${p.date}</p>
                        <div class="stars-row" data-product="${p.id}">
                            ${starsHTML(p.globalRating, 'global', p.id, status === 'pendente')}
                        </div>
                    </div>
                </div>
            </article>
        </div>
    `).join('');

    /* Interatividade de estrelas — só nos cards pendentes */
    if (status === 'pendente') {

        /* Clique em estrela: salva nota e abre o modal */
        container.querySelectorAll('.stars-row .star').forEach(s => {
            s.addEventListener('click', e => {
                e.stopPropagation(); /* evita abrir modal duas vezes */
                const pid = +s.dataset.id;
                products.find(x => x.id === pid).globalRating = +s.dataset.value;
                openModal(pid);
            });
        });

        /* Hover nas estrelas: acende as anteriores como preview */
        container.querySelectorAll('.stars-row').forEach(row => {
            const stars = row.querySelectorAll('.star');
            const pid = +row.dataset.product;

            stars.forEach((s, i) => {
                s.addEventListener('mouseenter', () =>
                    stars.forEach((st, j) => st.classList.toggle('active', j <= i)));
            });

            /* Ao sair do hover, volta para o valor salvo */
            row.addEventListener('mouseleave', () => {
                const rating = products.find(x => x.id === pid).globalRating;
                stars.forEach((st, j) => st.classList.toggle('active', j < rating));
            });
        });
    }

    /* Clique no card abre o modal (independente do status) */
    container.querySelectorAll('.card').forEach(c => {
        c.addEventListener('click', () => openModal(+c.dataset.id));
        c.addEventListener('keydown', e => { if (e.key === 'Enter') openModal(+c.dataset.id); });
    });
}


/* ============================================================
    openModal
    Preenche e exibe o modal para o produto com o id informado.
============================================================ */
function openModal(pid) {
    currentId = pid;
    const p = products.find(x => x.id === pid);

    /* Ícones para cada sub-avaliação */
    const subIconMap = {
        locador: './src/images/makitaLogo.png',   /* logo da loja */
        entrega: './src/images/caminhao.png',      /* ícone de entrega */
        produto: p.img,                            /* foto do produto */
    };

    const subLabels = {
        locador: 'Avaliação Locador',
        entrega: 'Avaliação Entrega',
        produto: 'Avaliação Produto',
    };

    /* Injeta conteúdo do produto + sub-avaliações.
        Estrutura: [foto + info] na linha de cima, [sub-ratings] na linha de baixo — ocupando 100% da largura. */
    document.getElementById('modalProduct').innerHTML = `
        <div class="modal-product-topo">
            <img src="${p.img}" alt="${p.name}" />
            <div class="modal-product-info">
                <p class="modal-product-name">${p.name}</p>
                <p class="modal-product-date">${p.date}</p>
            </div>
        </div>
        <div class="modal-product-avaliacoes">
            <div class="sub-ratings">
                ${Object.keys(p.subRatings).map(key => `
                    <div class="sub-rating" data-key="${key}">
                        <span class="sub-rating-label">${subLabels[key]}</span>
                        <div class="sub-rating-icon">
                            <img src="${subIconMap[key]}" alt="${key}" />
                        </div>
                        <div class="sub-stars" data-sub="${key}" data-id="${p.id}">
                            ${starsHTML(p.subRatings[key], key, p.id)}
                        </div>
                    </div>
                `).join('')}
            </div>
            <!-- Mensagem exibida quando alguma sub-avaliação está em branco -->
            <p class="erro-avaliacao" id="erroAvaliacao">Avalie o locador, a entrega e o produto antes de enviar.</p>
        </div>
    `;

    /* Preenche textarea com observação já salva (se houver) */
    document.getElementById('obsText').value = p.obs || '';

    /* Interatividade das sub-estrelas no modal */
    document.querySelectorAll('#modalProduct .sub-stars').forEach(row => {
        const stars = row.querySelectorAll('.star');
        const subKey = row.dataset.sub;
        const pid2 = +row.dataset.id;

        stars.forEach((s, i) => {
            /* Hover: acende as anteriores */
            s.addEventListener('mouseenter', () =>
                stars.forEach((st, j) => st.classList.toggle('active', j <= i)));

            /* Sai do hover: volta ao valor salvo */
            s.addEventListener('mouseleave', () => {
                const rating = products.find(x => x.id === pid2).subRatings[subKey];
                stars.forEach((st, j) => st.classList.toggle('active', j < rating));
            });

            /* Clique: salva nota da sub-categoria e remove erro visual */
            s.addEventListener('click', () => {
                products.find(x => x.id === pid2).subRatings[subKey] = i + 1;
                stars.forEach((st, j) => st.classList.toggle('active', j <= i));

                /* Remove destaque de erro desta categoria */
                row.closest('.sub-rating').classList.remove('obrigatorio-erro');

                /* Se todas estiverem preenchidas, esconde a mensagem de erro */
                const p2 = products.find(x => x.id === pid2);
                const aindaFalta = Object.values(p2.subRatings).some(v => v === 0);
                if (!aindaFalta) {
                    const erroEl = document.getElementById('erroAvaliacao');
                    if (erroEl) erroEl.classList.remove('visivel');
                }
            });
        });
    });

    /* Preenche o carrossel com os outros itens pendentes */
    const carousel = document.getElementById('modalCarousel');
    const others = products.filter(x => x.id !== pid && x.status === 'pendente');

    carousel.innerHTML = others.map(o => `
        <div class="carousel-card" data-id="${o.id}" role="button" tabindex="0">
            <img src="${o.img}" alt="${o.name}" loading="lazy" />
            <p class="carousel-card-name">${o.name}</p>
            <p class="carousel-card-date">${o.date}</p>
            <div class="carousel-stars">
                ${Array.from({ length: 5 }, (_, i) =>
        `<span class="star ${i < o.globalRating ? 'active' : ''}">★</span>`
    ).join('')}
            </div>
        </div>
    `).join('');

    /* Clique no card do carrossel troca o produto aberto no modal */
    carousel.querySelectorAll('.carousel-card').forEach(c => {
        c.addEventListener('click', () => openModal(+c.dataset.id));
        c.addEventListener('keydown', e => { if (e.key === 'Enter') openModal(+c.dataset.id); });
    });

    /* Exibe o modal e trava o scroll do body */
    document.getElementById('modalOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}


/* ============================================================
    closeModal
    Oculta o modal e restaura o scroll da página.
============================================================ */
function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.body.style.overflow = '';
    currentId = null;
}


/* ============================================================
    Toggle de Observações
    Expande/colapsa o textarea ao clicar no botão.
============================================================ */
const obsToggle = document.getElementById('obsToggle');
const obsText = document.getElementById('obsText');

obsToggle.addEventListener('click', () => {
    const expanded = obsToggle.classList.toggle('expanded');
    obsText.style.display = expanded ? 'block' : 'none';
    obsToggle.setAttribute('aria-expanded', expanded);
});



/* ============================================================
    Enviar avaliação
    Valida se as 3 sub-avaliações foram preenchidas (obrigatório).
    Observações são opcionais. Calcula média e move para "realizadas".
============================================================ */
document.getElementById('btnEnviar').addEventListener('click', () => {
    if (!currentId) return;

    const p = products.find(x => x.id === currentId);

    /* ── Validação: todas as sub-notas devem ser > 0 ── */
    const subKeys = Object.keys(p.subRatings);
    const faltando = subKeys.filter(k => p.subRatings[k] === 0);

    if (faltando.length > 0) {
        /* Destaca em vermelho cada categoria não preenchida */
        document.querySelectorAll('.sub-rating').forEach(el => {
            el.classList.toggle('obrigatorio-erro', faltando.includes(el.dataset.key));
        });

        /* Exibe mensagem de erro */
        const erroEl = document.getElementById('erroAvaliacao');
        if (erroEl) erroEl.classList.add('visivel');

        return; /* interrompe o envio */
    }

    /* Limpa marcações de erro caso estivessem visíveis */
    document.querySelectorAll('.sub-rating').forEach(el => el.classList.remove('obrigatorio-erro'));
    const erroEl = document.getElementById('erroAvaliacao');
    if (erroEl) erroEl.classList.remove('visivel');

    /* Calcula média das 3 sub-notas */
    const subs = Object.values(p.subRatings);
    p.globalRating = Math.round(subs.reduce((a, b) => a + b, 0) / subs.length);
    p.obs = document.getElementById('obsText').value; /* observações são opcionais */
    p.status = 'realizada';

    closeModal();
    renderList('pendente');
    renderList('realizada');
    showToast();
});




/* ============================================================
    showToast
    Exibe a notificação de sucesso por 3 segundos.
============================================================ */
function showToast() {
    const t = document.getElementById('toast');
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}


/* ============================================================
    Fechar modal
    Três formas: botão Voltar, clicar fora do modal, tecla Esc.
============================================================ */
document.getElementById('modalBack').addEventListener('click', closeModal);

document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal(); /* só fecha se clicar no overlay, não no modal */
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});


/* ============================================================
    Tabs
    Alterna o painel visível e atualiza aria-selected.
============================================================ */
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        /* Remove ativo de todos */
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

        /* Ativa o clicado */
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
});


/* ============================================================
    INICIALIZAÇÃO
    Renderiza as duas listas ao carregar a página.
============================================================ */
renderList('pendente');
renderList('realizada');