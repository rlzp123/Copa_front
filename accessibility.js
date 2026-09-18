function configurarAcessibilidade() {
    document.querySelectorAll('.menu-conteudo a[role="button"], .avatar-option-circle[tabindex="0"]').forEach(elemento => {
        elemento.addEventListener('keydown', evento => {
            if (evento.key !== 'Enter' && evento.key !== ' ') return;
            evento.preventDefault();
            elemento.click();
        });
    });
}

document.addEventListener('DOMContentLoaded', configurarAcessibilidade);