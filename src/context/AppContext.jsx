import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '../lib/api'
import { KEYS, lsGet, lsSet, lsRemove } from '../lib/storage'
import { catalogoLocal } from '../lib/catalogo'
import { uid, nowTime, nowDate } from '../lib/format'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [introAtivo, setIntroAtivo] = useState(true)
  const [authReady, setAuthReady] = useState(false)

  const [usuario, setUsuario] = useState(null) // { nome_exibicao, email, avatar_src }
  const [produtos, setProdutos] = useState(catalogoLocal)
  const [pessoas, setPessoas] = useState([
    { id: 101, nome: 'Carlos_Figurinhas', distancia: '200m', item_interesse: 'Figurinha Neymar Gold', avatar: '/img-avatares/vini.jpg' },
    { id: 102, nome: 'Ana_Mantos_94', distancia: '500m', item_interesse: 'Casaco Copa 94', avatar: '/img-avatares/neymar.jpg' },
    { id: 103, nome: 'Pedro_Penta', distancia: '1.2km', item_interesse: 'Chuteira R9', avatar: '/img-avatares/endrick.jpg' },
    { id: 104, nome: 'Marcos_Tri70', distancia: '2.5km', item_interesse: 'Camisa Brasil 1970', avatar: '/img-avatares/alisson.jpg' },
    { id: 105, nome: 'Juliana_Colecionadora', distancia: '3.1km', item_interesse: 'Moedas Comemorativas', avatar: '/img-avatares/paquetá.jpg' },
    { id: 106, nome: 'Lucas_Hexa26', distancia: '4.8km', item_interesse: 'Flâmula de 1958', avatar: '/img-avatares/danilo.avif' },
  ])
  const [carrinho, setCarrinho] = useState(() => lsGet(KEYS.pedidos + '_cart', []))
  const [favoritos, setFavoritos] = useState(() => lsGet(KEYS.favoritos, []))
  const [vendas, setVendas] = useState(() => lsGet(KEYS.vendas, []))
  const [propostas, setPropostas] = useState(() => lsGet(KEYS.propostas, []))
  const [chats, setChats] = useState(() => lsGet(KEYS.chats, {}))
  const [avaliacoes, setAvaliacoes] = useState(() => lsGet(KEYS.avaliacoes, []))
  const [notificacoes, setNotificacoes] = useState(() => lsGet(KEYS.notificacoes, []))
  const [pedidos, setPedidos] = useState(() => lsGet('mercadoDaCopaPedidosList', []))
  const [toasts, setToasts] = useState([])

  // ---------- Toasts ----------
  const toast = useCallback((mensagem, tipo = 'ok') => {
    const id = uid()
    setToasts((t) => [...t, { id, mensagem, tipo }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  // ---------- Persistência local ----------
  const persist = useCallback((key, value) => lsSet(key, value), [])

  useEffect(() => { persist(KEYS.favoritos, favoritos) }, [favoritos, persist])
  useEffect(() => { persist(KEYS.vendas, vendas) }, [vendas, persist])
  useEffect(() => { persist(KEYS.propostas, propostas) }, [propostas, persist])
  useEffect(() => { persist(KEYS.chats, chats) }, [chats, persist])
  useEffect(() => { persist(KEYS.avaliacoes, avaliacoes) }, [avaliacoes, persist])
  useEffect(() => { persist(KEYS.notificacoes, notificacoes) }, [notificacoes, persist])
  useEffect(() => { persist('mercadoDaCopaPedidosList', pedidos) }, [pedidos, persist])
  useEffect(() => { persist(KEYS.pedidos + '_cart', carrinho) }, [carrinho, persist])

  // ---------- Restaura sessão ----------
  useEffect(() => {
    const savedUser = lsGet(KEYS.usuario, null)
    const savedToken = lsGet(KEYS.token, '')
    if (savedUser && savedToken) setUsuario(savedUser)
    setAuthReady(true)
  }, [])

  // ---------- Catálogo / radar ----------
  useEffect(() => {
    let cancelado = false
    api.produtos()
      .then((data) => { if (!cancelado && Array.isArray(data) && data.length) setProdutos(data) })
      .catch(() => {})
    api.pessoas()
      .then((data) => { if (!cancelado && Array.isArray(data) && data.length) setPessoas(data) })
      .catch(() => {})
    return () => { cancelado = true }
  }, [])

  // ---------- Auth ----------
  const setSessao = useCallback((data, email) => {
    const user = { nome_exibicao: data.nome_exibicao || data.nome, email: data.email || email, avatar_src: data.avatar_src || '/img-avatares/vini.jpg' }
    setUsuario(user)
    persist(KEYS.usuario, user)
    persist(KEYS.token, data.token || '')
  }, [persist])

  const login = useCallback(async (email, password) => {
    const lowerEmail = email.trim().toLowerCase()
    try {
      const data = await api.login(lowerEmail, password)
      setSessao(data.usuario, lowerEmail)
      return { ok: true }
    } catch {
      // fallback offline: contas locais
      const contas = lsGet(KEYS.contas, [])
      const conta = contas.find((c) => c.email === lowerEmail)
      if (conta && conta.password === password) {
        setSessao({ nome_exibicao: conta.nome, email: conta.email, avatar_src: '/img-avatares/vini.jpg' }, lowerEmail)
        return { ok: true }
      }
      return { ok: false, erro: 'E-mail ou senha incorretos.' }
    }
  }, [setSessao])

  const register = useCallback(async (nome, email, password) => {
    const lowerEmail = email.trim().toLowerCase()
    try {
      const data = await api.register(nome, lowerEmail, password)
      setSessao(data.usuario, lowerEmail)
      return { ok: true }
    } catch {
      const contas = lsGet(KEYS.contas, [])
      if (contas.some((c) => c.email === lowerEmail)) {
        return { ok: false, erro: 'Este e-mail já possui uma conta.' }
      }
      contas.push({ nome, email: lowerEmail, password })
      persist(KEYS.contas, contas)
      setSessao({ nome_exibicao: nome, email: lowerEmail, avatar_src: '/img-avatares/vini.jpg' }, lowerEmail)
      return { ok: true }
    }
  }, [setSessao, persist])

  const logout = useCallback(() => {
    setUsuario(null)
    lsRemove(KEYS.usuario)
    lsRemove(KEYS.token)
  }, [])

  const atualizarPerfil = useCallback((dados) => {
    setUsuario((u) => {
      const next = { ...u, ...dados }
      persist(KEYS.usuario, next)
      return next
    })
    try { api.atualizarPerfil(dados).catch(() => {}) } catch {}
  }, [persist])

  // ---------- Carrinho ----------
  const addCarrinho = useCallback((produto) => {
    setCarrinho((c) => {
      const idx = c.findIndex((i) => i.id === produto.id)
      if (idx >= 0) {
        const copy = [...c]
        copy[idx] = { ...copy[idx], qtd: copy[idx].qtd + 1 }
        return copy
      }
      return [...c, { id: produto.id, nome: produto.nome, preco: produto.preco, img: produto.img, qtd: 1 }]
    })
  }, [])

  const alterarQtd = useCallback((id, variacao) => {
    setCarrinho((c) =>
      c
        .map((i) => (i.id === id ? { ...i, qtd: Math.max(1, i.qtd + variacao) } : i))
    )
  }, [])

  const removerItem = useCallback((id) => setCarrinho((c) => c.filter((i) => i.id !== id)), [])

  const limparCarrinho = useCallback(() => setCarrinho([]), [])

  const subtotal = useMemo(() => carrinho.reduce((s, i) => s + i.preco * i.qtd, 0), [carrinho])
  const frete = useMemo(() => (subtotal > 0 && subtotal < 250 ? 19.90 : 0), [subtotal])
  const total = subtotal + frete

  // ---------- Favoritos ----------
  const toggleFavorito = useCallback((produtoId) => {
    let adicionado
    setFavoritos((f) => {
      const existe = f.includes(produtoId)
      adicionado = !existe
      return existe ? f.filter((x) => x !== produtoId) : [...f, produtoId]
    })
    try { api.toggleFavorito(produtoId).catch(() => {}) } catch {}
    return adicionado
  }, [])

  // ---------- Notificações ----------
  const adicionarNotificacao = useCallback((mensagem, tipo = 'sistema') => {
    const notif = { id: uid(), texto: mensagem, tipo, lida: false, data: nowTime() }
    setNotificacoes((n) => [notif, ...n])
    try { api.adicionarNotificacao({ texto: mensagem, tipo }).catch(() => {}) } catch {}
  }, [])

  const marcarLidas = useCallback(() => {
    setNotificacoes((n) => n.map((x) => ({ ...x, lida: true })))
  }, [])

  // ---------- Vendas ----------
  const publicarProduto = useCallback((produto) => {
    const item = { ...produto, id: uid(), vendedor: usuario?.email || 'torcedor', data: nowDate(), vendido: false }
    setVendas((v) => [item, ...v])
    try { api.criarVenda(item).catch(() => {}) } catch {}
    adicionarNotificacao(`✅ "${item.nome}" publicado na vitrine!`, 'venda')
    return item
  }, [usuario, adicionarNotificacao])

  const removerVenda = useCallback((id) => {
    setVendas((v) => v.filter((x) => x.id !== id))
    try { api.removerVenda(id).catch(() => {}) } catch {}
  }, [])

  // ---------- Trocas ----------
  const criarProposta = useCallback((proposta) => {
    const item = { ...proposta, id: uid(), de: usuario?.email || 'torcedor', status: 'pendente', data: nowDate() }
    setPropostas((p) => [item, ...p])
    try { api.criarProposta(item).catch(() => {}) } catch {}
    adicionarNotificacao(`🤝 Proposta de troca criada para "${proposta.item_oferecido}".`, 'troca')
    return item
  }, [usuario, adicionarNotificacao])

  const responderProposta = useCallback((id, status) => {
    setPropostas((p) => p.map((x) => (x.id === id ? { ...x, status } : x)))
    try { api.responderProposta(id, status).catch(() => {}) } catch {}
    adicionarNotificacao(status === 'aprovada' ? '🤝 Proposta de troca aprovada!' : 'Proposta de troca recusada.', 'troca')
  }, [adicionarNotificacao])

  // ---------- Chat ----------
  const abrirChat = useCallback((propostaId) => {
    setChats((c) => ({ ...c, [propostaId]: c[propostaId] || [] }))
  }, [])

  const enviarMensagem = useCallback((propostaId, texto) => {
    if (!texto.trim()) return
    const mensagem = { id: uid(), de: 'mine', texto, data: nowTime() }
    setChats((c) => ({ ...c, [propostaId]: [...(c[propostaId] || []), mensagem] }))
    try { api.enviarMensagem(propostaId, texto).catch(() => {}) } catch {}
  }, [])

  // ---------- Avaliações ----------
  const salvarAvaliacao = useCallback((avaliacao) => {
    const item = { ...avaliacao, id: uid(), data: nowDate() }
    setAvaliacoes((a) => [item, ...a.filter((x) => !(x.produtoId === avaliacao.produtoId && x.de === avaliacao.de))])
    try { api.criarAvaliacao(item).catch(() => {}) } catch {}
  }, [])

  // ---------- Pedido / checkout ----------
  const finalizarCompra = useCallback(async (pagamento) => {
    const itens = carrinho.map((i) => ({ id: i.id, nome: i.nome, preco: i.preco, qtd: i.qtd }))
    const pedido = {
      id: uid(),
      cliente: usuario?.email || 'torcedor_anonimo',
      nome_cliente: usuario?.nome_exibicao || 'Torcedor',
      status: 'pendente',
      data: nowDate(),
      pagamento,
      itens,
      total,
    }
    try {
      await api.criarPedido(pedido)
      adicionarNotificacao('✅ Pedido realizado com sucesso! Acompanhe o status na sua conta.', 'pedido')
    } catch {
      setPedidos((p) => [pedido, ...p])
    }
    setCarrinho([])
    return pedido
  }, [carrinho, usuario, total, adicionarNotificacao])

  const refreshPedidos = useCallback(async () => {
    if (!usuario?.email) return
    try {
      const data = await api.pedidosDoUsuario(usuario.email)
      if (Array.isArray(data)) setPedidos(data)
    } catch {
      /* mantém o local */
    }
  }, [usuario])

  const value = useMemo(
    () => ({
      // estado
      introAtivo, setIntroAtivo,
      authReady,
      usuario, produtos, pessoas, carrinho, subtotal, frete, total,
      favoritos, vendas, propostas, chats, avaliacoes, notificacoes, pedidos,
      toasts, toast,
      // auth
      login, register, logout, atualizarPerfil,
      // carrinho
      addCarrinho, alterarQtd, removerItem, limparCarrinho,
      // favoritos
      toggleFavorito,
      // notificações
      adicionarNotificacao, marcarLidas,
      // vendas
      publicarProduto, removerVenda,
      // trocas
      criarProposta, responderProposta,
      // chat
      abrirChat, enviarMensagem,
      // avaliações
      salvarAvaliacao,
      // pedidos
      finalizarCompra, refreshPedidos,
    }),
    [introAtivo, authReady, usuario, produtos, pessoas, carrinho, subtotal, frete, total, favoritos, vendas, propostas, chats, avaliacoes, notificacoes, pedidos, toasts, toast, login, register, logout, atualizarPerfil, addCarrinho, alterarQtd, removerItem, limparCarrinho, toggleFavorito, adicionarNotificacao, marcarLidas, publicarProduto, removerVenda, criarProposta, responderProposta, abrirChat, enviarMensagem, salvarAvaliacao, finalizarCompra, refreshPedidos]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp deve ser usado dentro de AppProvider')
  return ctx
}
