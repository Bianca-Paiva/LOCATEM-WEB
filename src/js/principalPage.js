/* ======================================================
SELEÇÃO DOS ELEMENTOS
====================================================== */

const slides = document.querySelectorAll(".carrossel_item");
const indicadores = document.querySelectorAll(".carrossel-indicador");

const btnAntes = document.getElementById("antes");
const btnDepois = document.getElementById("depois");

let slideAtual = 0;

/* ======================================================
FUNÇÃO PARA MOSTRAR SLIDE
====================================================== */

function mostrarSlide(index) {
    /* REMOVE CLASSE ATIVO DE TODOS */
    slides.forEach((slide) => {
        slide.classList.remove("ativo");
    });

    indicadores.forEach((ind) => {
        ind.classList.remove("ativo");
    });

    /* ADICIONA NO SLIDE ATUAL */
    slides[index].classList.add("ativo");
    indicadores[index].classList.add("ativo");

    slideAtual = index;
}

/* ======================================================
BOTÃO PRÓXIMO
====================================================== */

btnDepois.addEventListener("click", () => {
    let proximo = slideAtual + 1;

    if (proximo >= slides.length) {
        proximo = 0;
    }

    mostrarSlide(proximo);
});

/* ======================================================
BOTÃO ANTERIOR
====================================================== */

btnAntes.addEventListener("click", () => {
    let anterior = slideAtual - 1;

    if (anterior < 0) {
        anterior = slides.length - 1;
    }

    mostrarSlide(anterior);
});

/* ======================================================
INDICADORES (BOLINHAS)
====================================================== */

indicadores.forEach((indicador, index) => {
    indicador.addEventListener("click", () => {
        mostrarSlide(index);
    });
});