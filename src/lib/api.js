// Camada de API. Tenta o backend sempre; se ele estiver offline ou sem Supabase configurado,
// os chamadas rejeitam e o store cai no localStorage, mantendo o app funcional (progressive enhancement).

export const API_URL = import.meta.env.VITE_API_URL || '/api'

function token() {
  try {
    return localStorage.getItem('mercadoDaCopaToken') || ''
  } catch {
    return ''
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const auth = token()
  if (auth) headers.Authorization = `Bearer ${auth}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    const msg = (data && data.error) || `Erro ${res.status}`
    throw new ApiError(msg, res.status)
  }
  return data
}

export const api = {
  // ---- Auth ----
  login: (email, password) => request('/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (nome, email, password) =>
    request('/register', { method: 'POST', body: JSON.stringify({ nome, email, password }) }),

  // ---- Catálogo ----
  produtos: () => request('/produtos'),
  pessoas: () => request('/pessoas'),

  // ---- Pedidos ----
  pedidosDoUsuario: (email) => request(`/pedidos/${encodeURIComponent(email)}`),
  criarPedido: (pedido) => request('/pedidos', { method: 'POST', body: JSON.stringify(pedido) }),

  // ---- Perfil ----
  atualizarPerfil: (dados) => request('/perfil', { method: 'PATCH', body: JSON.stringify(dados) }),

  // ---- Vendas (produtos do usuário) ----
  listarVendas: () => request('/vendas'),
  criarVenda: (venda) => request('/vendas', { method: 'POST', body: JSON.stringify(venda) }),
  removerVenda: (id) => request(`/vendas/${id}`, { method: 'DELETE' }),

  // ---- Trocas ----
  listarPropostas: () => request('/trocas'),
  criarProposta: (proposta) => request('/trocas', { method: 'POST', body: JSON.stringify(proposta) }),
  responderProposta: (id, status) => request(`/trocas/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),

  // ---- Chat de troca ----
  listarMensagens: (propostaId) => request(`/chats/${propostaId}`),
  enviarMensagem: (propostaId, texto) =>
    request(`/chats/${propostaId}`, { method: 'POST', body: JSON.stringify({ texto }) }),

  // ---- Avaliações ----
  avaliacoesDoProduto: (produtoId) => request(`/avaliacoes/produto/${produtoId}`),
  criarAvaliacao: (avaliacao) => request('/avaliacoes', { method: 'POST', body: JSON.stringify(avaliacao) }),

  // ---- Favoritos ----
  favoritosDoUsuario: (email) => request(`/favoritos/${encodeURIComponent(email)}`),
  toggleFavorito: (produtoId) => request('/favoritos', { method: 'POST', body: JSON.stringify({ produtoId }) }),

  // ---- Notificações ----
  notificacoesDoUsuario: (email) => request(`/notificacoes/${encodeURIComponent(email)}`),
  adicionarNotificacao: (notificacao) => request('/notificacoes', { method: 'POST', body: JSON.stringify(notificacao) }),
}
