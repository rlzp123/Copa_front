
// Configuração Global da API
const API_URL = "http://localhost:3000/api";
// Quando for pro Vercel, mude para:
// const API_URL = "https://seu-app.vercel.app/api";

let produtos = [];
let pessoasProximas = [];
let carrinho = [];
let pedidos = [];
let usuarioAtual = "TORCEDOR_10";
let emailUsuarioAtual = "";
let favoritos = [];
let notificacoes = [];
const CONTAS_LOCAIS_KEY = "mercadoDaCopaContas";
const FAVORITOS_KEY = "mercadoDaCopaFavoritos";
const PRODUTOS_VENDA_KEY = "mercadoDaCopaProdutosVenda";
const PROPOSTAS_TROCA_KEY = "mercadoDaCopaPropostasTroca";
const CHATS_TROCA_KEY = "mercadoDaCopaChatsTroca";
const AVALIACOES_KEY = "mercadoDaCopaAvaliacoes";
const NOTIFICACOES_KEY = "mercadoDaCopaNotificacoes";
const PRECOS_CONHECIDOS_KEY = "mercadoDaCopaPrecosConhecidos";
let imagemVendaTemporaria = "";

const catalogoLocal = Array.isArray(window.catalogoLocalData) ? window.catalogoLocalData : [];

// ================== UTILITÁRIOS ==================
// Imagem de reserva quando o produto não tem foto (evita o ícone quebrado).
const IMAGEM_PADRAO = './img/bola.png';

// Formata preços no padrão brasileiro: R$ 1.249,90 (antes saía "R$ 1249.90").
function formatarPreco(valor) {
    const numero = Number(valor);
    return (Number.isFinite(numero) ? numero : 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// Escapa texto que vem de outros usuários antes de entrar em innerHTML.
// Sem isso, um anúncio com <img onerror=...> executava código na página de quem
// apenas navegava pela vitrine.
function escaparHtml(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, caractere => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[caractere]);
}

// Imagem com reserva: se o arquivo não existir (caso dos itens sem foto),
// troca automaticamente pelo marcador padrão em vez de mostrar ícone quebrado.
function atributoImagem(caminho, alt) {
    const src = caminho || IMAGEM_PADRAO;
    return `src="${escaparHtml(src)}" alt="${escaparHtml(alt)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${IMAGEM_PADRAO}'"`;
}

// Mensagem flutuante no lugar do alert() nativo.
function avisar(mensagem, tipo = 'info') {
    if (typeof window.mostrarToast === 'function') {
        window.mostrarToast(mensagem, tipo);
    } else {
        console.info(mensagem);
    }
}

// ================== FLUXO DE ENTRADA ==================
function skipIntro() {
    document.getElementById('video-intro').style.display = 'none';
    document.getElementById('auth-container').style.display = 'flex';
}

function atualizarRangePreco() {
    const minEl = document.getElementById('preco-range-min');
    const maxEl = document.getElementById('preco-range-max');
    const label = document.getElementById('preco-range-label');
    if (!minEl || !maxEl || !label) return;
    let min = Number(minEl.value);
    let max = Number(maxEl.value);
    if (min > max) { const t = min; min = max; max = t; }
    const semCentavos = valor => Number(valor).toLocaleString('pt-BR');
    label.innerText = `R$ ${semCentavos(min)} – R$ ${semCentavos(max)}`;
}

document.getElementById('intro-vid').onended = skipIntro;

function toggleAuth() {
    document.getElementById('login-form').classList.toggle('hidden');
    document.getElementById('register-form').classList.toggle('hidden');
    limparFeedbackAuth();
}

function mostrarLogin() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
    // Correção: a mensagem de sucesso estava sendo exibida no formulário de
    // cadastro, que acabou de ficar oculto — o usuário não via nada.
    mostrarFeedbackAuth('login', 'Cadastro realizado! Entre com seu e-mail e senha.', true);
}

function mostrarFeedbackAuth(formulario, mensagem, sucesso = false) {
    const feedback = document.getElementById(`${formulario}-feedback`);
    feedback.innerText = mensagem;
    feedback.classList.toggle('success', sucesso);
}

function limparFeedbackAuth() {
    ['login', 'register'].forEach(formulario => {
        const feedback = document.getElementById(`${formulario}-feedback`);
        feedback.innerText = '';
        feedback.classList.remove('success');
    });
}

function obterContasLocais() {
    try {
        return JSON.parse(localStorage.getItem(CONTAS_LOCAIS_KEY) || '[]');
    } catch (erro) {
        return [];
    }
}

function salvarContasLocais(contas) {
    localStorage.setItem(CONTAS_LOCAIS_KEY, JSON.stringify(contas));
}

function dadosAuthValidos(email, password) {
    return email.includes('@') && email.includes('.') && password.length >= 6;
}

async function realizarLogin() {
    const email = document.getElementById('log-email').value.trim().toLowerCase();
    const password = document.getElementById('log-pass').value;

    limparFeedbackAuth();
    if (!email || !password) {
        mostrarFeedbackAuth('login', 'Informe seu e-mail e sua senha.');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (res.ok) {
            const data = await res.json();
            setUsuarioAtual(data.usuario.nome_exibicao, email);
        } else {
            mostrarFeedbackAuth('login', 'E-mail ou senha incorretos.');
        }
    } catch (err) {
        const conta = obterContasLocais().find(item => item.email === email);
        if (conta && conta.password === password) {
            setUsuarioAtual(conta.nome, conta.email);
        } else {
            mostrarFeedbackAuth('login', 'Não foi possível entrar. Confira seus dados ou crie uma conta.');
        }
    }
}

async function cadastrarUsuario() {
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const nome = document.getElementById('reg-name').value.trim();
    const password = document.getElementById('reg-pass').value;

    limparFeedbackAuth();
    if (!nome || !email || !password) {
        mostrarFeedbackAuth('register', 'Preencha todos os campos para criar sua conta.');
        return;
    }
    if (!dadosAuthValidos(email, password)) {
        mostrarFeedbackAuth('register', 'Use um e-mail válido e uma senha com pelo menos 6 caracteres.');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, password })
        });
        if (res.ok) {
            mostrarFeedbackAuth('register', 'Cadastro realizado! Agora entre com seu e-mail e senha.', true);
            document.getElementById('log-email').value = email;
            document.getElementById('log-pass').value = '';
            document.getElementById('reg-name').value = '';
            document.getElementById('reg-email').value = '';
            document.getElementById('reg-pass').value = '';
            setTimeout(mostrarLogin, 700);
        } else {
            mostrarFeedbackAuth('register', 'Este e-mail já está cadastrado ou não pode ser usado.');
        }
    } catch (err) {
        const contas = obterContasLocais();
        if (contas.some(item => item.email === email)) {
            mostrarFeedbackAuth('register', 'Este e-mail já possui uma conta.');
            return;
        }
        contas.push({ nome, email, password });
        salvarContasLocais(contas);
        document.getElementById('log-email').value = email;
        document.getElementById('log-pass').value = '';
        mostrarFeedbackAuth('register', 'Cadastro realizado! Agora faça login.', true);
        setTimeout(mostrarLogin, 700);
    }
}

function setUsuarioAtual(nome, email) {
    usuarioAtual = nome;
    emailUsuarioAtual = email.toLowerCase();
    favoritos = obterFavoritos();
    notificacoes = obterNotificacoes();
    renderizarNotificacoes();
    document.getElementById('display-private-email').innerText = email;
    document.getElementById('input-display-name').value = usuarioAtual;
    document.getElementById('input-email').value = emailUsuarioAtual;
    document.getElementById('input-password').value = '';
    document.getElementById('input-password-confirm').value = '';
    document.getElementById('welcome-text-menu').innerText = usuarioAtual.toUpperCase();
    document.getElementById('perfil-nome-view').innerText = usuarioAtual.toUpperCase();
    renderizarResumoPerfil();

    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('starlight-message').style.display = 'flex';
}

async function entrarNoSistema() {
    document.getElementById('starlight-message').style.display = 'none';
    document.getElementById('main-site').style.display = 'block';
    await carregarDadosApi();
}

async function carregarDadosApi() {
    try {
        const resProd = await fetch(`${API_URL}/produtos`);
        if (resProd.ok) produtos = await resProd.json();
    } catch (e) { console.info("API indisponível; usando catálogo local."); }

    if (!Array.isArray(produtos) || produtos.length === 0) {
        produtos = catalogoLocal.map(produto => ({ ...produto }));
    }
    produtos = [...produtos, ...obterProdutosVenda()];
    verificarAlteracoesDePreco();

    try {
        const resPed = await fetch(`${API_URL}/pedidos/${usuarioAtual}`);
        if (resPed.ok) pedidos = await resPed.json();
    } catch (e) { console.error("Erro ao carregar pedidos:", e); }

    renderizarVitrine();
    renderizarPedidos();
    prepararFormularioTroca();
    renderizarPropostasTroca();
}

// ================== PERFIL ==================
let avatarTemporarioSrc = "./img-avatares/vini.jpg";

function previewAvatar(elemento) {
    avatarTemporarioSrc = elemento.src;
    document.getElementById('perfil-avatar-view').src = avatarTemporarioSrc;

    document.querySelectorAll('.avatar-option-circle').forEach(img => img.classList.remove('selected'));
    elemento.classList.add('selected');
}

function salvarPerfil() {
    const novoNome = document.getElementById('input-display-name').value.trim();
    const novoEmail = document.getElementById('input-email').value.trim().toLowerCase();
    const novaSenha = document.getElementById('input-password').value;
    const confirmacaoSenha = document.getElementById('input-password-confirm').value;
    const feedback = document.getElementById('perfil-feedback');

    if (!novoNome || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novoEmail)) {
        feedback.innerText = 'Informe um nome e um e-mail válido.';
        return;
    }
    if (novaSenha && (novaSenha.length < 6 || novaSenha !== confirmacaoSenha)) {
        feedback.innerText = 'A nova senha precisa ter 6 caracteres e coincidir nos dois campos.';
        return;
    }

    const contas = obterContasLocais();
    const contaAtual = contas.find(conta => conta.email === emailUsuarioAtual);
    const emailDuplicado = contas.some(conta => conta.email === novoEmail && conta.email !== emailUsuarioAtual);
    if (emailDuplicado) {
        feedback.innerText = 'Este e-mail já está sendo usado por outra conta.';
        return;
    }

    const emailAnterior = emailUsuarioAtual;
    if (contaAtual) {
        contaAtual.nome = novoNome;
        contaAtual.email = novoEmail;
        if (novaSenha) contaAtual.password = novaSenha;
        salvarContasLocais(contas);
    }
    if (emailAnterior !== novoEmail) migrarDadosPerfil(emailAnterior, novoEmail);

    usuarioAtual = novoNome;
    emailUsuarioAtual = novoEmail;
    favoritos = obterFavoritos();
    notificacoes = obterNotificacoes();
    document.getElementById('profile-avatar-menu').src = avatarTemporarioSrc;
    document.getElementById('perfil-avatar-view').src = avatarTemporarioSrc;

    document.getElementById('welcome-text-menu').innerText = novoNome.toUpperCase();
    document.getElementById('perfil-nome-view').innerText = novoNome.toUpperCase();
    document.getElementById('display-private-email').innerText = novoEmail;
    document.getElementById('input-password').value = '';
    document.getElementById('input-password-confirm').value = '';
    feedback.innerText = 'Perfil atualizado com sucesso.';
    avisar('Perfil atualizado com sucesso.', 'sucesso');
    renderizarNotificacoes();
    renderizarResumoPerfil();
}

function migrarDadosPerfil(emailAnterior, novoEmail) {
    [FAVORITOS_KEY, NOTIFICACOES_KEY, PRECOS_CONHECIDOS_KEY].forEach(chave => {
        const dadoAnterior = localStorage.getItem(`${chave}:${emailAnterior}`);
        if (dadoAnterior !== null) localStorage.setItem(`${chave}:${novoEmail}`, dadoAnterior);
        localStorage.removeItem(`${chave}:${emailAnterior}`);
    });
}

function renderizarResumoPerfil() {
    const meusAnuncios = obterProdutosVenda().filter(produto => produto.vendedorEmail === emailUsuarioAtual || produto.vendedor === usuarioAtual).length;
    const minhasAvaliacoes = obterAvaliacoes().filter(avaliacao => avaliacao.vendedor === usuarioAtual);
    const reputacao = minhasAvaliacoes.length
        ? (minhasAvaliacoes.reduce((soma, avaliacao) => soma + avaliacao.nota, 0) / minhasAvaliacoes.length).toFixed(1)
        : 'Sem nota';
    document.getElementById('perfil-total-anuncios').innerText = meusAnuncios;
    document.getElementById('perfil-total-favoritos').innerText = favoritos.length;
    document.getElementById('perfil-reputacao').innerText = reputacao === 'Sem nota' ? reputacao : `★ ${reputacao}`;
}

function obterProdutosVenda() {
    try {
        const salvos = JSON.parse(localStorage.getItem(PRODUTOS_VENDA_KEY) || '[]');
        return Array.isArray(salvos) ? salvos : [];
    } catch (erro) {
        return [];
    }
}

function previewImagemVenda(evento) {
    const arquivo = evento.target.files[0];
    const preview = document.getElementById('venda-preview');
    if (!arquivo) {
        imagemVendaTemporaria = "";
        preview.innerHTML = '<span>A prévia da imagem aparecerá aqui</span>';
        return;
    }

    // Fotos de celular passam fácil de 5 MB e estouram o localStorage.
    if (arquivo.size > 3 * 1024 * 1024) {
        avisar('Imagem muito grande (máx. 3 MB). Escolha uma foto menor para o anúncio.', 'erro');
        evento.target.value = '';
        imagemVendaTemporaria = "";
        preview.innerHTML = '<span>Imagem descartada por tamanho. Escolha um arquivo de até 3 MB.</span>';
        return;
    }

    const leitor = new FileReader();
    leitor.onload = () => {
        imagemVendaTemporaria = leitor.result;
        preview.innerHTML = `<img src="${imagemVendaTemporaria}" alt="Prévia do produto anunciado">`;
    };
    leitor.readAsDataURL(arquivo);
}

function publicarProduto(evento) {
    evento.preventDefault();
    const produto = {
        id: Date.now(),
        nome: document.getElementById('venda-nome').value.trim(),
        desc: document.getElementById('venda-descricao').value.trim(),
        preco: parseFloat(document.getElementById('venda-preco').value),
        estoque: parseInt(document.getElementById('venda-estoque').value, 10),
        categoria: document.getElementById('venda-categoria').value,
        condicao: document.getElementById('venda-condicao').value,
        origem: document.getElementById('venda-origem').value.trim(),
        img: imagemVendaTemporaria,
        vendedor: usuarioAtual,
        vendedorEmail: emailUsuarioAtual
    };

    if (!produto.nome || !produto.desc || !produto.origem || !Number.isFinite(produto.preco) || produto.preco <= 0 || !Number.isFinite(produto.estoque) || produto.estoque < 1) {
        const feedback = document.getElementById('venda-feedback');
        feedback.innerText = 'Confira os campos do anúncio: nome, descrição, origem, preço maior que zero e quantidade a partir de 1.';
        avisar('Não foi possível publicar: revise os campos destacados.', 'erro');
        return;
    }

    // Sem imagem enviada, usava uma bandeira aleatória como foto do produto.
    if (!produto.img) produto.img = IMAGEM_PADRAO;

    const produtosVenda = obterProdutosVenda();
    produtosVenda.push(produto);
    salvarProdutosVenda(produtosVenda);
    produtos.push(produto);
    document.getElementById('form-venda').reset();
    imagemVendaTemporaria = "";
    document.getElementById('venda-preview').innerHTML = '<span>A prévia da imagem aparecerá aqui</span>';
    document.getElementById('venda-feedback').innerText = 'Item publicado com sucesso na vitrine!';
    avisar(`"${produto.nome}" entrou na vitrine por ${formatarPreco(produto.preco)}.`, 'sucesso');
    adicionarNotificacao(`Seu anúncio "${produto.nome}" está no ar.`, 'venda');
    renderizarVitrine();
    renderizarResumoPerfil();
    setTimeout(() => abrirAba('aba-vitrine'), 700);
}

// Grava os anúncios do usuário. O localStorage tem limite de ~5 MB e as fotos
// enviadas viram base64; sem este aviso o anúncio simplesmente não salvava.
function salvarProdutosVenda(lista) {
    try {
        localStorage.setItem(PRODUTOS_VENDA_KEY, JSON.stringify(lista));
        return true;
    } catch (erro) {
        console.error('Não foi possível salvar os anúncios:', erro);
        avisar('Armazenamento cheio. Tente publicar com uma imagem menor.', 'erro');
        return false;
    }
}

function obterPropostasTroca() {
    try {
        const salvas = JSON.parse(localStorage.getItem(PROPOSTAS_TROCA_KEY) || '[]');
        return Array.isArray(salvas) ? salvas : [];
    } catch (erro) {
        return [];
    }
}

function salvarPropostasTroca(propostas) {
    localStorage.setItem(PROPOSTAS_TROCA_KEY, JSON.stringify(propostas));
}

function prepararFormularioTroca() {
    const selectOfertado = document.getElementById('troca-item-ofertado');
    const selectDesejado = document.getElementById('troca-item-desejado');
    const meusItens = obterProdutosVenda().filter(produto => produto.vendedor === usuarioAtual && produto.estoque > 0);
    const opcoesDesejadas = produtos.filter(produto => produto.vendedor && produto.vendedor !== usuarioAtual && produto.estoque > 0);

    selectOfertado.innerHTML = meusItens.length
        ? meusItens.map(produto => `<option value="${produto.id}">${produto.nome} (${produto.estoque} disponível)</option>`).join('')
        : '<option value="" selected>Publique um item para iniciar uma troca</option>';
    selectOfertado.disabled = meusItens.length === 0;
    selectDesejado.innerHTML = opcoesDesejadas.length
        ? opcoesDesejadas.map(produto => `<option value="${produto.id}">${produto.nome}</option>`).join('')
        : '<option value="">Nenhum item de outro colecionador publicado</option>';
    selectDesejado.disabled = opcoesDesejadas.length === 0;
    document.querySelector('.troca-form button[type="submit"]').disabled = meusItens.length === 0 || opcoesDesejadas.length === 0;
}

function criarPropostaTroca(evento) {
    evento.preventDefault();
    const itemOfertado = produtos.find(produto => produto.id === Number(document.getElementById('troca-item-ofertado').value));
    const itemDesejado = produtos.find(produto => produto.id === Number(document.getElementById('troca-item-desejado').value));
    if (!itemOfertado || !itemDesejado) return;

    const propostas = obterPropostasTroca();
    propostas.push({
        id: Date.now(),
        proponente: usuarioAtual,
        proponenteEmail: emailUsuarioAtual,
        destinatario: itemDesejado.vendedor || 'Qualquer colecionador',
        destinatarioEmail: itemDesejado.vendedorEmail || '',
        itemOfertadoId: itemOfertado.id,
        itemOfertadoNome: itemOfertado.nome,
        itemDesejadoId: itemDesejado.id,
        itemDesejadoNome: itemDesejado.nome,
        mensagem: document.getElementById('troca-mensagem').value.trim(),
        status: 'pendente',
        data: new Date().toLocaleDateString('pt-BR')
    });
    salvarPropostasTroca(propostas);
    document.querySelector('.troca-form').reset();
    document.getElementById('troca-feedback').innerText = 'Proposta enviada para a central de negociações.';
    avisar('Proposta de troca enviada para a central de negociações.', 'sucesso');
    renderizarPropostasTroca();
}

function atualizarStatusProposta(id, status) {
    const propostas = obterPropostasTroca();
    const proposta = propostas.find(item => item.id === id);
    if (!proposta || proposta.destinatario !== usuarioAtual || proposta.status !== 'pendente') return;
    proposta.status = status;
    salvarPropostasTroca(propostas);
    if (proposta.proponenteEmail && proposta.proponenteEmail !== emailUsuarioAtual) {
        adicionarNotificacaoPara(proposta.proponenteEmail, `Sua proposta para ${proposta.itemDesejadoNome} foi ${status === 'aceita' ? 'aceita' : 'recusada'}.`, 'troca');
    } else {
        adicionarNotificacao(`A proposta de troca foi ${status === 'aceita' ? 'aceita' : 'recusada'}.`, 'troca');
    }
    avisar(status === 'aceita' ? 'Proposta aceita! Combine os detalhes pelo chat.' : 'Proposta recusada.', status === 'aceita' ? 'sucesso' : 'info');
    renderizarPropostasTroca();
}

function renderizarPropostasTroca() {
    const container = document.getElementById('lista-propostas-troca');
    if (!container) return;
    const propostas = obterPropostasTroca();
    if (propostas.length === 0) {
        container.innerHTML = htmlEstadoVazio({
            icone: '🔄',
            titulo: 'Nenhuma proposta por aqui ainda',
            texto: 'Publique um item da sua coleção e use o formulário acima para propor uma troca a outro torcedor.',
            acoes: '<button type="button" class="btn-salvar" onclick="abrirAba(\'aba-vender\')">PUBLICAR UM ITEM</button>'
        });
        return;
    }

    container.innerHTML = propostas.map(proposta => {
        const podeResponder = proposta.destinatario === usuarioAtual && proposta.status === 'pendente';
        const podeConversar = proposta.proponente === usuarioAtual || proposta.destinatario === usuarioAtual;
        const statusTexto = proposta.status === 'aceita' ? 'Aceita' : proposta.status === 'recusada' ? 'Recusada' : 'Aguardando resposta';
        const acoes = `${podeResponder ? `<button class="proposta-aceitar" onclick="atualizarStatusProposta(${proposta.id}, 'aceita')">ACEITAR</button><button class="proposta-recusar" onclick="atualizarStatusProposta(${proposta.id}, 'recusada')">RECUSAR</button>` : ''}${podeConversar ? `<button class="proposta-chat" onclick="abrirChatProposta(${proposta.id})">CONVERSAR</button>` : ''}`;
        return `
                    <article class="proposta-troca-card">
                        <div>
                            <h3>${escaparHtml(proposta.itemOfertadoNome)} <span aria-hidden="true">⇄</span> ${escaparHtml(proposta.itemDesejadoNome)}</h3>
                            <p><strong>${escaparHtml(proposta.proponente)}</strong> propôs esta troca em ${escaparHtml(proposta.data)}.</p>
                            ${proposta.mensagem ? `<p>“${escaparHtml(proposta.mensagem)}”</p>` : ''}
                            <span class="proposta-status">${statusTexto}</span>
                        </div>
                        ${acoes ? `<div class="proposta-acoes">${acoes}</div>` : ''}
                    </article>`;
    }).join('');
}

let propostaChatAtual = null;

function obterChatsTroca() {
    try {
        const salvos = JSON.parse(localStorage.getItem(CHATS_TROCA_KEY) || '{}');
        return salvos && typeof salvos === 'object' ? salvos : {};
    } catch (erro) {
        return {};
    }
}

function salvarChatsTroca(chats) {
    localStorage.setItem(CHATS_TROCA_KEY, JSON.stringify(chats));
}

function abrirChatProposta(id) {
    const proposta = obterPropostasTroca().find(item => item.id === id);
    if (!proposta || (proposta.proponente !== usuarioAtual && proposta.destinatario !== usuarioAtual)) return;

    propostaChatAtual = proposta;
    document.getElementById('chat-titulo').innerText = `${proposta.itemOfertadoNome} ⇄ ${proposta.itemDesejadoNome}`;
    renderizarMensagensChat();
    document.getElementById('chat-modal').classList.add('aberto');
    document.getElementById('chat-modal').setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-aberto');
    setTimeout(() => document.getElementById('chat-input').focus(), 100);
}

function renderizarMensagensChat() {
    const container = document.getElementById('chat-mensagens');
    const chats = obterChatsTroca();
    const mensagens = propostaChatAtual ? (chats[propostaChatAtual.id] || []) : [];
    if (mensagens.length === 0) {
        container.innerHTML = '<p class="chat-vazio">Comece a conversa para combinar os detalhes da troca.</p>';
        return;
    }
    container.innerHTML = mensagens.map(mensagem => `
                <div class="chat-mensagem ${mensagem.autor === usuarioAtual ? 'propria' : ''}">
                    <strong>${escaparHtml(mensagem.autor)}</strong>
                    <p>${escaparHtml(mensagem.texto)}</p>
                    <small>${escaparHtml(mensagem.data)}</small>
                </div>`).join('');
    container.scrollTop = container.scrollHeight;
}

function enviarMensagemChat(evento) {
    evento.preventDefault();
    if (!propostaChatAtual) return;
    const input = document.getElementById('chat-input');
    const texto = input.value.trim();
    if (!texto) return;

    const chats = obterChatsTroca();
    chats[propostaChatAtual.id] = chats[propostaChatAtual.id] || [];
    chats[propostaChatAtual.id].push({
        autor: usuarioAtual,
        texto,
        data: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    });
    salvarChatsTroca(chats);
    const destinatarioEmail = propostaChatAtual.proponenteEmail === emailUsuarioAtual ? propostaChatAtual.destinatarioEmail : propostaChatAtual.proponenteEmail;
    if (destinatarioEmail) adicionarNotificacaoPara(destinatarioEmail, `${usuarioAtual} respondeu à proposta ${propostaChatAtual.itemOfertadoNome} ⇄ ${propostaChatAtual.itemDesejadoNome}.`, 'chat');
    input.value = '';
    renderizarMensagensChat();
}

function fecharChat() {
    document.getElementById('chat-modal').classList.remove('aberto');
    document.getElementById('chat-modal').setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-aberto');
    propostaChatAtual = null;
}

function obterAvaliacoes() {
    try {
        const salvas = JSON.parse(localStorage.getItem(AVALIACOES_KEY) || '[]');
        return Array.isArray(salvas) ? salvas : [];
    } catch (erro) {
        return [];
    }
}

function salvarAvaliacoes(avaliacoes) {
    localStorage.setItem(AVALIACOES_KEY, JSON.stringify(avaliacoes));
}

function resumoAvaliacaoProduto(id) {
    const avaliacoes = obterAvaliacoes().filter(avaliacao => avaliacao.produtoId === id);
    if (avaliacoes.length === 0) return null;
    const media = avaliacoes.reduce((soma, avaliacao) => soma + avaliacao.nota, 0) / avaliacoes.length;
    return { media, total: avaliacoes.length };
}

function htmlAvaliacaoProduto(id) {
    const resumo = resumoAvaliacaoProduto(id);
    if (!resumo) return '<div class="avaliacao-media"><span>Ainda sem avaliações</span></div>';
    return `<div class="avaliacao-media">★ ${resumo.media.toFixed(1)} <span>(${resumo.total} ${resumo.total === 1 ? 'avaliação' : 'avaliações'})</span></div>`;
}

let pedidoAvaliacaoAtual = null;
let notaAvaliacaoAtual = 0;

function abrirAvaliacao(pedidoId) {
    const pedido = pedidos.find(item => item.id === pedidoId);
    if (!pedido) return;
    pedidoAvaliacaoAtual = pedido;
    notaAvaliacaoAtual = 0;
    document.getElementById('avaliacao-titulo').innerText = `Avaliar pedido #${pedido.id}`;

    const produtosDoPedido = pedido.produtosIds
        ? pedido.produtosIds.map(id => produtos.find(produto => produto.id === id)).filter(Boolean)
        : produtos.filter(produto => pedido.itens && pedido.itens.includes(produto.nome));
    const opcoes = produtosDoPedido.length ? produtosDoPedido : produtos;
    const select = document.getElementById('avaliacao-produto');
    select.innerHTML = opcoes.map(produto => `<option value="${produto.id}">${produto.nome}</option>`).join('');
    atualizarVendedorAvaliacao();
    document.getElementById('avaliacao-comentario').value = '';
    document.getElementById('avaliacao-feedback').innerText = '';
    selecionarNota(0);
    document.getElementById('avaliacao-modal').classList.add('aberto');
    document.getElementById('avaliacao-modal').setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-aberto');
}

function atualizarVendedorAvaliacao() {
    const produto = produtos.find(item => item.id === Number(document.getElementById('avaliacao-produto').value));
    const vendedor = produto?.vendedor || 'Mercado da Copa';
    const avaliacoesVendedor = obterAvaliacoes().filter(avaliacao => avaliacao.vendedor === vendedor);
    const media = avaliacoesVendedor.length
        ? ` · ★ ${(avaliacoesVendedor.reduce((soma, avaliacao) => soma + avaliacao.nota, 0) / avaliacoesVendedor.length).toFixed(1)} de reputação`
        : '';
    document.getElementById('avaliacao-vendedor').innerText = `${vendedor}${media}`;
}

function selecionarNota(nota) {
    notaAvaliacaoAtual = nota;
    document.querySelectorAll('.avaliacao-estrelas button').forEach(botao => {
        botao.classList.toggle('selecionada', Number(botao.dataset.nota) <= nota);
    });
}

function salvarAvaliacao() {
    if (!pedidoAvaliacaoAtual || notaAvaliacaoAtual === 0) {
        document.getElementById('avaliacao-feedback').innerText = 'Escolha uma nota de 1 a 5 estrelas.';
        return;
    }
    const comentario = document.getElementById('avaliacao-comentario').value.trim();
    if (!comentario) {
        document.getElementById('avaliacao-feedback').innerText = 'Escreva um comentário sobre sua experiência.';
        return;
    }

    const produtoId = Number(document.getElementById('avaliacao-produto').value);
    const produto = produtos.find(item => item.id === produtoId);
    const avaliacoes = obterAvaliacoes();
    const existente = avaliacoes.find(avaliacao => avaliacao.pedidoId === pedidoAvaliacaoAtual.id && avaliacao.produtoId === produtoId && avaliacao.avaliador === usuarioAtual);
    const novaAvaliacao = {
        id: existente?.id || Date.now(),
        pedidoId: pedidoAvaliacaoAtual.id,
        produtoId,
        vendedor: produto?.vendedor || 'Mercado da Copa',
        avaliador: usuarioAtual,
        nota: notaAvaliacaoAtual,
        comentario,
        data: new Date().toLocaleDateString('pt-BR')
    };
    if (existente) {
        Object.assign(existente, novaAvaliacao);
    } else {
        avaliacoes.push(novaAvaliacao);
    }
    salvarAvaliacoes(avaliacoes);
    avisar(`Avaliação registrada: ${notaAvaliacaoAtual} ★ para ${produto?.vendedor || 'Mercado da Copa'}.`, 'sucesso');
    fecharAvaliacao();
    renderizarVitrine();
    renderizarPedidos();
    renderizarResumoPerfil();
}

function fecharAvaliacao() {
    document.getElementById('avaliacao-modal').classList.remove('aberto');
    document.getElementById('avaliacao-modal').setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-aberto');
    pedidoAvaliacaoAtual = null;
}

// ================== NAVEGAÇÃO E MENUS ==================
function abrirMenuMobile() {
    document.getElementById('mobile-menu').classList.add('ativo');
    document.getElementById('menu-btn').setAttribute('aria-expanded', 'true');
}
function fecharMenuMobile() {
    document.getElementById('mobile-menu').classList.remove('ativo');
    document.getElementById('menu-btn').setAttribute('aria-expanded', 'false');
}

function abrirAba(idAba) {
    const destino = document.getElementById(idAba);
    if (!destino) return;
    document.querySelectorAll('.secao-aba').forEach(aba => aba.classList.remove('ativa'));
    destino.classList.add('ativa');
    if (idAba === 'aba-trocas') {
        prepararFormularioTroca();
        renderizarPropostasTroca();
    }
    fecharMenuMobile();
    // Ao trocar de aba a rolagem ficava na posição anterior, dando a impressão
    // de que a página não mudou nada.
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'smooth' });
}

function sair() {
    // Antes era um location.reload(), que obrigava o usuário a assistir ao vídeo
    // de abertura de novo só para trocar de conta.
    const carrinhoLateral = document.getElementById('carrinho-lateral');
    if (carrinhoLateral) carrinhoLateral.classList.remove('aberto');
    document.body.classList.remove('modal-aberto');
    fecharMenuMobile();

    document.getElementById('main-site').style.display = 'none';
    document.getElementById('starlight-message').style.display = 'none';
    const intro = document.getElementById('video-intro');
    if (intro) intro.style.display = 'none';
    const auth = document.getElementById('auth-container');
    if (auth) auth.style.display = 'flex';

    usuarioAtual = 'TORCEDOR_10';
    emailUsuarioAtual = '';
    carrinho = [];
    pedidos = [];
    favoritos = [];
    notificacoes = [];
    document.getElementById('log-pass').value = '';
    document.getElementById('log-email').value = '';
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
    limparFeedbackAuth();
    setTimeout(() => document.getElementById('log-email').focus(), 120);
    avisar('Você saiu da conta. Até a próxima partida!', 'info');
}

function toggleCarrinho() {
    document.getElementById('carrinho-lateral').classList.toggle('aberto');
    fecharMenuMobile();
}

// ================== RENDERIZAR VITRINE ==================
function renderizarVitrine() {
    const grid = document.getElementById('container-produtos');
    grid.setAttribute('aria-busy', 'false');
    if (produtos.length === 0) {
        grid.innerHTML = htmlEstadoVazio({
            icone: '📦',
            titulo: 'Catálogo indisponível no momento',
            texto: 'Não conseguimos carregar nenhuma peça. Recarregue a página para tentar de novo.',
            acoes: '<button type="button" class="btn-salvar" onclick="location.reload()">RECARREGAR</button>'
        });
        return;
    }
    document.getElementById('home-contagem-produtos').innerText = `${produtos.length} artigos disponíveis agora`;
    preencherCategorias();
    renderizarDestaques();
    renderizarHeroVitrine();
    renderizarFavoritos();
    filtrarVitrine();
    renderizarResumoPerfil();
}

// Pequenas vitrines reais dentro da capa: antes o bloco de destaque mostrava
// apenas um emoji de bola, sem nenhum produto à vista.
function renderizarHeroVitrine() {
    const container = document.getElementById('hero-vitrine');
    if (!container) return;
    const destaques = produtos.slice(0, 3);
    if (!destaques.length) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = destaques.map(produto => `
        <button type="button" class="hero-mini" onclick="abrirProdutoModal(${produto.id})"
            aria-label="Ver detalhes de ${escaparHtml(produto.nome)}">
            <img ${atributoImagem(produto.img, produto.nome)}>
            <span>${escaparHtml(produto.nome)}<b>${formatarPreco(produto.preco)}</b></span>
        </button>`).join('');
}

function obterFavoritos() {
    try {
        const salvos = JSON.parse(localStorage.getItem(`${FAVORITOS_KEY}:${emailUsuarioAtual}`) || '[]');
        return Array.isArray(salvos) ? salvos : [];
    } catch (erro) {
        return [];
    }
}

function salvarFavoritos() {
    if (!emailUsuarioAtual) return;
    localStorage.setItem(`${FAVORITOS_KEY}:${emailUsuarioAtual}`, JSON.stringify(favoritos));
}

function obterNotificacoes() {
    try {
        const salvas = JSON.parse(localStorage.getItem(`${NOTIFICACOES_KEY}:${emailUsuarioAtual}`) || '[]');
        return Array.isArray(salvas) ? salvas : [];
    } catch (erro) {
        return [];
    }
}

function salvarNotificacoes() {
    if (emailUsuarioAtual) localStorage.setItem(`${NOTIFICACOES_KEY}:${emailUsuarioAtual}`, JSON.stringify(notificacoes.slice(0, 40)));
}

function adicionarNotificacao(mensagem, tipo = 'sistema') {
    notificacoes.unshift({ id: Date.now(), mensagem, tipo, lida: false, data: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) });
    salvarNotificacoes();
    renderizarNotificacoes();
}

function adicionarNotificacaoPara(email, mensagem, tipo = 'sistema') {
    if (!email) return;
    const chave = `${NOTIFICACOES_KEY}:${email.toLowerCase()}`;
    let lista = [];
    try { lista = JSON.parse(localStorage.getItem(chave) || '[]'); } catch (erro) { lista = []; }
    lista.unshift({ id: Date.now(), mensagem, tipo, lida: false, data: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) });
    localStorage.setItem(chave, JSON.stringify(lista.slice(0, 40)));
}

function renderizarNotificacoes() {
    const lista = document.getElementById('lista-notificacoes');
    const badge = document.getElementById('notificacoes-badge');
    if (!lista || !badge) return;
    const naoLidas = notificacoes.filter(notificacao => !notificacao.lida).length;
    badge.innerText = naoLidas > 9 ? '9+' : naoLidas;
    badge.dataset.zero = naoLidas === 0 ? 'true' : 'false';
    lista.innerHTML = notificacoes.length
        ? notificacoes.map(notificacao => `<div class="notificacao-item ${notificacao.lida ? '' : 'nao-lida'}">${escaparHtml(notificacao.mensagem)}<small>${escaparHtml(notificacao.data)}</small></div>`).join('')
        : '<p class="notificacoes-vazias">Você não tem notificações novas.</p>';
}

function toggleNotificacoes() {
    const painel = document.getElementById('notificacoes-painel');
    const aberto = painel.classList.toggle('aberto');
    painel.setAttribute('aria-hidden', String(!aberto));
    document.getElementById('notificacoes-btn').setAttribute('aria-expanded', String(aberto));
}

function marcarNotificacoesLidas() {
    notificacoes.forEach(notificacao => notificacao.lida = true);
    salvarNotificacoes();
    renderizarNotificacoes();
}

function verificarAlteracoesDePreco() {
    let precosAnteriores = {};
    try { precosAnteriores = JSON.parse(localStorage.getItem(`${PRECOS_CONHECIDOS_KEY}:${emailUsuarioAtual}`) || '{}'); } catch (erro) { precosAnteriores = {}; }
    const precosAtuais = {};
    produtos.forEach(produto => {
        precosAtuais[produto.id] = Number(produto.preco);
        if (favoritos.includes(produto.id) && precosAnteriores[produto.id] !== undefined && precosAnteriores[produto.id] !== Number(produto.preco)) {
            adicionarNotificacao(`O preço de ${produto.nome} mudou para ${formatarPreco(produto.preco)}.`, 'preco');
        }
    });
    localStorage.setItem(`${PRECOS_CONHECIDOS_KEY}:${emailUsuarioAtual}`, JSON.stringify(precosAtuais));
}

function produtoFavoritado(id) {
    return favoritos.includes(id);
}

function toggleFavorito(id) {
    if (produtoFavoritado(id)) {
        favoritos = favoritos.filter(favoritoId => favoritoId !== id);
    } else {
        favoritos.push(id);
    }
    salvarFavoritos();
    renderizarVitrine();
}

function renderizarFavoritos() {
    const container = document.getElementById('produtos-favoritos');
    const produtosFavoritos = favoritos
        .map(id => produtos.find(produto => produto.id === id))
        .filter(Boolean);
    document.getElementById('contagem-favoritos').innerText = `${produtosFavoritos.length} ${produtosFavoritos.length === 1 ? 'item salvo' : 'itens salvos'}`;

    if (produtosFavoritos.length === 0) {
        container.innerHTML = htmlEstadoVazio({
            icone: '♡',
            titulo: 'Sua lista de desejos está vazia',
            texto: 'Toque no coração de qualquer peça da vitrine para acompanhar preço e disponibilidade por aqui.',
            acoes: '<button type="button" class="btn-salvar" onclick="irParaProdutos()">VER A VITRINE</button>'
        });
        return;
    }
    container.innerHTML = produtosFavoritos.map(produto => cardProdutoHome(produto, 'SALVO NOS FAVORITOS')).join('');
}

function irParaFavoritos() {
    fecharMenuMobile();
    abrirAba('aba-vitrine');
    document.getElementById('secao-favoritos').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cardProdutoHome(produto, etiqueta) {
    const badge = produto.selo ? produto.selo
        : (produto.rarity && String(produto.rarity).toLowerCase().includes('lend') ? '🏆 RARIDADE: LENDÁRIA'
        : (produto.maisVendido || produto.mostSold ? '🔥 MAIS VENDIDO' : ''));

    const badgeHtml = badge ? `<div class="home-produto-badge">${badge}</div>` : '';

    return `
                <article class="home-produto-card">
                    <button class="favorito-botao ${produtoFavoritado(produto.id) ? 'ativo' : ''}" onclick="toggleFavorito(${produto.id})" aria-label="${produtoFavoritado(produto.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}" aria-pressed="${produtoFavoritado(produto.id)}">${produtoFavoritado(produto.id) ? '♥' : '♡'}</button>
                    ${badgeHtml}
                    <img ${atributoImagem(produto.img, produto.nome)}>
                    <div class="home-produto-info">
                        <span class="secao-kicker">${escaparHtml(etiqueta)}</span>
                        <h3>${escaparHtml(produto.nome)}</h3>
                        ${htmlAvaliacaoProduto(produto.id)}
                        <div class="home-produto-meta">
                            <span class="home-produto-preco">${formatarPreco(produto.preco)}</span>
                            <button class="home-add-btn" onclick="abrirProdutoModal(${produto.id})">DETALHES</button>
                        </div>
                    </div>
                </article>`;
}

// Marca o nível de estoque com cor (antes tudo era dourado, inclusive ESGOTADO).
function classeEstoque(estoque) {
    const quantidade = Number(estoque) || 0;
    if (quantidade <= 0) return 'estoque-esgotado';
    if (quantidade <= 2) return 'estoque-baixo';
    return 'estoque-ok';
}

function htmlEstoque(estoque) {
    const quantidade = Number(estoque) || 0;
    const texto = quantidade > 0 ? `Estoque: ${quantidade}` : 'ESGOTADO';
    return `<span class="produto-estoque ${classeEstoque(quantidade)}">${texto}</span>`;
}

// Estado vazio reutilizável: explica o que aconteceu e oferece a saída.
function htmlEstadoVazio({ icone = '🔍', titulo, texto, acoes = '' }) {
    return `
        <div class="empty-state">
            <span class="empty-icone" aria-hidden="true">${icone}</span>
            <h3>${escaparHtml(titulo)}</h3>
            <p>${escaparHtml(texto)}</p>
            ${acoes ? `<div class="empty-acoes">${acoes}</div>` : ''}
        </div>`;
}

function renderizarDestaques() {
    const maisVendidos = produtos.slice(0, 4);
    const historicos = produtos.filter(produto => /1970|hist|retro|medalha|copa/i.test(`${produto.nome} ${produto.desc || ''}`));
    const achadosHistoricos = (historicos.length >= 4 ? historicos : produtos).slice(0, 4);
    const ofertas = [...produtos].sort((a, b) => parseFloat(a.preco) - parseFloat(b.preco)).slice(0, 4);

    document.getElementById('produtos-mais-vendidos').innerHTML = maisVendidos.map(produto => cardProdutoHome(produto, 'MAIS VENDIDO')).join('');
    document.getElementById('produtos-historicos').innerHTML = achadosHistoricos.map(produto => cardProdutoHome(produto, 'ACHADO HISTÓRICO')).join('');
    document.getElementById('produtos-ofertas').innerHTML = ofertas.map(produto => cardProdutoHome(produto, 'OFERTA DA RODADA')).join('');
}

let produtoModalAtual = null;

function abrirProdutoModal(id) {
    const produto = produtos.find(item => item.id === id);
    if (!produto) return;

    produtoModalAtual = produto;
    const imagemModal = document.getElementById('modal-produto-imagem');
    imagemModal.onerror = () => { imagemModal.onerror = null; imagemModal.src = IMAGEM_PADRAO; };
    imagemModal.src = produto.img || IMAGEM_PADRAO;
    imagemModal.alt = produto.nome;
    document.getElementById('modal-produto-categoria').innerText = produto.categoria || 'Colecionáveis';
    document.getElementById('modal-produto-nome').innerText = produto.nome;
    document.getElementById('modal-produto-descricao').innerText = produto.desc || 'Artigo selecionado do acervo Mercado da Copa.';
    document.getElementById('modal-produto-preco').innerText = formatarPreco(produto.preco);
    document.getElementById('modal-produto-estoque').innerText = produto.estoque > 0 ? `${produto.estoque} unidade(s)` : 'Esgotado';
    document.getElementById('modal-produto-condicao').innerText = produto.condicao || 'Boa';
    document.getElementById('modal-produto-origem').innerText = produto.origem || 'Acervo Mercado da Copa';

    const botao = document.getElementById('modal-produto-comprar');
    botao.disabled = produto.estoque <= 0;
    botao.innerText = produto.estoque > 0 ? 'ADICIONAR À SACOLA' : 'PRODUTO ESGOTADO';
    document.getElementById('produto-modal').classList.add('aberto');
    document.getElementById('produto-modal').setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-aberto');
}

function fecharProdutoModal() {
    document.getElementById('produto-modal').classList.remove('aberto');
    document.getElementById('produto-modal').setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-aberto');
    produtoModalAtual = null;
}

function adicionarProdutoModal() {
    if (!produtoModalAtual || produtoModalAtual.estoque <= 0) return;
    addCarrinho(produtoModalAtual.id);
    fecharProdutoModal();
}

document.getElementById('produto-modal').addEventListener('click', evento => {
    if (evento.target.id === 'produto-modal') fecharProdutoModal();
});

document.getElementById('chat-modal').addEventListener('click', evento => {
    if (evento.target.id === 'chat-modal') fecharChat();
});

document.getElementById('avaliacao-modal').addEventListener('click', evento => {
    if (evento.target.id === 'avaliacao-modal') fecharAvaliacao();
});

document.addEventListener('keydown', evento => {
    if (evento.key !== 'Escape') return;
    fecharProdutoModal();
    fecharChat();
    fecharAvaliacao();
});

function irParaProdutos() {
    document.getElementById('todos-produtos').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function filtrarPorTexto(texto) {
    document.getElementById('busca-produto').value = texto;
    filtrarVitrine();
    irParaProdutos();
}

function ordenarPorMenorPreco() {
    document.getElementById('ordenacao-produto').value = 'menor-preco';
    filtrarVitrine();
    irParaProdutos();
}

// Seleções reconhecidas no catálogo (nome, origem ou descrição do item).
const SELECOES_CONHECIDAS = [
    { chave: 'Brasil', bandeira: '🇧🇷', termos: ['brasil', 'canarinho'] },
    { chave: 'Argentina', bandeira: '🇦🇷', termos: ['argentina'] },
    { chave: 'França', bandeira: '🇫🇷', termos: ['frança', 'franca'] },
    { chave: 'Holanda', bandeira: '🇳🇱', termos: ['holanda', 'holand'] },
    { chave: 'Alemanha', bandeira: '🇩🇪', termos: ['alemanha'] },
    { chave: 'Itália', bandeira: '🇮🇹', termos: ['itália', 'italia'] },
    { chave: 'Espanha', bandeira: '🇪🇸', termos: ['espanha'] },
    { chave: 'Inglaterra', bandeira: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', termos: ['inglaterra'] },
    { chave: 'Catar', bandeira: '🇶🇦', termos: ['catar', 'qatar'] },
    { chave: 'África do Sul', bandeira: '🇿🇦', termos: ['áfrica do sul', 'africa do sul'] },
    { chave: 'México', bandeira: '🇲🇽', termos: ['méxico', 'mexico'] },
    { chave: 'Estados Unidos', bandeira: '🇺🇸', termos: ['estados unidos', 'eua'] },
    { chave: 'Suécia', bandeira: '🇸🇪', termos: ['suécia', 'suecia'] }
];

function selecaoDoProduto(produto) {
    const texto = `${produto.nome || ''} ${produto.origem || ''} ${produto.desc || ''}`.toLowerCase();
    return SELECOES_CONHECIDAS.find(selecao => selecao.termos.some(termo => texto.includes(termo))) || null;
}

function selecoesDoCatalogo() {
    const presentes = new Set();
    produtos.forEach(produto => {
        const selecao = selecaoDoProduto(produto);
        if (selecao) presentes.add(selecao.chave);
    });
    return SELECOES_CONHECIDAS.filter(selecao => presentes.has(selecao.chave));
}

function selecionarSelecao(chave) {
    const sel = document.getElementById('filtro-selecao');
    if (!sel) return;
    const opcao = Array.from(sel.options).find(o => o.value === chave);
    if (!opcao) return;
    opcao.selected = !opcao.selected;
    renderizarChipsSelecoes(selecoesDoCatalogo());
    filtrarVitrine();
}

function renderizarChipsSelecoes(selecoes) {
    const container = document.getElementById('chips-selecoes');
    const sel = document.getElementById('filtro-selecao');
    if (!container) return;
    const ativas = sel ? Array.from(sel.selectedOptions).map(o => o.value) : [];
    if (!selecoes.length) {
        container.innerHTML = '<span class="chip-vazio">Nenhuma seleção identificada no catálogo.</span>';
        return;
    }
    container.innerHTML = selecoes.map(selecao => `
        <button type="button" class="chip" aria-pressed="${ativas.includes(selecao.chave)}"
            onclick="selecionarSelecao('${escaparHtml(selecao.chave)}')">
            <span aria-hidden="true">${selecao.bandeira}</span>${escaparHtml(selecao.chave)}
        </button>`).join('');
}

function preencherCategorias() {
    const filtro = document.getElementById('filtro-categoria');
    const categoriaAtual = filtro.value;
    const categorias = [...new Set(produtos.map(p => p.categoria || 'Outros'))].sort();
    filtro.innerHTML = '<option value="todas">Todas as categorias</option>' + categorias.map(categoria => `<option value="${categoria}">${categoria}</option>`).join('');
    filtro.value = categorias.includes(categoriaAtual) ? categoriaAtual : 'todas';

    // Filtro "Seleções": antes ele era preenchido com as CATEGORIAS (cópia do
    // filtro ao lado) e não filtrava nada de diferente. Agora lista as seleções
    // realmente presentes no catálogo, com bandeira e chips clicáveis.
    const selecoesDisponiveis = selecoesDoCatalogo();
    const sel = document.getElementById('filtro-selecao');
    if (sel) {
        const selecionadas = Array.from(sel.selectedOptions || []).map(o => o.value);
        sel.innerHTML = selecoesDisponiveis
            .map(s => `<option value="${escaparHtml(s.chave)}">${escaparHtml(s.chave)}</option>`)
            .join('');
        Array.from(sel.options).forEach(o => { o.selected = selecionadas.includes(o.value); });
    }
    renderizarChipsSelecoes(selecoesDisponiveis);

    // preencher anos extraídos do nome/descrição/origem
    const anoSet = new Set();
    const anoRegex = /19\d{2}|20\d{2}/g;
    produtos.forEach(p => {
        const fonte = `${p.origem || ''} ${p.nome || ''} ${p.desc || ''}`;
        const found = fonte.match(anoRegex);
        if (found) found.forEach(a => anoSet.add(a));
    });
    const anos = [...anoSet].sort((a,b) => b - a);
    const filtroAno = document.getElementById('filtro-ano');
    if (filtroAno) {
        filtroAno.innerHTML = '<option value="todas">Todos os anos</option>' + anos.map(a => `<option value="${a}">${a}</option>`).join('');
    }

    // preencher tamanhos (se houver)
    const tamanhos = [...new Set(produtos.map(p => (p.tamanho || p.size || '').toString()).filter(Boolean))].sort();
    const filtroTam = document.getElementById('filtro-tamanho');
    if (filtroTam) {
        filtroTam.innerHTML = '<option value="todos">Todos os tamanhos</option>' + tamanhos.map(t => `<option value="${t}">${t}</option>`).join('');
    }

    // ajustar range de preço com base no maior preço do catálogo
    const maxPreco = Math.ceil(Math.max(0, ...produtos.map(p => Number(p.preco) || 0)) / 10) * 10 || 1000;
    const rangeMin = document.getElementById('preco-range-min');
    const rangeMax = document.getElementById('preco-range-max');
    const rangeLabel = document.getElementById('preco-range-label');
    if (rangeMin && rangeMax && rangeLabel) {
        rangeMin.max = maxPreco;
        rangeMax.max = maxPreco;
        if (Number(rangeMax.value) > maxPreco) rangeMax.value = maxPreco;
        atualizarRangePreco();
    }
}

function filtrarVitrine() {
    const busca = document.getElementById('busca-produto').value.trim().toLowerCase();
    const categoria = document.getElementById('filtro-categoria').value;
    const condicao = document.getElementById('filtro-condicao').value;
    const ordenacao = document.getElementById('ordenacao-produto').value;
    const somenteDisponiveis = document.getElementById('somente-disponiveis') && document.getElementById('somente-disponiveis').checked;

    // preço via slider (se presente) senão fallback para inputs numéricos
    const rangeMinEl = document.getElementById('preco-range-min');
    const rangeMaxEl = document.getElementById('preco-range-max');
    let precoMinimo = NaN, precoMaximo = NaN;
    if (rangeMinEl && rangeMaxEl) {
        // Number('0') é falsy: usar || aqui fazia o filtro ignorar o teto quando
        // o usuário arrastava o slider até zero.
        precoMinimo = Number(rangeMinEl.value) || 0;
        precoMaximo = rangeMaxEl.value === '' ? Infinity : Number(rangeMaxEl.value);
        if (precoMinimo > precoMaximo) { const tmp = precoMinimo; precoMinimo = precoMaximo; precoMaximo = tmp; }
    } else {
        precoMinimo = parseFloat(document.getElementById('preco-minimo').value);
        precoMaximo = parseFloat(document.getElementById('preco-maximo').value);
    }

    // seleção multi
    const sel = document.getElementById('filtro-selecao');
    const selecaoValues = sel ? Array.from(sel.selectedOptions).map(o => o.value) : [];

    const anoFiltro = document.getElementById('filtro-ano') ? document.getElementById('filtro-ano').value : 'todas';
    const tamanhoFiltro = document.getElementById('filtro-tamanho') ? document.getElementById('filtro-tamanho').value : 'todos';

    let produtosVisiveis = produtos.filter(p => {
        const texto = `${p.nome} ${p.desc || ''} ${p.categoria || ''}`.toLowerCase();
        const preco = parseFloat(p.preco) || 0;
        const condicaoProduto = (p.condicao || '').toLowerCase();
        const atendeCondicao = condicao === 'todas' ||
            (condicao === 'novo' && condicaoProduto.includes('novo')) ||
            (condicao === 'usado' && !condicaoProduto.includes('novo'));

        const atendePrecoMinimo = Number.isNaN(precoMinimo) || preco >= precoMinimo;
        const atendePrecoMaximo = Number.isNaN(precoMaximo) || preco <= precoMaximo;
        const atendeCategoria = categoria === 'todas' || (p.categoria || 'Outros') === categoria;
        // Antes comparava a seleção com a CATEGORIA (os dois filtros eram iguais).
        const selecaoProduto = selecaoDoProduto(p);
        const atendeSelecao = selecaoValues.length === 0 ||
            (selecaoProduto && selecaoValues.includes(selecaoProduto.chave));
        const atendeAno = anoFiltro === 'todas' || (String(p.ano || '').includes(anoFiltro) || String(p.origem || '').includes(anoFiltro) || String(p.nome || '').includes(anoFiltro));
        const atendeTamanho = tamanhoFiltro === 'todos' || String(p.tamanho || p.size || '') === tamanhoFiltro;
        const atendeDisponibilidade = !somenteDisponiveis || (p.estoque && p.estoque > 0);

        return texto.includes(busca) && atendeCategoria && atendeSelecao && atendeCondicao && atendePrecoMinimo && atendePrecoMaximo && atendeAno && atendeTamanho && atendeDisponibilidade;
    });

    if (ordenacao === 'menor-preco') produtosVisiveis.sort((a, b) => a.preco - b.preco);
    if (ordenacao === 'maior-preco') produtosVisiveis.sort((a, b) => b.preco - a.preco);
    if (ordenacao === 'nome') produtosVisiveis.sort((a, b) => a.nome.localeCompare(b.nome));

    const grid = document.getElementById('container-produtos');
    grid.setAttribute('aria-busy', 'false');

    const contador = document.getElementById('vitrine-resultado');
    if (contador) {
        const total = produtos.length;
        const ativos = contarFiltrosAtivos();
        contador.innerHTML = `Mostrando <strong>${produtosVisiveis.length}</strong> de ${total} ${total === 1 ? 'artigo' : 'artigos'}` +
            (ativos ? ` · ${ativos} ${ativos === 1 ? 'filtro ativo' : 'filtros ativos'}` : '') +
            (ativos ? ' · <button type="button" class="link-filtro" onclick="limparFiltros()">limpar filtros</button>' : '');
    }

    if (produtosVisiveis.length === 0) {
        grid.innerHTML = htmlEstadoVazio({
            icone: '🔍',
            titulo: 'Nenhum artigo encontrado',
            texto: 'Não achamos nenhuma peça com esses filtros. Tente ampliar a faixa de preço ou remover a busca por seleção.',
            acoes: `
                <button type="button" class="btn-salvar" onclick="limparFiltros()">LIMPAR FILTROS</button>
                <button type="button" class="btn-detalhes" onclick="filtrarPorTexto('camisa')">VER CAMISAS</button>`
        });
        return;
    }

    grid.innerHTML = produtosVisiveis.map(p => {
        const badge = p.selo ? p.selo : (p.rarity && String(p.rarity).toLowerCase().includes('lend') ? '🏆 RARIDADE: LENDÁRIA' : (p.maisVendido || p.mostSold ? '🔥 MAIS VENDIDO' : ''));
        const badgeHtml = badge ? `<div class="produto-badge">${escaparHtml(badge)}</div>` : '';
        const selecao = selecaoDoProduto(p);
        const favoritado = produtoFavoritado(p.id);
        const esgotado = !(p.estoque > 0);
        return `
                <div class="produto-card">
                    <button class="favorito-botao ${favoritado ? 'ativo' : ''}" onclick="toggleFavorito(${p.id})" aria-label="${favoritado ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}" aria-pressed="${favoritado}">${favoritado ? '♥' : '♡'}</button>
                    <div class="produto-img-container">
                        ${badgeHtml}
                        <img ${atributoImagem(p.img, p.nome)}>
                    </div>
                    <div class="produto-info">
                        <h3 class="produto-titulo">${escaparHtml(p.nome)}</h3>
                        <p class="produto-desc">${escaparHtml(p.desc)}</p>
                        ${htmlAvaliacaoProduto(p.id)}
                        <div class="produto-resumo">
                            <span>${escaparHtml(p.categoria || 'Colecionáveis')}</span>
                            ${selecao ? `<span>${selecao.bandeira} ${escaparHtml(selecao.chave)}</span>` : ''}
                            <span>${escaparHtml(p.condicao || 'Boa')}</span>
                        </div>

                        <div class="produto-meta">
                            <span class="produto-preco">${formatarPreco(p.preco)}</span>
                            ${htmlEstoque(p.estoque)}
                        </div>

                        <div class="produto-acoes">
                            <button class="btn-detalhes" onclick="abrirProdutoModal(${p.id})">VER DETALHES</button>
                            <button class="btn-store" ${esgotado ? 'disabled' : ''}
                                onclick="addCarrinho(${p.id})">
                                ${esgotado ? 'ESGOTADO' : 'ADICIONAR À SACOLA'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
    }).join('');
}

// Conta quantos filtros estão fora do padrão, para o usuário entender por que
// a vitrine está mostrando menos itens do que o catálogo completo.
function contarFiltrosAtivos() {
    let total = 0;
    const valor = id => (document.getElementById(id)?.value || '').trim();
    if (valor('busca-produto')) total++;
    if (valor('filtro-categoria') && valor('filtro-categoria') !== 'todas') total++;
    if (valor('filtro-condicao') && valor('filtro-condicao') !== 'todas') total++;
    if (valor('filtro-ano') && valor('filtro-ano') !== 'todas') total++;
    if (valor('filtro-tamanho') && valor('filtro-tamanho') !== 'todos') total++;
    const selecao = document.getElementById('filtro-selecao');
    if (selecao) total += selecao.selectedOptions.length;
    if (document.getElementById('somente-disponiveis')?.checked) total++;
    const maximo = document.getElementById('preco-range-max');
    if (maximo && Number(maximo.value) < Number(maximo.max)) total++;
    const minimo = document.getElementById('preco-range-min');
    if (minimo && Number(minimo.value) > Number(minimo.min || 0)) total++;
    return total;
}

function limparFiltros() {
    document.getElementById('busca-produto').value = '';
    document.getElementById('filtro-categoria').value = 'todas';
    document.getElementById('filtro-condicao').value = 'todas';
    const rangeMin = document.getElementById('preco-range-min');
    const rangeMax = document.getElementById('preco-range-max');
    if (rangeMin && rangeMax) { rangeMin.value = rangeMin.min || 0; rangeMax.value = rangeMax.max || 1000; atualizarRangePreco(); }
    else { if (document.getElementById('preco-minimo')) document.getElementById('preco-minimo').value = ''; if (document.getElementById('preco-maximo')) document.getElementById('preco-maximo').value = ''; }
    const sel = document.getElementById('filtro-selecao'); if (sel) Array.from(sel.options).forEach(o => o.selected = false);
    if (document.getElementById('filtro-ano')) document.getElementById('filtro-ano').value = 'todas';
    if (document.getElementById('filtro-tamanho')) document.getElementById('filtro-tamanho').value = 'todos';
    if (document.getElementById('somente-disponiveis')) document.getElementById('somente-disponiveis').checked = false;
    document.getElementById('ordenacao-produto').value = 'relevancia';
    filtrarVitrine();
}

// ================== SISTEMA DE CARRINHO AUTOMÁTICO ==================
function addCarrinho(id) {
    const p = produtos.find(item => item.id === id);
    if (!p || p.estoque <= 0) return;

    const itemExistente = carrinho.find(item => item.id === id);
    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({ ...p, quantidade: 1 });
    }
    p.estoque--;
    atualizarCarrinhoUI();
    renderizarVitrine();

    if (!document.getElementById('carrinho-lateral').classList.contains('aberto')) toggleCarrinho();
}

function atualizarCarrinhoUI() {
    const container = document.getElementById('lista-itens-carrinho');

    if (carrinho.length === 0) {
        container.innerHTML = htmlEstadoVazio({
            icone: '🛒',
            titulo: 'Seu carrinho está vazio',
            texto: 'Explore a vitrine e adicione camisas, bolas e relíquias para começar sua coleção.',
            acoes: '<button type="button" class="btn-store" onclick="fecharCarrinhoEIrParaVitrine()">EXPLORAR A VITRINE</button>'
        });
    } else {
        container.innerHTML = carrinho.map((item, index) => {
            const subtotalItem = parseFloat(item.preco) * item.quantidade;
            return `
                        <div class="item-carrinho">
                            <img ${atributoImagem(item.img, item.nome)}>
                            <div style="flex: 1; min-width: 0;">
                                <h4 style="font-size: .88rem; color: #fff; margin: 0; line-height: 1.35;">${escaparHtml(item.nome)}</h4>
                                <span style="font-size: .85rem; color: var(--brand-yellow); font-weight: 800;">${formatarPreco(subtotalItem)}</span>
                                <div class="item-carrinho-controles" aria-label="Quantidade de ${escaparHtml(item.nome)}">
                                    <button type="button" onclick="alterarQuantidade(${index}, -1)" aria-label="Diminuir quantidade de ${escaparHtml(item.nome)}">−</button>
                                    <span aria-live="polite">${item.quantidade}</span>
                                    <button type="button" onclick="alterarQuantidade(${index}, 1)" aria-label="Aumentar quantidade de ${escaparHtml(item.nome)}">+</button>
                                </div>
                            </div>
                            <button type="button" class="item-carrinho-remover" onclick="removerItem(${index})" aria-label="Remover ${escaparHtml(item.nome)} do carrinho">&times;</button>
                        </div>
                    `;
        }).join('');
    }

    const resumo = calcularResumoCarrinho();
    document.getElementById('subtotal-carrinho').innerText = formatarPreco(resumo.subtotal);
    document.getElementById('frete-carrinho').innerText = resumo.frete === 0 && resumo.subtotal > 0 ? 'GRÁTIS' : formatarPreco(resumo.frete);
    document.getElementById('desconto-carrinho').innerText = resumo.desconto > 0 ? `- ${formatarPreco(resumo.desconto)}` : formatarPreco(0);
    document.getElementById('preco-total-carrinho').innerText = formatarPreco(resumo.total);

    // Barra de progresso até o frete grátis: deixa visível uma regra que já
    // existia no cálculo (frete grátis a partir de R$ 200) mas era invisível.
    const progresso = document.getElementById('frete-progresso');
    if (progresso) {
        const meta = 200;
        const percentual = Math.min(100, (resumo.subtotal / meta) * 100);
        if (resumo.subtotal === 0) {
            progresso.innerHTML = '<p>Adicione itens para calcular o frete. <strong>Frete grátis a partir de R$ 200.</strong></p>';
        } else if (resumo.subtotal >= meta) {
            progresso.classList.add('completo');
            progresso.innerHTML = `<p><strong>Frete grátis liberado!</strong> Você economizou ${formatarPreco(19.90)} no envio.</p>
                <div class="barra"><i style="width: 100%"></i></div>`;
        } else {
            progresso.classList.remove('completo');
            progresso.innerHTML = `<p>Faltam <strong>${formatarPreco(meta - resumo.subtotal)}</strong> para o frete grátis.</p>
                <div class="barra"><i style="width: ${percentual}%"></i></div>`;
        }
    }

    atualizarBadgeCarrinho();
}

// Contador de itens no ícone do carrinho (antes não havia nenhuma indicação
// visual de que o carrinho tinha itens).
function atualizarBadgeCarrinho() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const total = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
    badge.innerText = total > 99 ? '99+' : total;
    const estavaOculto = badge.hidden;
    badge.hidden = total === 0;
    if (estavaOculto && total > 0) {
        badge.classList.remove('pop');
        void badge.offsetWidth;
        badge.classList.add('pop');
    }
    const botao = document.getElementById('carrinho-btn');
    if (botao) botao.setAttribute('aria-label', total === 0
        ? 'Abrir meu carrinho de compras (vazio)'
        : `Abrir meu carrinho de compras (${total} ${total === 1 ? 'item' : 'itens'})`);
}

function fecharCarrinhoEIrParaVitrine() {
    document.getElementById('carrinho-lateral').classList.remove('aberto');
    abrirAba('aba-vitrine');
    irParaProdutos();
}

function calcularResumoCarrinho() {
    const subtotal = carrinho.reduce((soma, item) => soma + (parseFloat(item.preco) * item.quantidade), 0);
    const frete = subtotal === 0 || subtotal >= 200 ? 0 : 19.90;
    const desconto = subtotal >= 300 ? subtotal * 0.10 : 0;
    return { subtotal, frete, desconto, total: subtotal + frete - desconto };
}

function alterarQuantidade(index, variacao) {
    const item = carrinho[index];
    const produtoOriginal = item && produtos.find(produto => produto.id === item.id);
    if (!item || !produtoOriginal) return;

    if (variacao > 0) {
        if (produtoOriginal.estoque <= 0) return;
        produtoOriginal.estoque--;
        item.quantidade++;
    } else if (variacao < 0) {
        produtoOriginal.estoque++;
        item.quantidade--;
        if (item.quantidade <= 0) carrinho.splice(index, 1);
    }

    atualizarCarrinhoUI();
    renderizarVitrine();
}

function removerItem(index) {
    const item = carrinho[index];
    const pOriginal = produtos.find(p => p.id === item.id);
    if (pOriginal) pOriginal.estoque += item.quantidade;
    carrinho.splice(index, 1);
    atualizarCarrinhoUI();
    renderizarVitrine();
}

// Monta o pedido local. Era só o caminho de fallback, mas o pedido simplesmente
// desaparecia quando a API estava fora do ar (fetch lança exceção, não cai no
// else) — o cliente finalizava a compra e não via nada em "Meus pedidos".
function criarPedidoLocal(pagamento, itensStr, totalStr) {
    return {
        id: Math.floor(Math.random() * 10000),
        cliente: usuarioAtual,
        status: 'pendente',
        data: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pagamento,
        itens: itensStr,
        produtosIds: carrinho.map(item => item.id),
        total: totalStr,
        local: true
    };
}

async function finalizarCompra() {
    if (carrinho.length === 0) {
        avisar('Seu carrinho está vazio. Adicione uma peça antes de finalizar.', 'alerta');
        return;
    }

    const pagamento = document.getElementById('metodo-pagamento').value;
    const itensStr = carrinho.map(i => `${i.nome} (${i.quantidade}x)`).join(', ');
    const resumo = calcularResumoCarrinho();
    const totalStr = formatarPreco(resumo.total);
    const botaoFinalizar = document.querySelector('.carrinho-footer .btn');
    if (botaoFinalizar) {
        botaoFinalizar.disabled = true;
        botaoFinalizar.innerText = 'PROCESSANDO…';
    }

    try {
        const res = await fetch(`${API_URL}/pedidos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cliente: usuarioAtual,
                pagamento: pagamento,
                itens: itensStr,
                total: totalStr,
                carrinho: carrinho
            })
        });

        if (res.ok) {
            const dt = await res.json();
            pedidos.push(dt.pedido || dt);
        } else {
            pedidos.push(criarPedidoLocal(pagamento, itensStr, totalStr));
        }
    } catch (e) {
        console.info('API indisponível; registrando o pedido localmente.', e.message);
        pedidos.push(criarPedidoLocal(pagamento, itensStr, totalStr));
    }

    adicionarNotificacao(`Compra realizada com sucesso. Acompanhe o pedido na aba de pedidos.`, 'compra');
    avisar(`Pedido confirmado! Total de ${totalStr}. Acompanhe na aba "Meus pedidos".`, 'sucesso');
    carrinho = [];
    atualizarCarrinhoUI();
    document.getElementById('carrinho-lateral').classList.remove('aberto');
    abrirAba('aba-pedidos');
    renderizarPedidos();
    if (botaoFinalizar) {
        botaoFinalizar.disabled = false;
        botaoFinalizar.innerText = 'FINALIZAR COMPRA';
    }
}

// ================== KANBAN DE PEDIDOS RASTREÁVEIS ==================
function etapaPedido(status) {
    const etapas = {
        pendente: 0,
        pending: 0,
        pago: 1,
        confirmado: 1,
        preparando: 2,
        enviado: 3,
        entregue: 4
    };
    return etapas[String(status || 'pendente').toLowerCase()] ?? 0;
}

function renderizarPedidos() {
    const colPendente = document.getElementById('col-pending');
    const colPreparando = document.getElementById('col-preparing');
    const colPronto = document.getElementById('col-ready');

    colPendente.innerHTML = ''; colPreparando.innerHTML = ''; colPronto.innerHTML = '';

    pedidos.forEach(p => {
        const etapaAtual = etapaPedido(p.status);
        const statusNormalizado = String(p.status || 'pendente').toLowerCase();
        const etapas = ['Pedido realizado', 'Pagamento confirmado', 'Preparando', 'Enviado', 'Entregue'];
        const timeline = etapas.map((etapa, indice) => `
                    <li class="${indice < etapaAtual ? 'concluida' : ''} ${indice === etapaAtual ? 'atual' : ''}">
                        ${indice === etapaAtual ? 'Agora: ' : ''}${etapa}
                    </li>`).join('');
        const card = `
                    <div class="kanban-card">
                        <div class="pedido-cabecalho">
                            <span class="pedido-numero">Pedido #${escaparHtml(p.id)}</span>
                            <span>${escaparHtml(p.data || 'Data não informada')}</span>
                        </div>
                        <div class="pedido-detalhes">
                            <h4>${escaparHtml(p.cliente || usuarioAtual)}</h4>
                            <p>${escaparHtml(p.itens || 'Itens do pedido não informados.')}</p>
                            <div class="pedido-meta">
                                <span>Pagamento: ${escaparHtml(p.pagamento || 'Não informado')}</span>
                                <span class="pedido-total">Total: ${escaparHtml(p.total || 'R$ 0,00')}</span>
                            </div>
                        </div>
                        <span class="proposta-status">Status: ${escaparHtml(statusNormalizado)}</span>
                        <ol class="pedido-timeline">${timeline}</ol>
                        <button class="btn-avaliar" onclick="abrirAvaliacao(${p.id})">AVALIAR EXPERIÊNCIA</button>
                    </div>
                `;

        if (['pendente', 'pending', 'pago', 'confirmado'].includes(statusNormalizado)) colPendente.innerHTML += card;
        if (['preparando', 'enviado'].includes(statusNormalizado)) colPreparando.innerHTML += card;
        if (statusNormalizado === 'entregue') colPronto.innerHTML += card;
    });

    // Colunas vazias explicavam nada: o usuário via três caixas em branco.
    const vazio = texto => `<p class="kanban-vazio">${escaparHtml(texto)}</p>`;
    if (!colPendente.innerHTML.trim()) colPendente.innerHTML = vazio('Nenhum pedido aguardando análise.');
    if (!colPreparando.innerHTML.trim()) colPreparando.innerHTML = vazio('Nenhum item em preparação no momento.');
    if (!colPronto.innerHTML.trim()) colPronto.innerHTML = vazio('Nenhuma negociação concluída ainda.');
}

// ================== ENGENHARIA DO RADAR DE TROCAS ==================
async function buscarPessoasProximas() {
    const container = document.getElementById('lista-proximos');
    container.innerHTML = `
                <div style="text-align:center; color:var(--vought-gold);">
                    <p>📡 Emitindo sinal de localização...</p>
                    <small style="color:#666;">Buscando outros torcedores via satélite...</small>
                </div>`;

    try {
        const res = await fetch(`${API_URL}/pessoas`);
        if (res.ok) pessoasProximas = await res.json();
    } catch (e) { console.info('Radar offline: nenhum colecionador remoto carregado.'); }

    setTimeout(() => {
        renderizarRadar();
    }, 600);
}

function categoriaDoColecionador(pessoa) {
    const interesse = (pessoa.categoria_interesse || pessoa.categoriaInteresse || pessoa.item_interesse || pessoa.itemInteresse || '').toLowerCase();
    if (interesse.includes('camis')) return 'Camisas';
    if (interesse.includes('bol')) return 'Bolas';
    if (interesse.includes('colecion')) return 'Colecionáveis';
    if (interesse.includes('equip')) return 'Equipamentos';
    if (interesse.includes('acess')) return 'Acessórios';
    return pessoa.categoria_interesse || pessoa.categoriaInteresse || 'Outros artigos';
}

function filtrarRadar() {
    renderizarRadar();
}

function renderizarRadar() {
    const container = document.getElementById('lista-proximos');
    const filtro = document.getElementById('filtro-radar').value;
    const pessoasFiltradas = pessoasProximas.filter(pessoa => filtro === 'todos' || categoriaDoColecionador(pessoa) === filtro);

    if (pessoasFiltradas.length === 0) {
        container.innerHTML = `<p class="radar-vazio">Nenhum colecionador procurando por ${filtro === 'todos' ? 'artigos no momento' : filtro.toLowerCase()} foi encontrado.</p>`;
        return;
    }
    container.innerHTML = pessoasFiltradas.map(p => {
        const nome = p.nome || 'Colecionador';
        const interesses = p.item_interesse || p.itemInteresse || categoriaDoColecionador(p);
        // Avatar gerado localmente com as iniciais: antes vinha de uma API
        // externa (api.dicebear.com) que, sem internet, deixava a lista cheia
        // de imagens quebradas.
        const iniciais = nome.trim().split(/\s+/).slice(0, 2).map(parte => parte[0]).join('').toUpperCase();
        return `
                    <div class="collector-card">
                        <span class="coletor-inicial" aria-hidden="true">${escaparHtml(iniciais)}</span>
                        <div style="flex:1; min-width:0;">
                            <h4 style="color:var(--vought-gold); margin:0;">${escaparHtml(nome)}</h4>
                            <p style="font-size:0.75rem; color:#aaa; margin:2px 0;">Procura por: <strong style="color:var(--copa-yellow);">${escaparHtml(interesses)}</strong></p>
                            <span class="radar-categoria">${escaparHtml(categoriaDoColecionador(p))}</span>
                            <p style="font-size:0.65rem; color:#666; font-style:italic;">📍 a ${escaparHtml(p.distancia)} de distância</p>
                        </div>
                        <button type="button" class="radar-propor-btn" onclick="proporTroca('${escaparHtml(nome).replace(/'/g, "\\'")}')">PROPOR</button>
                    </div>
                `;
    }).join('');
}

function proporTroca(nome) {
    avisar(`Proposta enviada! ${nome} recebeu seu alerta de interesse. Se aceitar, um chat de troca é aberto.`, 'sucesso');
    adicionarNotificacao(`Você propôs uma troca para ${nome}.`, 'troca');
}


