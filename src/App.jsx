import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import Header from './components/Header'
import CartDrawer from './components/CartDrawer'
import Intro from './components/Intro'
import Toasts from './components/Toasts'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Catalogo from './pages/Catalogo'
import Produto from './pages/Produto'
import Carrinho from './pages/Carrinho'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Register from './pages/Register'
import Perfil from './pages/Perfil'
import Vendas from './pages/Vendas'
import Trocas from './pages/Trocas'
import ChatTroca from './pages/ChatTroca'
import Avaliacoes from './pages/Avaliacoes'
import Notificacoes from './pages/Notificacoes'
import Radar from './pages/Radar'

function Layout() {
  const { introAtivo } = useApp()
  const [cartAberto, setCartAberto] = useState(false)

  return (
    <>
      {introAtivo && <Intro />}
      <Header />
      <main id="main" className="page">
        <Routes>
          <Route path="/" element={<Home onAbrirCarrinho={() => setCartAberto(true)} />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/produto/:id" element={<Produto onAbrirCarrinho={() => setCartAberto(true)} />} />
          <Route path="/carrinho" element={<Carrinho />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/radar" element={<Radar />} />
          <Route path="/avaliacoes" element={<Avaliacoes />} />
          <Route
            path="/perfil"
            element={<ProtectedRoute><Perfil /></ProtectedRoute>}
          />
          <Route
            path="/vendas"
            element={<ProtectedRoute><Vendas /></ProtectedRoute>}
          />
          <Route
            path="/trocas"
            element={<ProtectedRoute><Trocas /></ProtectedRoute>}
          />
          <Route
            path="/trocas/:id"
            element={<ProtectedRoute><ChatTroca /></ProtectedRoute>}
          />
          <Route
            path="/notificacoes"
            element={<ProtectedRoute><Notificacoes /></ProtectedRoute>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <div className="container">
          Mercado da Copa ⚽ · Feito com React + Vite · App instalável (PWA)
        </div>
      </footer>
      <CartDrawer aberto={cartAberto} onFechar={() => setCartAberto(false)} />
      <Toasts />
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AppProvider>
  )
}
