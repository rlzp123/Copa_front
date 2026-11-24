import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatBRL, nowDate } from '../lib/format'
import Modal from '../components/Modal'

export default function Trocas() {
  const { propostas, vendas, criarProposta, responderProposta, usuario, toast } = useApp()
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState({ item_oferecido: '', item_desejado: '', desc: '' })

  const minhasVendas = vendas.filter((v) => !v.vendido)

  const submit = () => {
    if (!form.item_oferecido || !form.item_desejado) {
      toast('Selecione o item oferecido e o desejado.', 'warn')
      return
    }
    const vende = minhasVendas.find((v) => v.id === form.item_oferecido)
    criarProposta({
      item_oferecido: vende?.nome || form.item_oferecido,
      item_desejado: form.item_desejado,
      desc: form.desc.trim(),
      de: usuario?.email,
    })
    setCriando(false)
    setForm({ item_oferecido: '', item_desejado: '', desc: '' })
  }

  const statusEtiqueta = (s) =>
    s === 'aprovada' ? '🟢 Aprovada' : s === 'recusada' ? '🔴 Recusada' : '🟡 Pendente'

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        <h1 className="section-title" style={{ margin: 0 }}>Trocas</h1>
        <button className="btn btn-yellow btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setCriando(true)}>+ NOVA PROPOSTA</button>
      </div>
      <p style={{ color: 'var(--text-dim)' }}>Ofereça seus itens em troca de peças que você deseja.</p>

      <h2 className="section-title">Propostas ({propostas.length})</h2>
      {propostas.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">🤝</span>
          Nenhuma proposta por enquanto. Crie a primeira!
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-yellow" onClick={() => setCriando(true)}>CRIAR PROPOSTA</button>
          </div>
        </div>
      ) : (
        propostas.map((p) => (
          <div className="list-card" key={p.id}>
            <div className="avatar">🤝</div>
            <div className="lc-body">
              <div className="lc-title">
                {p.item_oferecido} <span style={{ color: 'var(--copa-green)' }}>↔</span> {p.item_desejado}
              </div>
              <div className="lc-sub">
                {p.desc || 'Sem descrição'} · {p.de} · {p.data || nowDate()}
              </div>
            </div>
            <span className="tag">{statusEtiqueta(p.status)}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to={`/trocas/${p.id}`} className="btn btn-sm btn-ghost">💬 Chat</Link>
              {p.status === 'pendente' && (
                <>
                  <button className="btn btn-sm" style={{ background: 'var(--success)' }} onClick={() => responderProposta(p.id, 'aprovada')}>Aprovar</button>
                  <button className="btn btn-sm btn-danger" onClick={() => responderProposta(p.id, 'recusada')}>Recusar</button>
                </>
              )}
            </div>
          </div>
        ))
      )}

      {criando && (
        <Modal title="Nova proposta de troca" onClose={() => setCriando(false)}>
          {minhasVendas.length === 0 && (
            <p style={{ color: 'var(--text-dim)', marginBottom: 12 }}>
              Para trocar, você precisa ter pelo menos um item publicado. <Link to="/vendas" className="header-link">Vá até Vender</Link>.
            </p>
          )}
          <div className="field">
            <label htmlFor="t-oferece">Item que você oferece</label>
            <select id="t-oferece" value={form.item_oferecido} onChange={(e) => setForm({ ...form, item_oferecido: e.target.value })} disabled={minhasVendas.length === 0}>
              <option value="">Selecione...</option>
              {minhasVendas.map((v) => <option key={v.id} value={v.id}>{v.nome} — {formatBRL(v.preco)}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="t-deseja">Item que você deseja</label>
            <input id="t-deseja" placeholder="Ex: Camisa Holanda 1974" value={form.item_desejado} onChange={(e) => setForm({ ...form, item_desejado: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="t-desc">Mensagem (opcional)</label>
            <textarea id="t-desc" placeholder="Detalhes da troca..." value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => setCriando(false)}>CANCELAR</button>
            <button className="btn btn-yellow" onClick={submit}>ENVIAR PROPOSTA</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
