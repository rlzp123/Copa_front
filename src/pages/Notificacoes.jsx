import { useApp } from '../context/AppContext'
import { Link } from 'react-router-dom'

export default function Notificacoes() {
  const { notificacoes, marcarLidas } = useApp()

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 className="section-title" style={{ margin: 0 }}>Notificações</h1>
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={marcarLidas} disabled={notificacoes.every((n) => n.lida)}>
          MARCAR COMO LIDAS
        </button>
      </div>

      {notificacoes.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">🔔</span>
          Você está com o som ligado e sem notificações novas.
        </div>
      ) : (
        notificacoes.map((n) => (
          <div key={n.id} className={`notif-item ${n.lida ? '' : 'unread'}`}>
            <div style={{ fontSize: '1.3rem' }}>
              {n.tipo === 'venda' ? '🏷️' : n.tipo === 'troca' ? '🤝' : n.tipo === 'pedido' ? '✅' : '🔔'}
            </div>
            <div className="n-body">
              <div className="n-text">{n.texto}</div>
              <div className="n-time">{n.data}</div>
            </div>
          </div>
        ))
      )}

      <div style={{ marginTop: 24 }}>
        <Link to="/" className="btn btn-ghost">Voltar ao início</Link>
      </div>
    </div>
  )
}
