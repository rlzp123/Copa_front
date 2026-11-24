import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatBRL, nowDate } from '../lib/format'
import Modal from '../components/Modal'

const CATEGORIAS = ['Camisas', 'Bolas', 'Colecionáveis', 'Equipamentos', 'Acessórios', 'Outros']

export default function Vendas() {
  const { vendas, publicarProduto, removerVenda, toast, produtos } = useApp()
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState({ nome: '', preco: '', estoque: '1', categoria: 'Colecionáveis', desc: '', img: '' })
  const fileRef = useRef(null)

  const onFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm({ ...form, img: reader.result })
    reader.readAsDataURL(file)
  }

  const reset = () => {
    setForm({ nome: '', preco: '', estoque: '1', categoria: 'Colecionáveis', desc: '', img: '' })
    if (fileRef.current) fileRef.current.value = ''
  }

  const submit = () => {
    if (!form.nome.trim() || !form.preco || Number(form.preco) <= 0) {
      toast('Informe nome e preço válidos.', 'warn')
      return
    }
    const img = form.img || (produtos[0]?.img || '/img-vendas/bandeira.webp')
    publicarProduto({
      nome: form.nome.trim(),
      preco: Number(form.preco),
      estoque: Math.max(0, Number(form.estoque || 1)),
      categoria: form.categoria,
      desc: form.desc.trim() || 'Item esportivo do Mercado da Copa.',
      img,
    })
    toast('✅ Produto publicado na vitrine!')
    reset()
    setCriando(false)
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        <h1 className="section-title" style={{ margin: 0 }}>Vender na Copa</h1>
        <button className="btn btn-yellow btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setCriando(true)}>+ NOVO PRODUTO</button>
      </div>
      <p style={{ color: 'var(--text-dim)' }}>Suas peças aparecem na vitrine para todos os torcedores.</p>

      <h2 className="section-title">Meus produtos à venda ({vendas.length})</h2>
      {vendas.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">🏷️</span>
          Você ainda não publicou nenhum item.
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-yellow" onClick={() => setCriando(true)}>PUBLICAR PRIMEIRO ITEM</button>
          </div>
        </div>
      ) : (
        <div className="grid-products">
          {vendas.map((v) => (
            <div key={v.id} className="product-card">
              <div className="card-img"><img src={v.img} alt={v.nome} /></div>
              <div className="card-body">
                <span className="card-cat">{v.categoria} · Vendedor</span>
                <div className="card-name">{v.nome}</div>
                <div className="card-price">{formatBRL(v.preco)}</div>
                <div className="card-stock">{v.estoque} no estoque · {v.data || nowDate()}</div>
                <div className="card-actions">
                  <Link to="/catalogo" className="btn btn-sm btn-ghost">Ver catálogo</Link>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => { removerVenda(v.id); toast('Item removido da vitrine.') }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {criando && (
        <Modal title="Publicar produto" onClose={() => setCriando(false)} wide>
          <div className="field">
            <label htmlFor="v-nome">Nome do item</label>
            <input id="v-nome" placeholder="Ex: Camisa Brasil 2002" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div className="filter-row">
            <div className="field">
              <label htmlFor="v-preco">Preço (R$)</label>
              <input id="v-preco" type="number" min="0" step="0.01" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="v-estoque">Estoque</label>
              <input id="v-estoque" type="number" min="0" value={form.estoque} onChange={(e) => setForm({ ...form, estoque: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="v-categoria">Categoria</label>
            <select id="v-categoria" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
              {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="v-desc">Descrição</label>
            <textarea id="v-desc" placeholder="Detalhes do item..." value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="v-img">Imagem (opcional)</label>
            <input id="v-img" type="file" accept="image/*" ref={fileRef} onChange={onFile} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => setCriando(false)}>CANCELAR</button>
            <button className="btn btn-yellow" onClick={submit}>PUBLICAR</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
