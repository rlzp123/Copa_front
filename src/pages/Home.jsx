import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import ProductCard from '../components/ProductCard'

export default function Home({ onAbrirCarrinho }) {
  const { produtos, usuario, addCarrinho, toast } = useApp()

  const destaques = [...produtos].sort((a, b) => b.preco - a.preco).slice(0, 4)
  const emAlta = [...produtos].filter((p) => p.estoque > 0).sort((a, b) => a.preco - b.preco).slice(0, 8)

  const comprarRapido = (p) => {
    if (p.estoque <= 0) return
    addCarrinho(p)
    toast(`✅ "${p.nome}" adicionado ao carrinho`)
    onAbrirCarrinho?.()
  }

  return (
    <div className="container">
      <section className="hero">
        <h1>É DIA DE COPA! ⚽🔥</h1>
        <p>
          Não fique no banco de reservas. Compre, venda ou troque seus itens esportivos
          antes que eles desapareçam do mercado. Itens raros, história do futebol e muita vibração verde e amarela.
        </p>
        <div className="hero-actions">
          <Link to="/catalogo" className="btn btn-yellow">VER TODO O CATALÓGO</Link>
          {usuario
            ? <Link to="/vendas" className="btn btn-ghost" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.5)' }}>VENDAR MINHAS PEÇAS</Link>
            : <Link to="/register" className="btn btn-ghost" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.5)' }}>CRIAR CONTA</Link>}
        </div>
      </section>

      <div className="promo-banner">
        <span className="promo-icon">🏆</span>
        <div>
          <strong>Frete grátis</strong> em compras acima de R$ 250 — e itens de colecionador com selo de autenticidade.
        </div>
      </div>

      <h2 className="section-title">Destaques da vitrine</h2>
      <div className="grid-products">
        {destaques.map((p) => <ProductCard key={p.id} produto={p} />)}
      </div>

      <h2 className="section-title">Mais procurados</h2>
      <div className="grid-products">
        {emAlta.map((p) => (
          <div key={p.id} style={{ display: 'flex', flexDirection: 'column' }}>
            <ProductCard produto={p} />
            <button className="btn btn-sm btn-block" style={{ marginTop: 8 }} onClick={() => comprarRapido(p)} disabled={p.estoque <= 0}>
              {p.estoque <= 0 ? 'Indisponível' : 'COMPRAR AGORA'}
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 34 }}>
        <Link to="/radar" className="btn btn-ghost">📡 Ver pessoas próximas</Link>
        <Link to="/avaliacoes" className="btn btn-ghost">⭐ Ver avaliações</Link>
      </div>
    </div>
  )
}
