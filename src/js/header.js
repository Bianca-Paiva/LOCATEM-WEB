document.addEventListener('DOMContentLoaded', () => {

    // ────────────────── ELEMENTOS ──────────────────

    const menuLateral = document.getElementById('menuLateral');
    const overlay = document.getElementById('menuLateralOverlay');

    const btnAbrirMenu = document.getElementById('btnAbrirMenu');
    const btnFecharMenu = document.getElementById('btnFecharMenu');

    const perfil = document.getElementById('menuLateralPerfil');
    const secaoLogado = document.getElementById('menuLateralLogado');

    const btnSair = document.getElementById('menuLateralSair');
    const itemEntrar = document.getElementById('menuLateralItemEntrar');

    const nomeUsuario = document.getElementById('menuLateralNome');
    const emailUsuario = document.getElementById('menuLateralEmail');

    // ────────────────── VERIFICAÇÃO ──────────────────

    if (
        !menuLateral ||
        !overlay ||
        !btnAbrirMenu ||
        !btnFecharMenu
    ) {
        console.error(
            '[Menu Lateral] Alguns elementos não foram encontrados no DOM.'
        );

        return;
    }

    // ────────────────── ABRIR MENU ──────────────────

    function abrirMenu() {
        menuLateral.classList.add('active');
        overlay.classList.add('active');

        document.body.style.overflow = 'hidden';
    }

    // ────────────────── FECHAR MENU ──────────────────

    function fecharMenu() {

        menuLateral.classList.remove('active');
        overlay.classList.remove('active');

        document.body.style.overflow = '';
    }

    // ────────────────── EVENTOS ──────────────────

    btnAbrirMenu.addEventListener('click', abrirMenu);
    btnFecharMenu.addEventListener('click', fecharMenu);
    overlay.addEventListener('click', fecharMenu);

    // Fecha no ESC
    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape') {
            fecharMenu();
        }
    });

    // ────────────────── ESTADO DE LOGIN ──────────────────

    function aplicarEstadoLogin(logado, dados = {}) {

        if (logado) {

            // Mostra elementos de usuário logado
            perfil.classList.add('visivel');
            secaoLogado.classList.add('visivel');
            btnSair.classList.add('visivel');

            // Esconde botão entrar
            itemEntrar.style.display = 'none';

            // Atualiza nome
            if (dados.nome) {
                nomeUsuario.textContent =
                    `Olá, ${dados.nome}!`;
            }

            // Atualiza email
            if (dados.email) {
                emailUsuario.textContent =
                    dados.email;
            }
        } else {
            // Esconde elementos logados
            perfil.classList.remove('visivel');
            secaoLogado.classList.remove('visivel');
            btnSair.classList.remove('visivel');

            // Mostra botão entrar
            itemEntrar.style.display = '';
        }
    }

    // ────────────────── TESTE ──────────────────

    // Usuário deslogado
    aplicarEstadoLogin(false);

    // Usuário logado
    // aplicarEstadoLogin(true, { nome: 'João', email: 'joao.silva@email.com' });
});