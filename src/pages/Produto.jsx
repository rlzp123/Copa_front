import { useMemo, useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { itensLeilao } from '../lib/catalogo'
import { formatBRL, nowTime } from '../lib/format'

export default function Produto({ onAbrirCarrinho }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { produtos, addCarrinho, toggleFavorito, favoritos, avaliacoes, salvarAvaliacao, toast, usuario } = useApp()

  const produto = produtos.find((p) => String(p.id) === String(id))

  const [lance, setLance] = useState(null)
  const [tempo, setTempo] = useState('02:15:30')
  const [avaliacao, setAvaliacao] = useState({ nota: 5, texto: '' })

  useEffect(() => {
    if (produto && itensLeilao.has(produto.id)) {
      const base = Number(produto.preco)
      setLance(base)
    }
  }, [produto])

  useEffect(() => {
    if (!itensLeilao.has(Number(id))) return
    const t = setInterval(() => {
      setTempo((atual) => {
        const [h, m, s] = atual.split(':').map(Number)
        let s2 = s - 1
        let m2 = m
        let h2 = h
        if (s2 < 0) { s2 = 59; m2 -= 1 }
        if (m2 < 0) { m2 = 59; h2 -= 1 }
        if (h2 < 0) return '00:00:00'
        return `${String(h2).padStart(2, '0')}:${String(m2).padStart(2, '0')}:${String(s2).padStart(2, '0')}`
      })
    }, 1000)
    return () => clearInterval(t)
  }, [id])

  const avaliacoesDoProduto = useMemo(
    () => avaliacoes.filter((a) => String(a.produtoId) === String(id)),
    [avaliacoes, id]
  )

  if (!produto) {
    return (
      <div className="container">
        <div className="empty-state">
          <span className="emoji">🥅</span>
          Produto não encontrado.
          <div style={{ marginTop: 16 }}><Link to="/catalogo" className="btn">Voltar ao catálogo</Link></div>
        </div>
      </div>
    )
  }

  const esgotado = produto.estoque <= 0
  const éFavorito = favoritos.includes(produto.id)
  const éLeilao = itensLeilao.has(produto.id)

  const comprar = () => {
    if (esgotado) return
    addCarrinho(produto)
    toast(`✅ "${produto.nome}" adicionado ao carrinho`)
    onAbrirCarrinho?.()
  }

  const darLance = () => {
    const novo = Number((lance * 1.1).toFixed(2))
    setLance(novo)
    toast(`💰 Lance dado: ${formatBRL(novo)}`)
  }

  const enviarAvaliacao = () => {
    if (!usuario) { navigate('/login', { state: { de: `/produto/${id}` } }); return }
    if (!avaliacao.texto.trim()) { toast('Escreva um comentário primeiro.', 'warn'); return }
    salvarAvaliacao({ produtoId: produto.id, produto: produto.nome, nota: Number(avaliacao.nota), texto: avaliacao.texto, de: usuario.email })
    toast('⭐ Avaliação enviada!')
    setAvaliacao({ nota: 5, texto: '' })
  }

  return (
    <div className="container">
      <div style={{ marginBottom: 16 }}>
        <Link to="/catalogo" className="header-link">← Voltar ao catálogo</Link>
      </div>

      <div className="product-detail">
        <div className="pd-img">
          <img src={produto.img} alt={produto.nome} />
        </div>

        <div>
          <span className="pd-kicker">{produto.categoria || 'Mercado'}</span>
          <h1 className="pd-name">{produto.nome}</h1>
          {(produto.condicao || produto.origem) && (
            <p style={{ color: 'var(--text-dim)', fontSize: '.9rem' }}>
              {produto.condicao && <span>Condição: <strong>{produto.condicao}</strong> · </span>}
              {produto.origem && <span>Origem: <strong>{produto.origem}</strong></span>}
            </p>
          )}
          <div className="pd-price">{formatBRL(produto.preco)}</div>
          <p className="pd-desc">{produto.desc}</p>

          <div className="pd-grid">
            <div className="pd-cell"><span>Disponibilidade</span><strong>{esgotado ? 'Esgotado' : `${produto.estoque} no estoque`}</strong></div>
            <div className="pd-cell"><span>Categoria</span><strong>{produto.categoria || 'Mercado'}</strong></div>
          </div>

          {!esgotado && (
            <div className="pd-actions">
              <button className="btn btn-yellow" onClick={comprar}>ADICIONAR À SACOLA</button>
              <button className={`btn ${éFavorito ? 'btn-gold' : 'btn-ghost'}`} onClick={() => toggleFavorito(produto.id)}>
                {éFavorito ? '★ Favoritado' : '☆ Favoritar'}
              </button>
            </div>
          )}

          {esgotado && <p style={{ color: 'var(--danger)', fontWeight: 700 }}>Indisponível no momento — adicione à sua lista de desejos para saber quando voltar.</p>}

          {éLeilao && (
            <div className="leilao-box">
              <h4>🔥 Leilão ao vivo</h4>
              <div className="leilao-row">
                <span>Lance atual: <strong style={{ color: 'var(--copa-yellow)', fontSize: '1.2rem' }}>{formatBRL(lance || produto.preco)}</strong></span>
                <span style={{ color: '#ff8a4c', fontWeight: 700 }}>Termina em: <span style={{ fontFamily: 'monospace' }}>{tempo}</span></span>
              </div>
              <button className="btn btn-sm" style={{ background: '#ff4500' }} onClick={darLance}>LANÇAR +10%</button>
            </div>
          )}
        </div>
      </div>

      <h2 className="section-title">Avaliações ({avaliacoesDoProduto.length})</h2>
      <div className="form-card wide" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>Escrever uma avaliação</h3>
        <div className="field">
          <label htmlFor="nota">Nota</label>
          <select id="nota" value={avaliacao.nota} onChange={(e) => setAvaliacao({ ...avaliacao, nota: e.target.value })}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} {n === 5 ? '⭐' : '☆'.repeat(n)}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="comentario">Comentário</label>
          <textarea id="comentario" placeholder="Comprou este item? Conte sua experiência..." value={avaliacao.texto} onChange={(e) => setAvaliacao({ ...avaliacao, texto: e.target.value })} />
        </div>
        <button className="btn" onClick={enviarAvaliacao}>ENVIAR AVALIAÇÃO</button>
      </div>

      {avaliacoesDoProduto.length === 0 ? (
        <p style={{ color: 'var(--text-dim)' }}>Ainda não há avaliações para este item.</p>
      ) : (
        avaliacoesDoProduto.map((a) => (
          <div className="review-card" key={a.id}>
            <div className="stars">{'★'.repeat(a.nota)}{'☆'.repeat(5 - a.nota)}</div>
            <div className="review-meta">{a.produto} · {a.de} · {a.data || nowTime()}</div>
            <p style={{ fontSize: '.9rem' }}>{a.texto}</p>
          </div>
        ))
      )}
    </div>
  )
}
