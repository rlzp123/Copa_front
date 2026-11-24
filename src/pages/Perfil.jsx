import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatBRL, nowDate } from '../lib/format'
import Modal from '../components/Modal'

export default function Perfil() {
  const {
    usuario, logout, atualizarPerfil,
    favoritos, vendas, propostas, pedidos, toast,
  } = useApp()
  const navigate = useNavigate()
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({ nome: usuario?.nome_exibicao || '', email: usuario?.email || '', senha: '' })
  const [senhaAntiga, setSenhaAntiga] = useState('')

  const salvar = () => {
    if (!form.nome.trim() || !form.email.trim()) {
      toast('Nome e e-mail são obrigatórios.', 'warn')
      return
    }
    if (form.senha && senhaAntiga.length < 6) {
      toast('A senha atual precisa ter pelo menos 6 caracteres.', 'warn')
      return
    }
    atualizarPerfil({ nome_exibicao: form.nome, email: form.email.toLowerCase() })
    if (form.senha) {
      // senha nova: recria a conta local com a nova senha (backend trata sua própria auth)
      const contas = JSON.parse(localStorage.getItem('mercadoDaCopaContas') || '[]')
      const idx = contas.findIndex((c) => c.email === usuario.email)
      if (idx >= 0) { contas[idx].password = form.senha; localStorage.setItem('mercadoDaCopaContas', JSON.stringify(contas)) }
      toast('Senha atualizada!')
    }
    setEditando(false)
    setForm({ nome: form.nome, email: form.email, senha: '' })
    setSenhaAntiga('')
  }

  return (
    <div className="container">
      <h1 className="section-title" style={{ marginTop: 0 }}>Minha conta</h1>

      <div className="form-card wide">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <img className="avatar" src={usuario?.avatar_src || '/img-avatares/vini.jpg'} alt="Avatar" style={{ width: 64, height: 64 }} />
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.3rem' }}>{usuario?.nome_exibicao?.toUpperCase()}</div>
            <div style={{ color: 'var(--text-dim)' }}>{usuario?.email}</div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setEditando(true)}>EDITAR</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <div className="pd-cell" style={{ textAlign: 'center' }}>
            <span>Favoritos</span><strong style={{ fontSize: '1.2rem', color: 'var(--copa-yellow)' }}>{favoritos.length}</strong>
          </div>
          <div className="pd-cell" style={{ textAlign: 'center' }}>
            <span>Em venda</span><strong style={{ fontSize: '1.2rem', color: 'var(--copa-yellow)' }}>{vendas.length}</strong>
          </div>
          <div className="pd-cell" style={{ textAlign: 'center' }}>
            <span>Propostas</span><strong style={{ fontSize: '1.2rem', color: 'var(--copa-yellow)' }}>{propostas.length}</strong>
          </div>
          <div className="pd-cell" style={{ textAlign: 'center' }}>
            <span>Pedidos</span><strong style={{ fontSize: '1.2rem', color: 'var(--copa-yellow)' }}>{pedidos.length}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
          <Link to="/vendas" className="btn btn-ghost">🏷️ Gerar venda</Link>
          <Link to="/trocas" className="btn btn-ghost">🤝 Minhas trocas</Link>
          <Link to="/notificacoes" className="btn btn-ghost">🔔 Notificações</Link>
          <button className="btn btn-danger" onClick={() => { logout(); navigate('/login') }}>SAIR DA CONTA</button>
        </div>
      </div>

      <h2 className="section-title">Histórico de pedidos</h2>
      {pedidos.length === 0 ? (
        <p style={{ color: 'var(--text-dim)' }}>Você ainda não fez pedidos. <Link to="/catalogo" className="header-link">Ver catálogo</Link></p>
      ) : (
        pedidos.map((p) => (
          <div className="list-card" key={p.id}>
            <div className="lc-body">
              <div className="lc-title">Pedido {String(p.id).slice(-6).toUpperCase()} · {p.status}</div>
              <div className="lc-sub">
                {p.itens.map((i) => i.nome).join(', ')} · {p.pagamento} · {p.data || nowDate()}
              </div>
            </div>
            <strong style={{ color: 'var(--copa-yellow)' }}>{formatBRL(p.total)}</strong>
          </div>
        ))
      )}

      {editando && (
        <Modal title="Editar perfil" onClose={() => setEditando(false)}>
          <div className="field">
            <label htmlFor="pf-nome">Nome de exibição</label>
            <input id="pf-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="pf-email">E-mail</label>
            <input id="pf-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="pf-senha">Nova senha (opcional)</label>
            <input id="pf-senha" type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} placeholder="Deixe vazio para manter" />
          </div>
          <button className="btn btn-yellow btn-block" onClick={salvar}>SALVAR ALTERAÇÕES</button>
        </Modal>
      )}
    </div>
  )
}
