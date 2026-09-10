import { useState } from 'react'
import { createCatalogEntry, deleteCatalogEntry } from '../lib/db'

export default function CatalogManager({ title, table, entries, onChange }) {
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')

  async function add(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setError('')
    try {
      await createCatalogEntry(table, newName.trim())
      setNewName('')
      onChange()
    } catch {
      setError('Não foi possível adicionar (talvez já exista).')
    }
  }

  async function remove(id) {
    if (!confirm('Excluir este registro? Itens que usam este valor não serão apagados, mas ficarão sem essa informação.')) return
    try {
      await deleteCatalogEntry(table, id)
      onChange()
    } catch {
      setError('Não foi possível excluir.')
    }
  }

  return (
    <div className="catalog-card">
      <h3>{title}</h3>
      <form className="catalog-add" onSubmit={add}>
        <input
          type="text"
          placeholder={`Nova(o) ${title.toLowerCase()}...`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" className="btn-secondary">Adicionar</button>
      </form>
      {error && <p className="error-text">{error}</p>}
      <ul className="catalog-list">
        {entries.map((entry) => (
          <li key={entry.id}>
            <span>{entry.name}</span>
            <button className="icon-btn" onClick={() => remove(entry.id)} aria-label={`Excluir ${entry.name}`}>×</button>
          </li>
        ))}
        {entries.length === 0 && <li className="muted">Nenhum registro ainda.</li>}
      </ul>
    </div>
  )
}
