/* ============================================================================
   MERCADO DA COPA — MELHORIAS DE EXPERIÊNCIA (v2)
   ----------------------------------------------------------------------------
   Camada opcional carregada depois de script.js. Ela NÃO reescreve as regras de
   negócio: apenas adiciona os comportamentos que faltavam na interface —
   avisos flutuantes, foco preso nos modais, animações de entrada, botão de
   voltar ao topo e carregamento inteligente dos vídeos.

   Tudo aqui é progressivo: se este arquivo não carregar, a loja continua
   funcionando como antes.
   ========================================================================== */
(function () {
    'use strict';

    // Navegadores antigos (e ambientes de teste) podem não ter matchMedia.
    const semAnimacao = typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ------------------------------------------------------- 1. AVISOS (TOASTS) */
    const pilha = document.getElementById('toast-stack');
    const ICONES = { sucesso: '✅', erro: '⛔', alerta: '⚠️', info: 'ℹ️', compra: '🛒' };

    function mostrarToast(mensagem, tipo = 'info', duracao) {
        if (!pilha) {
            console.info(mensagem);
            return;
        }
        // No máximo 3 avisos na tela: mais que isso vira poluição.
        while (pilha.children.length >= 3) pilha.firstElementChild.remove();

        const toast = document.createElement('div');
        toast.className = `toast ${tipo}`;
        toast.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
        toast.innerHTML = `
            <span class="toast-icone" aria-hidden="true">${ICONES[tipo] || ICONES.info}</span>
            <span class="toast-texto"></span>
            <button type="button" class="toast-fechar" aria-label="Fechar aviso">✕</button>`;
        toast.querySelector('.toast-texto').textContent = mensagem;

        const fechar = () => {
            toast.classList.add('saindo');
            setTimeout(() => {
                toast.remove();
                document.body.classList.toggle('com-toast', pilha.children.length > 0);
            }, 260);
        };
        toast.querySelector('.toast-fechar').addEventListener('click', fechar);
        pilha.appendChild(toast);
        document.body.classList.add('com-toast');

        const tempo = duracao || (tipo === 'erro' ? 7000 : 4500);
        setTimeout(fechar, tempo);
    }

    // O script principal chama window.mostrarToast() quando existe.
    window.mostrarToast = mostrarToast;

    /* ------------------------------------------- 2. VÍDEOS SEM BLOQUEAR A TELA */
    // O vídeo de fundo do login tem 5,6 MB e o de abertura 9,4 MB. Agora o
    // fundo só é baixado quando a tela de login realmente aparece, e a abertura
    // mostra um indicador em vez de uma tela preta muda.
    const intro = document.getElementById('video-intro');
    const introVideo = document.getElementById('intro-vid');
    const introLoading = document.getElementById('intro-loading');

    function esconderLoadingIntro() {
        if (introLoading) introLoading.classList.add('escondido');
    }

    if (introVideo) {
        introVideo.addEventListener('playing', esconderLoadingIntro, { once: true });
        introVideo.addEventListener('canplay', esconderLoadingIntro, { once: true });
        // Se o arquivo não carregar (rede lenta, formato não suportado), a
        // abertura se fecha sozinha em vez de travar o site numa tela preta.
        introVideo.addEventListener('error', () => window.skipIntro(), { once: true });
        setTimeout(() => {
            if (!introVideo.paused && introVideo.currentTime > 0) {
                esconderLoadingIntro();
            } else if (introVideo.readyState === 0) {
                esconderLoadingIntro();
                mostrarToast('Abertura indisponível no momento. Seguindo para a loja.', 'info');
                window.skipIntro();
            }
        }, 9000);
    }

    const videoFundo = document.querySelector('.video-lazy[data-src]');
    function carregarVideoFundo() {
        if (!videoFundo || videoFundo.dataset.carregado) return;
        videoFundo.dataset.carregado = 'sim';
        videoFundo.src = videoFundo.dataset.src;
        videoFundo.removeAttribute('data-src');
        videoFundo.load();
        const play = videoFundo.play();
        if (play && play.catch) play.catch(() => { /* autoplay bloqueado: ok */ });
    }

    if (videoFundo) {
        const auth = document.getElementById('auth-container');
        if (auth) {
            const observador = new MutationObserver(() => {
                if (auth.style.display !== 'none' && auth.offsetParent !== null) {
                    carregarVideoFundo();
                    observador.disconnect();
                }
            });
            observador.observe(auth, { attributes: true, attributeFilter: ['style'] });
        }
        // Rede ociosa depois da primeira pintura: melhor momento para baixar.
        if ('requestIdleCallback' in window) {
            requestIdleCallback(carregarVideoFundo, { timeout: 4000 });
        } else {
            setTimeout(carregarVideoFundo, 2500);
        }
    }

    /* --------------------------------------- 3. FOCO PRESO EM MODAIS E GAVETAS */
    let ultimoFoco = null;

    function camadaAberta() {
        const candidatos = [
            document.querySelector('.produto-modal.aberto'),
            document.querySelector('#carrinho-lateral.aberto'),
            document.querySelector('#mobile-menu.ativo')
        ];
        return candidatos.find(elemento => elemento) || null;
    }

    function focaveis(container) {
        return Array.from(container.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter(elemento => elemento.offsetParent !== null || elemento === document.activeElement);
    }

    document.addEventListener('keydown', evento => {
        if (evento.key === 'Escape') {
            // O script principal fecha os modais; aqui cuidamos das gavetas.
            if (document.getElementById('carrinho-lateral')?.classList.contains('aberto')) {
                document.getElementById('carrinho-lateral').classList.remove('aberto');
                document.getElementById('carrinho-btn')?.focus();
            }
            if (document.getElementById('mobile-menu')?.classList.contains('ativo')) {
                window.fecharMenuMobile();
                document.getElementById('menu-btn')?.focus();
            }
            sincronizarCamadas();
            return;
        }

        if (evento.key !== 'Tab') return;
        const camada = camadaAberta();
        if (!camada) return;

        const itens = focaveis(camada);
        if (!itens.length) return;
        const primeiro = itens[0];
        const ultimo = itens[itens.length - 1];

        if (evento.shiftKey && document.activeElement === primeiro) {
            evento.preventDefault();
            ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
            evento.preventDefault();
            primeiro.focus();
        }
    });

    // Bloqueio de rolagem do fundo sincronizado por observador: qualquer
    // camada (modal, carrinho, menu) aberta por qualquer caminho do código
    // trava a página, e o destravamento é automático ao fechar. Fazer isso
    // "na mão" dentro de cada função deixava a página presa quando o fechamento
    // acontecia por um atalho que não passava pela função original.
    function sincronizarCamadas() {
        const aberta = camadaAberta();
        document.body.classList.toggle('modal-aberto', Boolean(aberta));
        return aberta;
    }

    const observadorCamadas = new MutationObserver(sincronizarCamadas);
    ['.produto-modal', '#carrinho-lateral', '#mobile-menu'].forEach(seletor => {
        document.querySelectorAll(seletor).forEach(elemento => {
            observadorCamadas.observe(elemento, { attributes: true, attributeFilter: ['class', 'style'] });
        });
    });

    // Guarda de onde o usuário veio para devolver o foco ao fechar.
    ['abrirProdutoModal', 'abrirChatProposta', 'abrirAvaliacao'].forEach(nome => {
        const original = window[nome];
        if (typeof original !== 'function') return;
        window[nome] = function (...args) {
            ultimoFoco = document.activeElement;
            const resultado = original.apply(this, args);
            setTimeout(() => {
                sincronizarCamadas();
                const camada = camadaAberta();
                if (camada) {
                    const alvo = camada.querySelector('input, textarea, button');
                    if (alvo && !camada.querySelector('.produto-modal-fechar:focus')) alvo.focus();
                }
            }, 60);
            return resultado;
        };
    });

    ['fecharProdutoModal', 'fecharChat', 'fecharAvaliacao'].forEach(nome => {
        const original = window[nome];
        if (typeof original !== 'function') return;
        window[nome] = function (...args) {
            const resultado = original.apply(this, args);
            setTimeout(() => {
                sincronizarCamadas();
                if (ultimoFoco && document.contains(ultimoFoco)) ultimoFoco.focus();
                ultimoFoco = null;
            }, 40);
            return resultado;
        };
    });

    // Gaveta do carrinho: mesmo tratamento de foco.
    ['toggleCarrinho', 'abrirMenuMobile', 'fecharMenuMobile'].forEach(nome => {
        const original = window[nome];
        if (typeof original !== 'function') return;
        window[nome] = function (...args) {
            const resultado = original.apply(this, args);
            setTimeout(() => {
                const aberto = sincronizarCamadas();
                if (aberto) {
                    const alvo = aberto.querySelector('input, button');
                    if (alvo) alvo.focus();
                }
            }, 60);
            return resultado;
        };
    });

    /* ------------------------------------------------- 4. BUSCA COM DEBOUNCE */
    const busca = document.getElementById('busca-produto');
    const limparBusca = document.getElementById('busca-limpar');
    if (busca) {
        // Redesenha a lista só quando o usuário para de digitar.
        busca.removeAttribute('oninput');
        let temporizador = null;
        const atualizarBotao = () => {
            if (limparBusca) limparBusca.hidden = busca.value.trim() === '';
        };
        busca.addEventListener('input', () => {
            atualizarBotao();
            clearTimeout(temporizador);
            temporizador = setTimeout(() => window.filtrarVitrine(), 180);
        });
        window.addEventListener('keydown', evento => {
            if (evento.key === '/' && document.activeElement !== busca) {
                evento.preventDefault();
                busca.focus();
            }
        });
        atualizarBotao();
    }
    if (limparBusca) {
        limparBusca.addEventListener('click', () => {
            busca.value = '';
            limparBusca.hidden = true;
            busca.focus();
            window.filtrarVitrine();
        });
    }

    /* ------------------------------------------------ 5. ANIMAÇÕES DE ENTRADA */
    if (!semAnimacao && 'IntersectionObserver' in window) {
        const alvos = document.querySelectorAll(
            '.home-secao, .hero-loja, .kanban-board, .troca-form, .venda-form, .profile-card, .site-footer, .vitrine-controles'
        );
        const observador = new IntersectionObserver((entradas, observadorAtual) => {
            entradas.forEach(entrada => {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add('visivel');
                    observadorAtual.unobserve(entrada.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

        alvos.forEach(elemento => {
            elemento.classList.add('reveal');
            observador.observe(elemento);
        });
    }

    /* --------------------------------------------- 6. VOLTAR AO TOPO */
    const botaoTopo = document.getElementById('back-to-top');
    if (botaoTopo) {
        botaoTopo.hidden = false;
        const avaliarScroll = () => botaoTopo.classList.toggle('visivel', window.scrollY > 520);
        window.addEventListener('scroll', avaliarScroll, { passive: true });
        avaliarScroll();
        botaoTopo.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: semAnimacao ? 'auto' : 'smooth' });
        });
    }

    /* ------------------------------- 7. FECHAR AO CLICAR FORA (PAINÉIS) */
    document.addEventListener('click', evento => {
        const painel = document.getElementById('notificacoes-painel');
        const botao = document.getElementById('notificacoes-btn');
        if (painel?.classList.contains('aberto') &&
            !painel.contains(evento.target) && !botao?.contains(evento.target)) {
            painel.classList.remove('aberto');
            painel.setAttribute('aria-hidden', 'true');
            botao?.setAttribute('aria-expanded', 'false');
        }

        const carrinho = document.getElementById('carrinho-lateral');
        const botaoCarrinho = document.getElementById('carrinho-btn');
        if (carrinho?.classList.contains('aberto') &&
            !carrinho.contains(evento.target) && !botaoCarrinho?.contains(evento.target)) {
            // Só fecha se o clique não veio de um botão que adiciona ao carrinho.
            const dentroDoConteudo = evento.target.closest('.produto-card, .produto-modal, .hero-mini, .item-carrinho');
            if (!dentroDoConteudo) {
                carrinho.classList.remove('aberto');
                sincronizarCamadas();
            }
        }
    });

    /* ----------------------------------------------- 8. DETALHES FINAIS */
    const ano = document.getElementById('footer-ano');
    if (ano) ano.textContent = new Date().getFullYear();

    // Estado inicial do contador do carrinho (ex.: F5 com itens já adicionados).
    if (typeof window.atualizarBadgeCarrinho === 'function') window.atualizarBadgeCarrinho();

    // Atalhos de teclado para quem navega sem mouse.
    document.addEventListener('keydown', evento => {
        if (evento.target.matches('input, textarea, select')) return;
        if (evento.key === 'c') {
            evento.preventDefault();
            window.toggleCarrinho();
        }
    });

    // Mensagem única para sinalizar que a versão turbinada está ativa.
    window.addEventListener('load', () => {
        if (!window.__copaBoasVindas) {
            window.__copaBoasVindas = true;
            if (document.getElementById('main-site')?.style.display === 'block') {
                mostrarToast('Bem-vindo ao Mercado da Copa! Use a busca (tecla /) para achar sua peça.', 'info', 6000);
            }
        }
    });
})();
