let paginaAtual = 1;
let pesquisa="";
const busca = document.querySelector('#searchInput');
const form = document.getElementById("searchForm");

form.addEventListener('submit', buscarFilme);


async function buscarFilme(e) {
    if (e) e.preventDefault(); // Previne o comportamento padrão do formulário, mas permite que a função seja chamada sem um evento (para carregar mais resultados), usando da tecla Enter ou clicando no botão "Carregar mais"

    // realiza a pesquisa
    if (e) {
    pesquisa = busca.value.trim();
    paginaAtual = 1; // reset quando for nova busca
}
    if (!pesquisa) return; // Verifica se a pesquisa não está vazia

    const lista = document.getElementById("grid-anuncios");
    lista.innerHTML = "<p>Carregando...</p>"; // Exibe mensagem de carregamento

    try {

        //url da API, incluindo a página atual para paginar os resultados e a pesquisa
        const url = `https://www.omdbapi.com/?s=${pesquisa}&page=${paginaAtual}&apikey=491135e0`; // atualiza a URL para incluir a página atual
        const resposta = await fetch(url);
        const dados = await resposta.json();

        if (!dados.Search) {
            lista.innerHTML = "<p>Nenhum resultado encontrado</p>";
            return;
        }

      
        // Cria os cards para os filmes encontrados
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

        lista.innerHTML = cards;

      const totalPaginas = Math.ceil(dados.totalResults / 10); // A API retorna 20 resultados por página, então calculamos o total de páginas
      
        const totalResultados = document.getElementById("totalResultados");
        totalResultados.textContent = `${dados.totalResults} resultados encontrados`;
        criarPaginacao(totalPaginas);
    

    } catch (error) {
        lista.innerHTML = "<p>Ocorreu um erro ao buscar os filmes. Tente novamente.</p>";
        console.error("Erro ao buscar filmes:", error);
    }
}


function criarPaginacao(totalPaginas) {
    const paginacao = document.getElementById("paginacao");
    paginacao.innerHTML = "";

    if (totalPaginas <= 1) return; // Se só tiver 1 página, não precisa mostrar a paginação
    
    const maxBotoes = 5; // Quantidade máxima de botões a mostrar (ex: 5)
    let inicio = Math.max(1, paginaAtual - 2); // Começa 2 páginas antes da atual
    let fim = Math.min(totalPaginas, inicio + maxBotoes - 1); // Mostra até 5 páginas, mas não ultrapassa o total

    // botão voltar
    const prev = document.createElement("button");
    prev.textContent = "<"; // texto do botão
    prev.disabled = paginaAtual === 1; // desabilita se estiver na primeira página
    // ação ao clicar no botão voltar, que é diminuir a página atual e buscar os filmes novamente
    prev.onclick = () => {
        paginaAtual --;
        buscarFilme();
    };
    paginacao.appendChild(prev); // adiciona o botão voltar à paginação

    // se tiver páginas antes
    if (inicio > 1) {
        const first = document.createElement("button"); 
        first.textContent = "1";
        first.onclick = () => {
            paginaAtual = 1;
            buscarFilme();
        };
        paginacao.appendChild(first);

        const dots = document.createElement("span"); 
        dots.textContent = "...";
        paginacao.appendChild(dots);
    }

    // páginas do meio
    for (let i = inicio; i <= fim; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;

        if (i === paginaAtual) {
            btn.classList.add("ativo");
        }

        btn.onclick = () => {
            paginaAtual = i;
            buscarFilme();
        };

        paginacao.appendChild(btn);
    }

    // se tiver páginas depois
    if (fim < totalPaginas) {
        const dots = document.createElement("span");
        dots.textContent = "...";
        paginacao.appendChild(dots);

        const last = document.createElement("button");
        last.textContent = totalPaginas;
        last.onclick = () => {
            paginaAtual = totalPaginas;
            buscarFilme();
        };
        paginacao.appendChild(last);
    }

    // botão próximo
    const next = document.createElement("button");
    next.textContent = ">";
    next.disabled = paginaAtual === totalPaginas;
    next.onclick = () => {
        paginaAtual++;
        buscarFilme();
    };
    paginacao.appendChild(next);
}