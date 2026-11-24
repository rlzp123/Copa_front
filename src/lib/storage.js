// Persistência local: tudo que o backend ainda não armazenou fica no localStorage,
// assim o app funciona 100% offline e sem depender de credentials do Supabase.

export const KEYS = {
  contas: 'mercadoDaCopaContas',
  token: 'mercadoDaCopaToken',
  usuario: 'mercadoDaCopaUsuario',
  favoritos: 'mercadoDaCopaFavoritos',
  vendas: 'mercadoDaCopaProdutosVenda',
  propostas: 'mercadoDaCopaPropostasTroca',
  chats: 'mercadoDaCopaChatsTroca',
  avaliacoes: 'mercadoDaCopaAvaliacoes',
  notificacoes: 'mercadoDaCopaNotificacoes',
  pedidos: 'mercadoDaCopaPedidos',
}

export function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* localStorage cheio ou bloqueado — ignora silenciosamente */
  }
}

export function lsRemove(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignora */
  }
}
