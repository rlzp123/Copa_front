import { useState } from 'react'
import { useApp } from '../context/AppContext'

const CORES = ['#009b3a', '#ffc107', '#002d5a', '#d32f2f', '#ffdc00', '#2e7d32']

export default function Radar() {
  const { pessoas } = useApp()
  const [distancia, setDistancia] = useState('1km')

  const ordenadas = [...pessoas].sort((a, b) => {
    const dist = (d) => {
      const num = parseFloat(String(d).replace(',', '.'))
      return /km/i.test(d) ? num * 1000 : num
    }
    return dist(a.distancia) - dist(b.distancia)
  })

  const filtradas = ordenadas.filter((p) => {
    const limite = parseFloat(distancia) * (/km/i.test(distancia) ? 1000 : 1)
    const num = /km/i.test(p.distancia) ? parseFloat(p.distancia) * 1000 : parseFloat(p.distancia)
    return num <= limite
  })

  return (
    <div className="container">
      <h1 className="section-title" style={{ marginTop: 0 }}>📡 Radar de pessoas próximas</h1>
      <p style={{ color: 'var(--text-dim)', marginBottom: 18 }}>
        Torcedores perto de você com itens na cabeça. Use o radar para encontrar trocas e vendas locais.
      </p>

      <div className="filters">
        <div className="field" style={{ marginBottom: 0, maxWidth: 280 }}>
          <label htmlFor="radar-dist">Mostrar torcedores até</label>
          <select id="radar-dist" value={distancia} onChange={(e) => setDistancia(e.target.value)}>
            <option value="500m">500 m</option>
            <option value="1km">1 km</option>
            <option value="5km">5 km</option>
            <option value="10km">10 km</option>
          </select>
        </div>
      </div>

      {filtradas.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">📡</span>
          Nenhum torcedor encontrado nessa distância.
        </div>
      ) : (
        filtradas.map((p, i) => (
          <div className="list-card" key={p.id}>
            <img className="avatar" src={p.avatar} alt={p.nome} style={{ outline: `2px solid ${CORES[i % CORES.length]}` }} />
            <div className="lc-body">
              <div className="lc-title">{p.nome}</div>
              <div className="lc-sub">
                <span className="tag">📏 {p.distancia}</span> {' '}
                <span style={{ color: 'var(--copa-yellow)' }}>🔍 {p.item_interesse}</span>
              </div>
            </div>
            <span className="tag" style={{ background: 'rgba(0,155,58,.2)', color: 'var(--success)' }}>Disponível</span>
          </div>
        ))
      )}
    </div>
  )
}
