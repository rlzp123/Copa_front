import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Header() {
  const { usuario, carrinho, notificacoes, logout, marcarLidas } = useApp()
  const [menuAberto, setMenuAberto] = useState(false)
  const navigate = useNavigate()

  const links = [
    { to: '/', label: 'Início', end: true },
    { to: '/catalogo', label: 'Catálogo' },
    { to: '/vendas', label: 'Vender' },
    { to: '/trocas', label: 'Trocas' },
    { to: '/radar', label: 'Radar' },
  ]

  const irParaNotificacoes = () => {
    marcarLidas()
    navigate('/notificacoes')
    setMenuAberto(false)
  }

  return (
    <header className="app-header">
      <div className="container header-inner">
        <NavLink to="/" className="header-logo" onClick={() => setMenuAberto(false)}>
          <span className="logo-mark">⚽</span>
          <span>Mercado da <span style={{ color: 'var(--copa-yellow)' }}>Copa</span></span>
        </NavLink>

        <button className="menu-toggle" onClick={() => setMenuAberto((v) => !v)} aria-label="Abrir menu">☰</button>

        <nav className={`header-nav ${menuAberto ? 'open' : ''}`}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `header-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuAberto(false)}
            >
              {l.label}
            </NavLink>
          ))}
          {usuario ? (
            <>
              <button className="icon-btn" onClick={irParaNotificacoes} aria-label="Notificações">
                🔔
                {notificacoes.filter((n) => !n.lida).length > 0 && (
                  <span className="badge">{notificacoes.filter((n) => !n.lida).length}</span>
                )}
              </button>
              <NavLink to="/perfil" className="header-link" onClick={() => setMenuAberto(false)}>
                Perfil
              </NavLink>
              <button className="header-link" onClick={() => { logout(); navigate('/login') }}>Sair</button>
            </>
          ) : (
            <NavLink to="/login" className="header-link" onClick={() => setMenuAberto(false)}>Entrar</NavLink>
          )}
          <button className="icon-btn" onClick={() => navigate('/carrinho')} aria-label="Carrinho">
            🛒
            {carrinho.length > 0 && <span className="badge">{carrinho.length}</span>}
          </button>
        </nav>
      </div>
    </header>
  )
}
