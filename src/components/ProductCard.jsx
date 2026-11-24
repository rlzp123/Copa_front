import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatBRL } from '../lib/format'

export default function ProductCard({ produto }) {
  const { addCarrinho, toggleFavorito, favoritos, toast } = useApp()
  const éFavorito = favoritos.includes(produto.id)
  const esgotado = produto.estoque <= 0

  const comprar = (e) => {
    e.preventDefault()
    if (esgotado) return
    addCarrinho(produto)
    toast(`✅ "${produto.nome}" adicionado ao carrinho`)
  }

  return (
    <Link to={`/produto/${produto.id}`} className="product-card">
      <div className="card-img">
        <img src={produto.img} alt={produto.nome} loading="lazy" />
        {esgotado && <div className="tag tag-esgotado" style={{ position: 'absolute', top: 8, left: 8 }}>Esgotado</div>}
      </div>
      <div className="card-body">
        <span className="card-cat">{produto.categoria || 'Mercado'}</span>
        <div className="card-name">{produto.nome}</div>
        <div className="card-price">{formatBRL(produto.preco)}</div>
        <div className="card-stock">
          {esgotado ? 'Indisponível no momento' : `${produto.estoque} unidade(s) no estoque`}
        </div>
        <div className="card-actions">
          <button className="btn btn-sm btn-ghost" onClick={comprar} disabled={esgotado}>Add 🛒</button>
          <button
            className={`btn btn-sm ${éFavorito ? 'btn-gold' : 'btn-ghost'}`}
            onClick={(e) => { e.preventDefault(); toggleFavorito(produto.id) }}
            aria-label={éFavorito ? 'Remover favorito' : 'Favoritar'}
          >
            {éFavorito ? '★' : '☆'}
          </button>
        </div>
      </div>
    </Link>
  )
}
