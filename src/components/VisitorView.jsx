import { useEffect, useMemo, useState } from 'react'
import { listItemsFull, listCatalog, createRequest } from '../lib/db'

export default function VisitorView({ onBack }) {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [functions, setFunctions] = useState([])
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [functionFilter, setFunctionFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestItem, setRequestItem] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [itemsData, cats, funcs] = await Promise.all([
        listItemsFull(),
        listCatalog('categories'),
        listCatalog('functions'),
      ])
      setItems(itemsData)
      setCategories(cats)
      setFunctions(funcs)
    } catch (e) {
      setError('Não foi possível carregar o estoque. Verifique a conexão.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      if (categoryFilter && item.category?.id !== Number(categoryFilter)) return false
      if (functionFilter && item.function?.id !== Number(functionFilter)) return false
      if (!q) return true
      const names = [item.name, ...(item.item_aliases || []).map((a) => a.alias)]
      return names.some((n) => n.toLowerCase().includes(q))
    })
  }, [items, query, categoryFilter, functionFilter])

  return (
    <div className="visitor">
      <header className="visitor-header">
        <div className="visitor-header-top">
          <button className="link-btn" onClick={onBack}>← Voltar</button>
          <img src="/logo.png" alt="Engetmix" className="visitor-logo" />
        </div>
        <h1>Pesquisar material</h1>
      </header>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar por nome ou apelido do item..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <div className="filter-row">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={functionFilter} onChange={(e) => setFunctionFilter(e.target.value)}>
            <option value="">Todas as funções</option>
            {functions.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading && <p className="muted">Carregando estoque...</p>}

      {!loading && (
        <ul className="item-list">
          {filtered.length === 0 && <p className="muted">Nenhum item encontrado.</p>}
          {filtered.map((item) => (
            <li key={item.id} className="item-card">
              <div className="item-card-main">
                <div>
                  <p className="item-name">{item.name}</p>
                  <p className="item-tags">
                    {item.category?.name && <span className="tag">{item.category.name}</span>}
                    {item.function?.name && <span className="tag tag-alt">{item.function.name}</span>}
                  </p>
                  {item.item_aliases?.length > 0 && (
                    <p className="item-aliases">também conhecido como: {item.item_aliases.map((a) => a.alias).join(', ')}</p>
                  )}
                </div>
                <div className="item-stock">
                  <span className={item.quantity <= item.min_quantity ? 'stock-low' : 'stock-ok'}>
                    {item.quantity} {item.unit?.name || 'un'}
                  </span>
                  <button className="btn-primary" onClick={() => setRequestItem(item)}>
                    Requisitar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {requestItem && (
        <RequestModal
          item={requestItem}
          onClose={() => setRequestItem(null)}
          onDone={() => {
            setRequestItem(null)
            load()
          }}
        />
      )}
    </div>
  )
}

function RequestModal({ item, onClose, onDone }) {
  const [quantity, setQuantity] = useState(1)
  const [name, setName] = useState('')
  const [sector, setSector] = useState('')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Informe seu nome.')
      return
    }
    if (quantity <= 0) {
      setError('Informe uma quantidade válida.')
      return
    }
    setSending(true)
    try {
      await createRequest({
        item_id: item.id,
        requester_name: name.trim(),
        requester_sector: sector.trim(),
        quantity: Number(quantity),
        note: note.trim(),
        status: 'pendente',
      })
      onDone()
    } catch (e) {
      setError('Não foi possível enviar a requisição. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>Requisitar item</h2>
        <p className="modal-item-name">{item.name}</p>
        <p className="muted">Disponível: {item.quantity} {item.unit?.name || 'un'}</p>

        <label>
          Quantidade
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
        </label>
        <label>
          Seu nome
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Setor (opcional)
          <input type="text" value={sector} onChange={(e) => setSector(e.target.value)} />
        </label>
        <label>
          Observação (opcional)
          <textarea rows="2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex: autorizado por..., motivo da retirada..." />
        </label>

        {error && <p className="error-text">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={sending}>
            {sending ? 'Enviando...' : 'Enviar requisição'}
          </button>
        </div>
        <p className="modal-hint">O item só sai do estoque quando o almoxarife confirmar esta requisição.</p>
      </form>
    </div>
  )
}
