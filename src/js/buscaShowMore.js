let paginaAtual = 1;
let termoBusca = "";
const busca = document.querySelector('#searchInput');
const form = document.getElementById("searchForm");
const lista = document.getElementById("grid-anuncios");
const btnCarregarMais = document.getElementById("btnCarregarMais");

form.addEventListener('submit', buscarFilme);

async function buscarFilme(e) {
    if (e) e.preventDefault();

    // nova busca
    if (e) {
        termoBusca = busca.value.trim();
        paginaAtual = 1;
        lista.innerHTML = ""; // limpa tudo
    }

    if (!termoBusca) return;

    try {
        const url = `https://www.omdbapi.com/?s=${termoBusca}&page=${paginaAtual}&apikey=491135e0`;
        const resposta = await fetch(url);
        const dados = await resposta.json();

        if (!dados.Search) {
            if (paginaAtual === 1) {
                lista.innerHTML = "<p>Nenhum resultado encontrado</p>";
            }
            btnCarregarMais.style.display = "none";
            return;
        }

        let cards = "";

        dados.Search.forEach(filme => {
            const poster = filme.Poster !== "N/A"
                ? filme.Poster
                : "./src/images/sem-imagem.png";

            cards += `
                <li class="anuncio-card">
                 <div class="card-img">
                     <img src="${poster}" alt="${filme.Title}">
                 </div>

                 <div class="card-info">
                     <h3>${filme.Title}</h3>
                     <div class="proprietario">
                         <h4>IMDb</h4>
                     </div>
                     <p>${filme.Year}</p>
                 </div>
             </li>
            `;
        });

    
        lista.innerHTML += cards;

     
        const totalPaginas = Math.ceil(dados.totalResults / 10);

        if (paginaAtual >= totalPaginas) {
            btnCarregarMais.style.display = "none";
        } else {
            btnCarregarMais.style.display = "block";
        }

    } catch (erro) {
        console.error(erro);
    }
}
btnCarregarMais.addEventListener("click", () => {
    paginaAtual++;
    buscarFilme();
});