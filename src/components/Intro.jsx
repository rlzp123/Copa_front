import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'

export default function Intro() {
  const { setIntroAtivo } = useApp()
  const [pulando, setPulando] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setPulando(true)
      setTimeout(() => setIntroAtivo(false), 450)
    }, 2500)
    return () => clearTimeout(timer)
  }, [setIntroAtivo])

  const pular = () => {
    setPulando(true)
    setIntroAtivo(false)
  }

  return (
    <div className="intro-screen" role="dialog" aria-label="Apresentação">
      <div style={{ opacity: pulando ? 0 : 1, transition: 'opacity .4s' }}>
        <div className="ball">⚽</div>
        <h1>MERCADO DA COPA</h1>
        <p>O mercado para comprar, vender e trocar itens esportivos da história das Copas do Mundo.</p>
        <div className="intro-progress" aria-hidden="true"><i /></div>
        <button className="btn btn-yellow" onClick={pular}>PULAR ABERTURA</button>
      </div>
    </div>
  )
}
