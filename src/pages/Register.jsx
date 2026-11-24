import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Register() {
  const { register, toast } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nome: '', email: '', senha: '' })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const valido = (email, senha) =>
    email.includes('@') && email.includes('.') && senha.length >= 6

  const submit = async (e) => {
    e.preventDefault()
    setErro('')
    if (!form.nome.trim() || !form.email.trim() || !form.senha) {
      setErro('Preencha todos os campos.')
      return
    }
    if (!valido(form.email, form.senha)) {
      setErro('Use um e-mail válido e uma senha com pelo menos 6 caracteres.')
      return
    }
    setCarregando(true)
    const res = await register(form.nome, form.email, form.senha)
    setCarregando(false)
    if (res.ok) {
      toast('🎉 Conta criada! Seja bem-vindo ao Mercado da Copa.')
      navigate('/', { replace: true })
    } else {
      setErro(res.erro || 'Não foi possível criar a conta.')
    }
  }

  return (
    <div className="auth-screen">
      <div className="form-card auth-card">
        <img className="auth-logo" src="/img-logos-jogadores/Logo-Copa.jpg" alt="Mercado da Copa" />
        <h1 className="form-title" style={{ textAlign: 'center' }}>NOVO JOGADOR</h1>
        <p className="form-subtitle" style={{ textAlign: 'center' }}>Crie sua conta para comprar, vender e trocar</p>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="reg-name">Nome de exibição</label>
            <input id="reg-name" type="text" placeholder="Torcedor do Brasil" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="reg-email">E-mail</label>
            <input id="reg-email" type="email" placeholder="admin@gmail.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="reg-pass">Senha</label>
            <input id="reg-pass" type="password" placeholder="Pelo menos 6 caracteres" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} autoComplete="new-password" />
          </div>
          {erro && <p className="field-error" role="alert">{erro}</p>}
          <button className="btn btn-yellow btn-block" type="submit" disabled={carregando}>
            {carregando ? 'REGISTRANDO...' : 'REGISTRAR'}
          </button>
        </form>
        <span className="auth-switch">
          JÁ É UM CLIENTE? <Link to="/login"><button type="button">FAÇA LOGIN</button></Link>
        </span>
      </div>
    </div>
  )
}
