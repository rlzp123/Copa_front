import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Avaliacoes() {
  const { avaliacoes, produtos } = useApp()
  const [busca, setBusca] = useState('')

  const porProduto = useMemo(() => {
    const map = {}
    for (const a of avaliacoes) {
      if (!map[a.produtoId]) map[a.produtoId] = []
      map[a.produtoId].push(a)
    }
    return map
  }, [avaliacoes])

  const produtosAvaliados = Object.keys(porProduto).map(Number).filter((id) => {
    const p = produtos.find((x) => x.id === id)
    return !busca || (p?.nome || '').toLowerCase().includes(busca.toLowerCase())
  })

  return (
    <div className="container">
      <h1 className="section-title" style={{ marginTop: 0 }}>Avaliações</h1>

      <div className="filters">
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="av-busca">Filtrar por produto</label>
          <input id="av-busca" type="search" placeholder="Nome do produto..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
      </div>

      {produtosAvaliados.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">⭐</span>
          Nenhuma avaliação registrada.
            <div style={{ marginTop: 16 }}><Link to="/catalogo" className="btn btn-yellow">COMPRAR E AVALIAR</Link></div>
        </div>
      ) : (
        produtosAvaliados.map((pid) => {
          const p = produtos.find((x) => x.id === pid)
          const items = porProduto[pid]
          const media = items.reduce((s, a) => s + a.nota, 0) / items.length
          return (
            <div key={pid} style={{ marginBottom: 28 }}>
              <h2 className="section-title" style={{ fontSize: '1.1rem' }}>
                {p?.name || `Produto #${pid}`}
                <span className="stars" style={{ fontSize: '.9rem', marginLeft: 8 }}>
                  {'★'.repeat(Math.round(media))}{'☆'.repeat(5 - Math.round(media))}
                </span>
                <span style={{ color: 'var(--text-dim)', fontSize: '.85rem', fontWeight: 400, marginLeft: 8 }}>
                  ({items.length})
                </span>
              </h2>
              {items.map((a) => (
                <div className="review-card" key={a.id}>
                  <div className="stars">{'★'.repeat(a.nota)}{'☆'.repeat(5 - a.nota)}</div>
                  <div className="review-meta">{a.de} · {a.data}</div>
                  <p style={{ fontSize: '.9rem' }}>{a.texto}</p>
                </div>
              ))}
            </div>
          )
        })
      )}
    </div>
  )
}
