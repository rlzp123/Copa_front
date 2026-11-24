import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function ChatTroca() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { propostas, chats, abrirChat, enviarMensagem } = useApp()
  const [texto, setTexto] = useState('')
  const fimRef = useRef(null)

  const proposta = propostas.find((p) => p.id === id)
  const mensagens = chats[id] || []

  useEffect(() => {
    abrirChat(id)
  }, [id, abrirChat])

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens.length])

  const enviar = (e) => {
    e.preventDefault()
    if (!texto.trim()) return
    enviarMensagem(id, texto)
    setTexto('')
  }

  if (!proposta) {
    return (
      <div className="container">
        <div className="empty-state">
          <span className="emoji">💬</span>
          Conversa não encontrada.
          <div style={{ marginTop: 16 }}><Link to="/trocas" className="btn btn-yellow">VOLTAR A TROCAS</Link></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/trocas" className="header-link">← Trocas</Link>
        <h1 className="section-title" style={{ margin: 0 }}>
          {proposta.item_oferecido} <span style={{ color: 'var(--copa-green)' }}>↔</span> {proposta.item_desejado}
        </h1>
      </div>

      <div className="chat-window">
        <div className="chat-head">
          <span className="avatar" style={{ width: 38, height: 38, fontSize: '.8rem' }}>🤝</span>
          <span>{proposta.de} · {proposta.status}</span>
        </div>
        <div className="chat-messages">
          {mensagens.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-dim)', margin: 'auto' }}>
              Comece a conversar sobre esta troca.
            </p>
          )}
          {mensagens.map((m) => (
            <div key={m.id} className={`msg ${m.de === 'mine' ? 'mine' : 'other'}`}>
              {m.texto}
              <span className="msg-time">{m.data}</span>
            </div>
          ))}
          <div ref={fimRef} />
        </div>
        <form className="chat-input" onSubmit={enviar}>
          <input
            placeholder="Escreva uma mensagem..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            aria-label="Mensagem"
          />
          <button className="btn" type="submit">ENVIAR</button>
        </form>
      </div>
    </div>
  )
}
