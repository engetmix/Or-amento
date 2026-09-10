import { useMemo, useState } from 'react'
import { createItem, updateItem, deleteItem, addStock, replaceAliases } from '../lib/db'

const emptyForm = {
  name: '', category_id: '', function_id: '', unit_id: '',
  quantity: 0, min_quantity: 0, location: '', aliases: '',
}

export default function ItemsManager({ items, categories, functions, units, onChange }) {
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null) // item being edited, or 'new'
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [restockTarget, setRestockTarget] = useState(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((i) =>
      i.name.toLowerCase().includes(q) ||
      (i.item_aliases || []).some((a) => a.alias.toLowerCase().includes(q))
    )
  }, [items, query])

  function startNew() {
    setForm(emptyForm)
    setEditing('new')
    setError('')
  }

  function startEdit(item) {
    setForm({
      name: item.name,
      category_id: item.category?.id || '',
      function_id: item.function?.id || '',
      unit_id: item.unit?.id || '',
      quantity: item.quantity,
      min_quantity: item.min_quantity,
      location: item.location || '',
      aliases: (item.item_aliases || []).map((a) => a.alias).join(', '),
    })
    setEditing(item)
    setError('')
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Informe o nome do item.')
      return
    }
    setSaving(true)
    setError('')
    const aliases = form.aliases.split(',').map((a) => a.trim()).filter(Boolean)
    const payload = {
      name: form.name.trim(),
      category_id: form.category_id || null,
      function_id: form.function_id || null,
      unit_id: form.unit_id || null,
      quantity: Number(form.quantity) || 0,
      min_quantity: Number(form.min_quantity) || 0,
      location: form.location.trim() || null,
    }
    try {
      if (editing === 'new') {
        await createItem(payload, aliases)
      } else {
        await updateItem(editing.id, payload)
        await replaceAliases(editing.id, aliases)
      }
      setEditing(null)
      onChange()
    } catch {
      setError('Não foi possível salvar o item.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(item) {
    if (!confirm(`Excluir "${item.name}" do estoque? Esta ação não pode ser desfeita.`)) return
    try {
      await deleteItem(item.id)
      onChange()
    } catch {
      setError('Não foi possível excluir o item.')
    }
  }

  return (
    <div>
      <div className="panel-toolbar">
        <input
          type="text"
          placeholder="Buscar item ou apelido..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn-primary" onClick={startNew}>+ Novo item</button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Item</th><th>Categoria</th><th>Função</th><th>Qtd.</th><th>Local</th><th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((item) => (
            <tr key={item.id}>
              <td>
                <p className="item-name">{item.name}</p>
                {item.item_aliases?.length > 0 && (
                  <p className="item-aliases">{item.item_aliases.map((a) => a.alias).join(', ')}</p>
                )}
              </td>
              <td>{item.category?.name || '—'}</td>
              <td>{item.function?.name || '—'}</td>
              <td className={item.quantity <= item.min_quantity ? 'stock-low' : ''}>
                {item.quantity} {item.unit?.name || ''}
              </td>
              <td>{item.location || '—'}</td>
              <td className="row-actions">
                <button className="btn-tiny" onClick={() => setRestockTarget(item)}>+ Estoque</button>
                <button className="btn-tiny" onClick={() => startEdit(item)}>Editar</button>
                <button className="btn-tiny btn-danger" onClick={() => remove(item)}>Excluir</button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan="6" className="muted">Nenhum item encontrado.</td></tr>
          )}
        </tbody>
      </table>

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <h2>{editing === 'new' ? 'Novo item' : 'Editar item'}</h2>

            <label>Nome do item
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
            </label>
            <label>Apelidos (separados por vírgula)
              <input
                value={form.aliases}
                onChange={(e) => setForm({ ...form, aliases: e.target.value })}
                placeholder="Ex: parafuso philips, parafuso cruzado"
              />
            </label>
            <div className="form-row">
              <label>Categoria
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">—</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label>Função
                <select value={form.function_id} onChange={(e) => setForm({ ...form, function_id: e.target.value })}>
                  <option value="">—</option>
                  {functions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </label>
            </div>
            <div className="form-row">
              <label>Unidade de medida
                <select value={form.unit_id} onChange={(e) => setForm({ ...form, unit_id: e.target.value })}>
                  <option value="">—</option>
                  {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </label>
              <label>Local (opcional)
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ex: Prateleira A3" />
              </label>
            </div>
            <div className="form-row">
              <label>{editing === 'new' ? 'Quantidade inicial' : 'Quantidade em estoque'}
                <input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </label>
              <label>Estoque mínimo
                <input type="number" min="0" value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: e.target.value })} />
              </label>
            </div>

            {error && <p className="error-text">{error}</p>}

            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </form>
        </div>
      )}

      {restockTarget && (
        <RestockModal
          item={restockTarget}
          onClose={() => setRestockTarget(null)}
          onDone={() => { setRestockTarget(null); onChange() }}
        />
      )}
    </div>
  )
}

function RestockModal({ item, onClose, onDone }) {
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await addStock(item.id, Number(quantity), item.quantity, note.trim())
      onDone()
    } catch {
      setError('Não foi possível registrar a entrada.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>Registrar entrada</h2>
        <p className="modal-item-name">{item.name}</p>
        <p className="muted">Estoque atual: {item.quantity} {item.unit?.name || 'un'}</p>
        <label>Quantidade a adicionar
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
        </label>
        <label>Observação (opcional)
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex: compra NF 1234" />
        </label>
        {error && <p className="error-text">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Registrar entrada'}</button>
        </div>
      </form>
    </div>
  )
}
