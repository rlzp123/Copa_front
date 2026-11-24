import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatBRL } from '../lib/format'

export default function CartDrawer({ aberto, onFechar }) {
  const { carrinho, alterarQtd, removerItem, subtotal, frete, total } = useApp()
  const navigate = useNavigate()

  return (
    <>
      {aberto && <div className="cart-drawer-overlay" onClick={onFechar} />}
      <aside className="cart-drawer" style={{ transform: aberto ? 'translateX(0)' : 'translateX(100%)', transition: 'transform .22s ease', pointerEvents: aberto ? 'auto' : 'none' }} aria-hidden={!aberto}>
        <div className="cart-head">
          <span>Meu Carrinho 🛒</span>
          <button className="icon-btn" onClick={onFechar} aria-label="Fechar carrinho">✕</button>
        </div>

        <div className="cart-items">
          {carrinho.length === 0 ? (
            <div className="empty-state">
              <span className="emoji">🛒</span>
              Seu carrinho está vazio.
            </div>
          ) : (
            carrinho.map((i) => (
              <div className="cart-item" key={i.id}>
                <img src={i.img} alt={i.nome} />
                <div className="ci-body">
                  <div className="ci-name">{i.nome}</div>
                  <div className="ci-price">{formatBRL(i.preco)}</div>
                  <div className="ci-bottom">
                    <div className="qty">
                      <button onClick={() => alterarQtd(i.id, -1)} aria-label="Diminuir quantidade">−</button>
                      <span>{i.qtd}</span>
                      <button onClick={() => alterarQtd(i.id, 1)} aria-label="Aumentar quantidade">+</button>
                    </div>
                    <button className="ci-remove" onClick={() => removerItem(i.id)} aria-label="Remover item">🗑️</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {carrinho.length > 0 && (
          <div className="cart-foot">
            <div className="cart-line"><span>Subtotal</span><strong>{formatBRL(subtotal)}</strong></div>
            <div className="cart-line"><span>Frete</span><strong>{frete > 0 ? formatBRL(frete) : 'Grátis'}</strong></div>
            <div className="cart-total"><span>TOTAL</span><strong>{formatBRL(total)}</strong></div>
            <button className="btn btn-block" style={{ background: 'var(--copa-green)' }} onClick={() => { onFechar(); navigate('/checkout') }}>
              FINALIZAR COMPRA
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
