const slides = document.querySelectorAll('.anuncio-img');
const indicadores = document.querySelectorAll('.indicadores span');
const btnAntes = document.getElementById('antes');
const btnDepois = document.getElementById('depois');

let atual = 0;

function mostrarSlide(index) {
    // esconde todos os slides e desativa indicadores
    slides.forEach(slide => slide.style.display = 'none');
    indicadores.forEach(ind => {
        ind.classList.remove('ativo');
        ind.setAttribute('aria-selected', 'false');
    });

    // mostra o slide atual e ativa o indicador
    slides[index].style.display = 'block';
    indicadores[index].classList.add('ativo');
    indicadores[index].setAttribute('aria-selected', 'true');
}

btnAntes.addEventListener('click', () => {
    atual = (atual - 1 + slides.length) % slides.length;
    mostrarSlide(atual);
});

btnDepois.addEventListener('click', () => {
    atual = (atual + 1) % slides.length;
    mostrarSlide(atual);
});

// clique nos indicadores
indicadores.forEach((ind, index) => {
    ind.addEventListener('click', () => {
        atual = index;
        mostrarSlide(atual);
    });
});

const cards = document.querySelectorAll('.anuncio-card');

cards.forEach(card => {
    card.addEventListener('click', () => {

        // pega o id do produto
        const idProduto = card.dataset.id;

        // redireciona para página do produto
        window.location.href = `produtoPage.html?id=${idProduto}`;
    });
});

// inicializa no primeiro slide
mostrarSlide(atual);