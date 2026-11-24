import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatBRL } from '../lib/format'

export default function Carrinho() {
  const { carrinho, alterarQtd, removerItem, subtotal, frete, total } = useApp()
  const navigate = useNavigate()
  const [aberto, setAberto] = useState(false)

  return (
    <div className="container">
      <h1 className="section-title" style={{ marginTop: 0 }}>Meu Carrinho</h1>

      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => setAberto(true)}>🛒 Abrir carrinho lateral</button>

      {carrinho.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">🛒</span>
          Seu carrinho está vazio.
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-yellow" onClick={() => navigate('/catalogo')}>EXPLORAR CATALÓGO</button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid-products">
            {carrinho.map((i) => (
              <div key={i.id} className="list-card" style={{ alignItems: 'flex-start' }}>
                <img src={i.img} alt={i.nome} style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }} />
                <div className="lc-body">
                  <div className="lc-title">{i.nome}</div>
                  <div className="lc-sub">{formatBRL(i.preco)} · {i.qtd} un.</div>
                  <div className="qty" style={{ marginTop: 8 }}>
                    <button onClick={() => alterarQtd(i.id, -1)}>−</button>
                    <span>{i.qtd}</span>
                    <button onClick={() => alterarQtd(i.id, 1)}>+</button>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, color: 'var(--copa-yellow)' }}>{formatBRL(i.preco * i.qtd)}</div>
                  <button className="ci-remove" onClick={() => removerItem(i.id)} aria-label="Remover">🗑️</button>
                </div>
              </div>
            ))}
          </div>

          <div className="form-card wide" style={{ marginTop: 24 }}>
            <div className="cart-line"><span>Subtotal</span><strong>{formatBRL(subtotal)}</strong></div>
            <div className="cart-line"><span>Frete</span><strong>{frete > 0 ? formatBRL(frete) : 'Grátis'}</strong></div>
            <div className="cart-total" style={{ border: 'none', padding: 0, marginTop: 8 }}>
              <span>TOTAL</span><strong>{formatBRL(total)}</strong>
            </div>
            <button className="btn btn-yellow btn-block" style={{ marginTop: 16 }} onClick={() => navigate('/checkout')}>
              FINALIZAR COMPRA
            </button>
          </div>
        </>
      )}
    </div>
  )
}
