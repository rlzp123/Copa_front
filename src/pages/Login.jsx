import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Login() {
  const { login, toast } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErro('')
    if (!email.trim() || !senha) { setErro('Informe e-mail e senha.'); return }
    setCarregando(true)
    const res = await login(email, senha)
    setCarregando(false)
    if (res.ok) {
      toast('👋 Bem-vindo de volta!')
      navigate(location.state?.de || '/', { replace: true })
    } else {
      setErro(res.erro || 'Não foi possível entrar.')
    }
  }

  return (
    <div className="auth-screen">
      <div className="form-card auth-card">
        <img className="auth-logo" src="/img-logos-jogadores/Logo-Copa.jpg" alt="Mercado da Copa" />
        <h1 className="form-title" style={{ textAlign: 'center' }}>JOGADOR EXPERIENTE</h1>
        <p className="form-subtitle" style={{ textAlign: 'center' }}>Faça login para acessar a loja</p>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="log-email">E-mail</label>
            <input id="log-email" type="email" placeholder="admin@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="log-pass">Senha</label>
            <input id="log-pass" type="password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" />
          </div>
          {erro && <p className="field-error" role="alert">{erro}</p>}
          <button className="btn btn-yellow btn-block" type="submit" disabled={carregando}>
            {carregando ? 'ENTRAND...' : 'ACESSAR LOJA'}
          </button>
        </form>
        <span className="auth-switch">
          NÃO TEM CONTA? <Link to="/register"><button type="button">CRIE AQUI</button></Link>
        </span>
      </div>
    </div>
  )
}
