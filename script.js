
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
        let imagemVendaTemporaria = "./img-vendas/bandeira.webp";

        const catalogoLocal = window.catalogoLocalData;

        // ================== FLUXO DE ENTRADA ==================
        function skipIntro() {
            document.getElementById('video-intro').style.display = 'none';
            document.getElementById('auth-container').style.display = 'flex';
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
                if(res.ok) {
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
                if(res.ok) {
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
            } catch(err) {
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
                if(resProd.ok) produtos = await resProd.json();
            } catch(e) { console.info("API indisponível; usando catálogo local."); }

            if (!Array.isArray(produtos) || produtos.length === 0) {
                produtos = catalogoLocal.map(produto => ({ ...produto }));
            }
            produtos = [...produtos, ...obterProdutosVenda()];
            verificarAlteracoesDePreco();

            try {
                const resPed = await fetch(`${API_URL}/pedidos/${usuarioAtual}`);
                if(resPed.ok) pedidos = await resPed.json();
            } catch(e) { console.error("Erro ao carregar pedidos:", e); }

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
            if (!arquivo) return;

            const leitor = new FileReader();
            leitor.onload = () => {
                imagemVendaTemporaria = leitor.result;
                document.getElementById('venda-preview').innerHTML = `<img src="${imagemVendaTemporaria}" alt="Prévia do produto anunciado">`;
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

            if (!produto.nome || !produto.desc || !produto.origem || produto.preco <= 0 || produto.estoque < 1) {
                document.getElementById('venda-feedback').innerText = 'Confira os campos do anúncio antes de publicar.';
                return;
            }

            const produtosVenda = obterProdutosVenda();
            produtosVenda.push(produto);
            localStorage.setItem(PRODUTOS_VENDA_KEY, JSON.stringify(produtosVenda));
            produtos.push(produto);
            document.getElementById('form-venda').reset();
            imagemVendaTemporaria = "./img-vendas/bandeira.webp";
            document.getElementById('venda-preview').innerHTML = '<span>A prévia da imagem aparecerá aqui</span>';
            document.getElementById('venda-feedback').innerText = 'Item publicado com sucesso na vitrine!';
            renderizarVitrine();
            setTimeout(() => abrirAba('aba-vitrine'), 700);
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
            renderizarPropostasTroca();
        }

        function renderizarPropostasTroca() {
            const container = document.getElementById('lista-propostas-troca');
            if (!container) return;
            const propostas = obterPropostasTroca();
            if (propostas.length === 0) {
                container.innerHTML = '<p class="propostas-vazias">Nenhuma proposta foi criada ainda.</p>';
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
                            <h3>${proposta.itemOfertadoNome} <span aria-hidden="true">⇄</span> ${proposta.itemDesejadoNome}</h3>
                            <p><strong>${proposta.proponente}</strong> propôs esta troca em ${proposta.data}.</p>
                            ${proposta.mensagem ? `<p>“${proposta.mensagem}”</p>` : ''}
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
                    <strong>${mensagem.autor}</strong>
                    <p>${mensagem.texto}</p>
                    <small>${mensagem.data}</small>
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
            fecharAvaliacao();
            renderizarVitrine();
            renderizarPedidos();
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
            document.querySelectorAll('.secao-aba').forEach(aba => aba.classList.remove('ativa'));
            document.getElementById(idAba).classList.add('ativa');
            if (idAba === 'aba-trocas') {
                prepararFormularioTroca();
                renderizarPropostasTroca();
            }
            fecharMenuMobile();
        }

        function sair() { location.reload(); }

        function toggleCarrinho() {
            document.getElementById('carrinho-lateral').classList.toggle('aberto');
            fecharMenuMobile();
        }

        // ================== RENDERIZAR VITRINE ==================
        function renderizarVitrine() {
            const grid = document.getElementById('container-produtos');
            if(produtos.length === 0) {
                grid.innerHTML = "<p style='color:white; text-align:center;'>Nenhum produto encontrado. Verifique o banco de dados do Supabase.</p>";
                return;
            }
            document.getElementById('home-contagem-produtos').innerText = `${produtos.length} artigos disponíveis agora`;
            preencherCategorias();
            renderizarDestaques();
            renderizarFavoritos();
            filtrarVitrine();
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
                ? notificacoes.map(notificacao => `<div class="notificacao-item ${notificacao.lida ? '' : 'nao-lida'}">${notificacao.mensagem}<small>${notificacao.data}</small></div>`).join('')
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
                    adicionarNotificacao(`O preço de ${produto.nome} mudou para R$ ${Number(produto.preco).toFixed(2)}.`, 'preco');
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
                container.innerHTML = '<p class="favoritos-vazio">Você ainda não salvou nenhum artigo. Clique no coração de um produto para encontrá-lo aqui.</p>';
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
            return `
                <article class="home-produto-card">
                    <button class="favorito-botao ${produtoFavoritado(produto.id) ? 'ativo' : ''}" onclick="toggleFavorito(${produto.id})" aria-label="${produtoFavoritado(produto.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">${produtoFavoritado(produto.id) ? '♥' : '♡'}</button>
                    <img src="${produto.img}" alt="${produto.nome}">
                    <div class="home-produto-info">
                        <span class="secao-kicker">${etiqueta}</span>
                        <h3>${produto.nome}</h3>
                        ${htmlAvaliacaoProduto(produto.id)}
                        <div class="home-produto-meta">
                            <span class="home-produto-preco">R$ ${parseFloat(produto.preco).toFixed(2)}</span>
                            <button class="home-add-btn" onclick="abrirProdutoModal(${produto.id})">DETALHES</button>
                        </div>
                    </div>
                </article>`;
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
            document.getElementById('modal-produto-imagem').src = produto.img;
            document.getElementById('modal-produto-imagem').alt = produto.nome;
            document.getElementById('modal-produto-categoria').innerText = produto.categoria || 'Colecionáveis';
            document.getElementById('modal-produto-nome').innerText = produto.nome;
            document.getElementById('modal-produto-descricao').innerText = produto.desc || 'Artigo selecionado do acervo Mercado da Copa.';
            document.getElementById('modal-produto-preco').innerText = `R$ ${parseFloat(produto.preco).toFixed(2)}`;
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

        function preencherCategorias() {
            const filtro = document.getElementById('filtro-categoria');
            const categoriaAtual = filtro.value;
            const categorias = [...new Set(produtos.map(p => p.categoria || 'Outros'))].sort();
            filtro.innerHTML = '<option value="todas">Todas as categorias</option>' + categorias.map(categoria => `<option value="${categoria}">${categoria}</option>`).join('');
            filtro.value = categorias.includes(categoriaAtual) ? categoriaAtual : 'todas';
        }

        function filtrarVitrine() {
            const busca = document.getElementById('busca-produto').value.trim().toLowerCase();
            const categoria = document.getElementById('filtro-categoria').value;
            const condicao = document.getElementById('filtro-condicao').value;
            const precoMinimo = parseFloat(document.getElementById('preco-minimo').value);
            const precoMaximo = parseFloat(document.getElementById('preco-maximo').value);
            const ordenacao = document.getElementById('ordenacao-produto').value;
            let produtosVisiveis = produtos.filter(p => {
                const texto = `${p.nome} ${p.desc || ''} ${p.categoria || ''}`.toLowerCase();
                const preco = parseFloat(p.preco) || 0;
                const condicaoProduto = (p.condicao || '').toLowerCase();
                const atendeCondicao = condicao === 'todas' ||
                    (condicao === 'novo' && condicaoProduto.includes('novo')) ||
                    (condicao === 'usado' && !condicaoProduto.includes('novo'));
                const atendePrecoMinimo = Number.isNaN(precoMinimo) || preco >= precoMinimo;
                const atendePrecoMaximo = Number.isNaN(precoMaximo) || preco <= precoMaximo;
                return texto.includes(busca) &&
                    (categoria === 'todas' || (p.categoria || 'Outros') === categoria) &&
                    atendeCondicao && atendePrecoMinimo && atendePrecoMaximo;
            });

            if (ordenacao === 'menor-preco') produtosVisiveis.sort((a, b) => a.preco - b.preco);
            if (ordenacao === 'maior-preco') produtosVisiveis.sort((a, b) => b.preco - a.preco);
            if (ordenacao === 'nome') produtosVisiveis.sort((a, b) => a.nome.localeCompare(b.nome));

            const grid = document.getElementById('container-produtos');
            if (produtosVisiveis.length === 0) {
                grid.innerHTML = '<p class="vitrine-vazia">Nenhum artigo encontrado para essa busca.</p>';
                return;
            }

            grid.innerHTML = produtosVisiveis.map(p => `
                <div class="produto-card">
                    <button class="favorito-botao ${produtoFavoritado(p.id) ? 'ativo' : ''}" onclick="toggleFavorito(${p.id})" aria-label="${produtoFavoritado(p.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">${produtoFavoritado(p.id) ? '♥' : '♡'}</button>
                    <div class="produto-img-container">
                        <img src="${p.img}" alt="${p.nome}">
                    </div>
                    <div class="produto-info">
                        <h3 class="produto-titulo">${p.nome}</h3>
                        <p class="produto-desc">${p.desc}</p>
                        ${htmlAvaliacaoProduto(p.id)}
                        <div class="produto-resumo">
                            <span>${p.categoria || 'Colecionáveis'}</span>
                            <span>${p.condicao || 'Boa'}</span>
                        </div>
                        
                        <div class="produto-meta">
                            <span class="produto-preco">R$ ${parseFloat(p.preco).toFixed(2)}</span>
                            <span class="produto-estoque" style="background: ${p.estoque > 0 ? 'var(--vought-gold)' : 'var(--vought-red)'}; color: ${p.estoque > 0 ? '#000' : '#fff'};">
                                ${p.estoque > 0 ? `Estoque: ${p.estoque}` : 'ESGOTADO'}
                            </span>
                        </div>
                        
                        <div class="produto-acoes">
                            <button class="btn-detalhes" onclick="abrirProdutoModal(${p.id})">VER DETALHES</button>
                            <button class="btn-store" style="margin-top: auto; font-size: 0.9rem; opacity: ${p.estoque > 0 ? '1' : '0.5'}" 
                                onclick="addCarrinho(${p.id})" ${p.estoque <= 0 ? 'disabled' : ''}>
                                ADICIONAR À SACOLA
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function limparFiltros() {
            document.getElementById('busca-produto').value = '';
            document.getElementById('filtro-categoria').value = 'todas';
            document.getElementById('filtro-condicao').value = 'todas';
            document.getElementById('preco-minimo').value = '';
            document.getElementById('preco-maximo').value = '';
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
                container.innerHTML = '<p style="color: #666; text-align: center; margin-top: 40px;">Seu carrinho está vazio.</p>';
            } else {
                container.innerHTML = carrinho.map((item, index) => {
                    const subtotalItem = parseFloat(item.preco) * item.quantidade;
                    return `
                        <div style="background: #16232b; border: 1px solid #34464b; padding: 10px; border-radius: 8px; display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                            <img src="${item.img}" alt="${item.nome}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                            <div style="flex: 1;">
                                <h4 style="font-size: 0.9rem; color: white; margin: 0;">${item.nome}</h4>
                                <span style="font-size: 0.85rem; color: var(--copa-green); font-weight: bold;">R$ ${subtotalItem.toFixed(2)}</span>
                                <div class="item-carrinho-controles" aria-label="Quantidade de ${item.nome}">
                                    <button onclick="alterarQuantidade(${index}, -1)" aria-label="Diminuir quantidade">−</button>
                                    <span>${item.quantidade}</span>
                                    <button onclick="alterarQuantidade(${index}, 1)" aria-label="Aumentar quantidade">+</button>
                                </div>
                            </div>
                            <button class="item-carrinho-remover" onclick="removerItem(${index})" style="background: transparent; border: none; color: var(--vought-red); font-size: 1.2rem;" aria-label="Remover ${item.nome}">&times;</button>
                        </div>
                    `;
                }).join('');
            }

            const resumo = calcularResumoCarrinho();
            document.getElementById('subtotal-carrinho').innerText = `R$ ${resumo.subtotal.toFixed(2)}`;
            document.getElementById('frete-carrinho').innerText = resumo.frete === 0 && resumo.subtotal > 0 ? 'GRÁTIS' : `R$ ${resumo.frete.toFixed(2)}`;
            document.getElementById('desconto-carrinho').innerText = resumo.desconto > 0 ? `- R$ ${resumo.desconto.toFixed(2)}` : 'R$ 0,00';
            document.getElementById('preco-total-carrinho').innerText = `R$ ${resumo.total.toFixed(2)}`;
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
            if(pOriginal) pOriginal.estoque += item.quantidade;
            carrinho.splice(index, 1);
            atualizarCarrinhoUI();
            renderizarVitrine();
        }

        async function finalizarCompra() {
            if (carrinho.length === 0) return alert("Carrinho vazio!");

            const pagamento = document.getElementById('metodo-pagamento').value;
            const itensStr = carrinho.map(i => `${i.nome} (${i.quantidade}x)`).join(', ');
            const resumo = calcularResumoCarrinho();
            const totalStr = `R$ ${resumo.total.toFixed(2)}`;

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

                if(res.ok) {
                    const dt = await res.json();
                    pedidos.push(dt.pedido || dt);
                } else {
                    // Fallback
                    pedidos.push({
                        id: Math.floor(Math.random() * 10000),
                        cliente: usuarioAtual,
                        status: 'pendente',
                        data: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        pagamento,
                        itens: itensStr,
                        produtosIds: carrinho.map(item => item.id),
                        total: totalStr
                    });
                }
            } catch(e) {
                console.error(e);
            }

            adicionarNotificacao(`Compra realizada com sucesso. Acompanhe o pedido na aba de pedidos.`, 'compra');
            carrinho = [];
            atualizarCarrinhoUI();
            toggleCarrinho();
            abrirAba('aba-pedidos');
            renderizarPedidos();
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
                            <span class="pedido-numero">Pedido #${p.id}</span>
                            <span>${p.data || 'Data não informada'}</span>
                        </div>
                        <div class="pedido-detalhes">
                            <h4>${p.cliente || usuarioAtual}</h4>
                            <p>${p.itens || 'Itens do pedido não informados.'}</p>
                            <div class="pedido-meta">
                                <span>Pagamento: ${p.pagamento || 'Não informado'}</span>
                                <span class="pedido-total">Total: ${p.total || 'R$ 0,00'}</span>
                            </div>
                        </div>
                        <span class="proposta-status">Status: ${statusNormalizado}</span>
                        <ol class="pedido-timeline">${timeline}</ol>
                        <button class="btn-avaliar" onclick="abrirAvaliacao(${p.id})">AVALIAR EXPERIÊNCIA</button>
                    </div>
                `;

                if (['pendente', 'pending', 'pago', 'confirmado'].includes(statusNormalizado)) colPendente.innerHTML += card;
                if (['preparando', 'enviado'].includes(statusNormalizado)) colPreparando.innerHTML += card;
                if (statusNormalizado === 'entregue') colPronto.innerHTML += card;
            });
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
                if(res.ok) pessoasProximas = await res.json();
            } catch(e) { console.info('Radar offline: nenhum colecionador remoto carregado.'); }

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

            if(pessoasFiltradas.length === 0) {
                container.innerHTML = `<p class="radar-vazio">Nenhum colecionador procurando por ${filtro === 'todos' ? 'artigos no momento' : filtro.toLowerCase()} foi encontrado.</p>`;
                return;
            }
            container.innerHTML = pessoasFiltradas.map(p => `
                    <div class="collector-card">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${p.avatar}" alt="Avatar de ${p.nome}" class="collector-avatar">
                        <div style="flex:1;">
                            <h4 style="color:var(--vought-gold); margin:0;">${p.nome}</h4>
                            <p style="font-size:0.75rem; color:#aaa; margin:2px 0;">Procura por: <strong style="color:var(--copa-yellow);">${p.item_interesse || p.itemInteresse || categoriaDoColecionador(p)}</strong></p>
                            <span class="radar-categoria">${categoriaDoColecionador(p)}</span>
                            <p style="font-size:0.65rem; color:#666; font-style:italic;">📍 a ${p.distancia} de distância</p>
                        </div>
                        <button onclick="proporTroca('${p.nome}')" style="background:var(--copa-green); color:black; border:none; padding:8px 12px; border-radius:6px; font-weight:900; font-size:0.7rem; text-transform:uppercase;">PROPOR</button>
                    </div>
                `).join('');
        }

        function proporTroca(nome) {
            alert(`⚽ PROPOSTA NOTIFICADA!\nO colecionador ${nome} recebeu seu alerta de interesse. Se ele aceitar, um chat de troca será aberto.`);
        }

    
