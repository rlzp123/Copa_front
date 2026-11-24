import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { categorias } from '../lib/catalogo'
import { formatBRL } from '../lib/format'
import ProductCard from '../components/ProductCard'

export default function Catalogo() {
  const { produtos } = useApp()
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('Todas')
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')
  const [ordenar, setOrdenar] = useState('')

  const filtrados = useMemo(() => {
    let lista = produtos.filter((p) => {
      const texto = `${p.nome} ${p.desc || ''} ${p.categoria || ''}`.toLowerCase()
      const okBusca = !busca || texto.includes(busca.toLowerCase())
      const okCat = categoria === 'Todas' || p.categoria === categoria
      const preco = Number(p.preco)
      const okMin = !min || preco >= Number(min)
      const okMax = !max || preco <= Number(max)
      return okBusca && okCat && okMin && okMax
    })
    if (ordenar === 'preco-asc') lista = [...lista].sort((a, b) => a.preco - b.preco)
    if (ordenar === 'preco-desc') lista = [...lista].sort((a, b) => b.preco - a.preco)
    if (ordenar === 'nome') lista = [...lista].sort((a, b) => a.nome.localeCompare(b.nome))
    return lista
  }, [produtos, busca, categoria, min, max, ordenar])

  return (
    <div className="container">
      <h1 className="section-title" style={{ marginTop: 0 }}>Catálogo</h1>

      <div className="filters">
        <div className="field">
          <label htmlFor="busca">Buscar</label>
          <input id="busca" type="search" placeholder="Ex: camisa, 1970, medalha..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="categoria">Categoria</label>
          <select id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="filter-row">
          <div className="field">
            <label htmlFor="min">Preço mínimo</label>
            <input id="min" type="number" min="0" placeholder="R$ 0" value={min} onChange={(e) => setMin(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="max">Preço máximo</label>
            <input id="max" type="number" min="0" placeholder="R$ 5000" value={max} onChange={(e) => setMax(e.target.value)} />
          </div>
        </div>
        <div className="filter-row">
          <div className="field">
            <label htmlFor="ordenar">Ordenar</label>
            <select id="ordenar" value={ordenar} onChange={(e) => setOrdenar(e.target.value)}>
              <option value="">Relevância</option>
              <option value="preco-asc">Menor preço</option>
              <option value="preco-desc">Maior preço</option>
              <option value="nome">Nome (A-Z)</option>
            </select>
          </div>
          <div className="field" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setBusca(''); setCategoria('Todas'); setMin(''); setMax(''); setOrdenar('') }}
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </div>

      <p style={{ color: 'var(--text-dim)', marginBottom: 16 }}>{filtrados.length} item(s) encontrado(s)</p>

      {filtrados.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">🔍</span>
          Nenhum produto corresponde aos seus filtros.
        </div>
      ) : (
        <div className="grid-products">
          {filtrados.map((p) => <ProductCard key={p.id} produto={p} />)}
        </div>
      )}
    </div>
  )
}
