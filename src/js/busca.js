let paginaAtual = 1;
let pesquisa="";
let dadosSalvos =[];


const busca = [
    document.querySelector('#searchInput'),
    document.querySelector('#searchInputMobile')
]
const form = [
    document.getElementById("searchForm"),
    document.getElementById("searchFormMobile")
]; // Seleciona o formulário, seja na versão desktop ou mobile

form.forEach((formElement, index) => {
    if (formElement) {
        formElement.addEventListener('submit', (e) => {
            e.preventDefault();

            pesquisa = busca[index].value.trim();

            if (pesquisa) {
                window.location.href =
                    `busca.html?search=${encodeURIComponent(pesquisa)}`;
            }
        });
    }
});

function IrparaBuscar() {
    const urlParams = new URLSearchParams(window.location.search);

    const searchQuery = urlParams.get('search');
    const page = urlParams.get('page');

    if (searchQuery) {
        busca.forEach(input => {
    if(input){
        input.value = searchQuery;
    }
});
       pesquisa = busca.find(input => input)?.value.trim();
    }

    if (page) {
        paginaAtual = Number(page);
    }

    if (pesquisa) {
        buscarProduto();
    }
}

async function buscarProduto(e) {
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
        const resposta = await fetch(url); //fetch =
        const dados = await resposta.json();

        if (!dados.Search) {
            lista.innerHTML = "<p>Nenhum resultado encontrado</p>";
            return;
        }

        dadosSalvos = dados.Search;
      

        renderizarLista(dadosSalvos);

      const totalPaginas = Math.ceil(dados.totalResults / 10); // A API retorna 10 resultados por página, então calculamos o total de páginas
      
        const totalResultados = document.getElementById("totalResultados");
        totalResultados.textContent = `${dados.totalResults} resultados encontrados`;
        criarPaginacao(totalPaginas);

        const novaURL = `?search=${encodeURIComponent(pesquisa)}&page=${paginaAtual}`;
        window.history.pushState({}, "", novaURL);

    } catch (error) {
        lista.innerHTML = "<p>Ocorreu um erro ao buscar os filmes. Tente novamente.</p>";
        console.error("Erro ao buscar filmes:", error);
    }
}




function ordenarComo() {
    const ordenar = document.getElementById("ordenar").value;

    let listaOrdenada = [...dadosSalvos]; //copia a lista

    if (ordenar === "1") {
        // a, b = servem para comparar os objetos
        // localeCompare é uma função que compara strings e retorna um valor indicando se a string é menor, igual ou maior que a outra
        // aqui estamos ordenando por título, usando localeCompare para comparar os títulos dos filmes
        listaOrdenada.sort((a, b) => a.Title.localeCompare(b.Title));
    } 
    else if (ordenar === "2") {
        listaOrdenada.sort((a, b) => Number(a.Year) - Number(b.Year));
    } 
    else if (ordenar === "3") {
        listaOrdenada.sort((a, b) => Number(b.Year) - Number(a.Year));
    }
    else if (ordenar === "4") {
        // A API do OMDB não retorna avaliação, então aqui é só um exemplo de como seria a ordenação por avaliação
         listaOrdenada.sort((a, b) => Number(b.imdbRating) - Number(a.imdbRating));
    }
    else if (ordenar === "5") {
     // A ordenação por novidades também não é possível com os dados atuais, mas aqui seria um exemplo de como ordenar por data de lançamento
        // listaOrdenada.sort((a, b) => new Date(b.Released) - new Date(a.Released));
    }

    renderizarLista(listaOrdenada);
}

function renderizarLista(lista) {
    const container = document.getElementById("grid-anuncios");
    container.innerHTML = "";

    lista.forEach(filme => {
        const poster = filme.Poster !== "N/A"
            ? filme.Poster
            : "./src/images/sem-imagem.png";

        container.innerHTML += `
            <li class="anuncio-card">
                <div class="card-img">
                    <img src="${poster}" alt="${filme.Title}">
                </div>

                <div class="card-info">
                    <h3>${filme.Title}</h3>
                    <p>${filme.Year}</p>
                </div>
            </li>
        `;
    });
}
///////////////////////////////////////////////////////////////////////

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
        buscarProduto();
    };
    paginacao.appendChild(prev); // adiciona o botão voltar à paginação

    // se tiver páginas antes
    if (inicio > 1) {
        const first = document.createElement("button"); 
        first.textContent = "1";
        first.onclick = () => {
            paginaAtual = 1;
            buscarProduto();
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
            buscarProduto();
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
            buscarProduto();
        };
        paginacao.appendChild(last);
    }

    // botão próximo
    const next = document.createElement("button");
    next.textContent = ">";
    next.disabled = paginaAtual === totalPaginas;
    next.onclick = () => {
        paginaAtual++;
        buscarProduto();
    };
    paginacao.appendChild(next);
}

/////////////////////// filtros ///////////////////////
function pegarFiltros() {
  const filtros = {
    preco: [],
    pagamento: [],
    avaliacao: [],
    disponibilidade: null
  };
  

  document.querySelectorAll('input[name="preco"]:checked')
    .forEach(el => filtros.preco.push(el.value));

  document.querySelectorAll('input[name="pagamento"]:checked')
    .forEach(el => filtros.pagamento.push(el.value));

  document.querySelectorAll('input[name="avaliacao"]:checked')
    .forEach(el => filtros.avaliacao.push(el.value));

  const disponibilidade = document.querySelector('input[name="disponibilidade"]:checked');
  if (disponibilidade) {
    filtros.disponibilidade = disponibilidade.value;
  }

  return filtros;
}

function aplicarFiltros() {
  const filtros = pegarFiltros();

  const resultadoFiltrado = dadosSalvos.filter(item => {

    // PREÇO
    if (filtros.preco.length > 0) {
        const dentro = filtros.preco.some(range => {
        if (range === "0-50") return item.preco >= 0 && item.preco <= 50;
        if (range === "51-100") return item.preco >= 51 && item.preco <= 100;
        if (range === "101-200") return item.preco >= 101 && item.preco <= 200;
        if (range === "200+") return item.preco > 200;
        });

      if (!dentro) return false;
    }

    // PAGAMENTO
    if (filtros.pagamento.length > 0) {
      if (!filtros.pagamento.includes(item.pagamento)) return false;
    }

    // AVALIAÇÃO
    if (filtros.avaliacao.length > 0) {
      const passou = filtros.avaliacao.some(a => item.avaliacao >= Number(a)); 
      if (!passou) return false;
    }

    // DISPONIBILIDADE
    if (filtros.disponibilidade) {
      if (item.disponibilidade !== filtros.disponibilidade) return false;
    }

    return true;
  });

  renderizarLista(resultadoFiltrado);
}

function limparFiltros() {
    //seleciona todos os checkboxes e radios e desmarca eles
  document.querySelectorAll('input[type="checkbox"], input[type="radio"]')
    .forEach(el => el.checked = false);

     renderizarLista(dadosSalvos); // volta ao normal
}

function mostrarFiltros() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('aberta');
}

document.addEventListener("DOMContentLoaded", () => {
    IrparaBuscar();
});
