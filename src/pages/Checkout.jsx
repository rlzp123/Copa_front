import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatBRL } from '../lib/format'

const ETAPAS = ['Entrega', 'Pagamento', 'Confirmação']

export default function Checkout() {
  const { carrinho, subtotal, frete, total, finalizarCompra, toast, usuario } = useApp()
  const navigate = useNavigate()
  const [etapa, setEtapa] = useState(0)
  const [formaPagamento, setFormaPagamento] = useState('Pix')
  const [endereco, setEndereco] = useState({ nome: usuario?.nome_exibicao || '', rua: '', cidade: '', cep: '' })
  const [pendente, setPendente] = useState(false)
  const [concluido, setConcluido] = useState({ itens: [], total: 0, pagamento: 'Pix' })

  if (carrinho.length === 0 && etapa !== 2) {
    return (
      <div className="container">
        <div className="empty-state">
          <span className="emoji">🛒</span>
          Seu carrinho está vazio.
          <div style={{ marginTop: 16 }}><Link to="/catalogo" className="btn btn-yellow">EXPLORAR CATALÓGO</Link></div>
        </div>
      </div>
    )
  }

  const validaEndereco = () => {
    if (!endereco.rua.trim() || !endereco.cidade.trim() || !endereco.cep.trim()) {
      toast('Preencha rua, cidade e CEP para continuar.', 'warn')
      return false
    }
    return true
  }

  const proxima = () => {
    if (etapa === 0 && !validaEndereco()) return
    if (etapa === 1) {
      setEtapa(2)
      return
    }
    setEtapa(1)
  }

  const concluir = async () => {
    setPendente(true)
    try {
      await finalizarCompra(formaPagamento)
      setConcluido({ itens: carrinho, total, pagamento: formaPagamento })
      toast('✅ Pedido finalizado com sucesso!', 'ok')
      setEtapa(2)
    } catch {
      toast('Erro ao finalizar o pedido. Tente novamente.', 'error')
    } finally {
      setPendente(false)
    }
  }

  return (
    <div className="container">
      <h1 className="section-title" style={{ marginTop: 0 }}>Finalizar compra</h1>

      <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
        {ETAPAS.map((e, i) => (
          <button
            key={e}
            onClick={() => i <= etapa && setEtapa(i)}
            className={`chip ${i === etapa ? 'active' : ''}`}
            style={{ cursor: i <= etapa ? 'pointer' : 'default' }}
          >
            {i + 1}. {e}
          </button>
        ))}
      </div>

      <div className="form-card wide">
        {etapa === 0 && (
          <>
            <h3 className="form-title">Entrega</h3>
            <p className="form-subtitle">Para onde enviamos seus itens da Copa?</p>
            <div className="field">
              <label htmlFor="ec-nome">Nome completo</label>
              <input id="ec-nome" value={endereco.nome} onChange={(e) => setEndereco({ ...endereco, nome: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="ec-rua">Rua e número</label>
              <input id="ec-rua" value={endereco.rua} onChange={(e) => setEndereco({ ...endereco, rua: e.target.value })} />
            </div>
            <div className="filter-row">
              <div className="field">
                <label htmlFor="ec-cidade">Cidade</label>
                <input id="ec-cidade" value={endereco.cidade} onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="ec-cep">CEP</label>
                <input id="ec-cep" value={endereco.cep} onChange={(e) => setEndereco({ ...endereco, cep: e.target.value })} />
              </div>
            </div>
            <button className="btn" onClick={proxima}>CONTINUAR PARA PAGAMENTO</button>
          </>
        )}

        {etapa === 1 && (
          <>
            <h3 className="form-title">Pagamento</h3>
            <p className="form-subtitle">Escolha sua forma de pagamento.</p>
            <div className="field">
              <label htmlFor="pagamento">Forma de pagamento</label>
              <select id="pagamento" value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
                <option value="Pix">Pix (Aprovação imediata)</option>
                <option value="Cartão">Cartão de crédito</option>
                <option value="Boleto">Boleto</option>
              </select>
            </div>
            <div className="cart-line"><span>Subtotal</span><strong>{formatBRL(subtotal)}</strong></div>
            <div className="cart-line"><span>Frete</span><strong>{frete > 0 ? formatBRL(frete) : 'Grátis'}</strong></div>
            <div className="cart-total" style={{ border: 'none', padding: 0, marginTop: 8 }}>
              <span>TOTAL</span><strong>{formatBRL(total)}</strong>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button className="btn btn-ghost" onClick={() => setEtapa(0)}>VOLTAR</button>
              <button className="btn btn-yellow" onClick={concluir} disabled={pendente}>
                {pendente ? 'PROCESSANDO...' : 'CONFIRMAR PAGAMENTO'}
              </button>
            </div>
          </>
        )}

        {etapa === 2 && (
          <>
            <h3 className="form-title">✅ Pedido confirmado!</h3>
            <p className="form-subtitle">
              Obrigado pela compra! Seu pedido foi registrado e o estoque dos itens já foi atualizado.
            </p>
            <div className="cart-line"><span>Forma de pagamento</span><strong>{concluido.pagamento}</strong></div>
            <div className="cart-line"><span>Total pago</span><strong>{formatBRL(concluido.total)}</strong></div>
            <div className="cart-line"><span>Itens</span><strong>{concluido.itens.length} item(s)</strong></div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button className="btn btn-ghost" onClick={() => navigate('/perfil')}>VER PEDIDOS</button>
              <button className="btn btn-yellow" onClick={() => navigate('/catalogo')}>CONTINUAR COMPRANDO</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
