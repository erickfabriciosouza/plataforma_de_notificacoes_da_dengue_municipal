const barra = document.querySelector('.barra');
const botaoMenu = document.querySelector('.menu-botao');
const menu = document.querySelector('#menu');

barra.classList.add('menu-pronto');
botaoMenu.hidden = false;

function definirMenu(aberto) {
    barra.classList.toggle('menu-aberto', aberto);
    botaoMenu.setAttribute('aria-expanded', String(aberto));
}

botaoMenu.addEventListener('click', () => definirMenu(botaoMenu.getAttribute('aria-expanded') !== 'true'));
barra.addEventListener('keydown', evento => {
    if (evento.key === 'Escape' && botaoMenu.getAttribute('aria-expanded') === 'true') {
        definirMenu(false);
        botaoMenu.focus();
    }
});
menu.addEventListener('click', () => definirMenu(false));
