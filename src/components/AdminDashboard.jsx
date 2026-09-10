import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { listItemsFull, listCatalog, listPendingRequests, listMovements } from '../lib/db'
import ItemsManager from './ItemsManager'
import CatalogManager from './CatalogManager'
import RequestsQueue from './RequestsQueue'
import HistoryView from './HistoryView'

const TABS = [
  { key: 'requests', label: 'Requisições' },
  { key: 'items', label: 'Itens' },
  { key: 'catalog', label: 'Categorias, funções e unidades' },
  { key: 'history', label: 'Histórico' },
]

export default function AdminDashboard({ onLogout }) {
  const [tab, setTab] = useState('requests')
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [functions, setFunctions] = useState([])
  const [units, setUnits] = useState([])
  const [requests, setRequests] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [itemsData, cats, funcs, unitsData, reqs, moves] = await Promise.all([
        listItemsFull(),
        listCatalog('categories'),
        listCatalog('functions'),
        listCatalog('units'),
        listPendingRequests(),
        listMovements(),
      ])
      setItems(itemsData)
      setCategories(cats)
      setFunctions(funcs)
      setUnits(unitsData)
      setRequests(reqs)
      setMovements(moves)
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    onLogout()
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <img src="/logo.png" alt="Engetmix" className="dashboard-logo" />
          <h1>Painel do almoxarife</h1>
        </div>
        <button className="link-btn" onClick={logout}>Sair</button>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? 'tab tab-active' : 'tab'}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.key === 'requests' && requests.length > 0 && (
              <span className="tab-badge">{requests.length}</span>
            )}
          </button>
        ))}
      </nav>

      <main className="dashboard-content">
        {loading && <p className="muted">Carregando...</p>}
        {!loading && tab === 'requests' && (
          <RequestsQueue requests={requests} onChange={loadAll} />
        )}
        {!loading && tab === 'items' && (
          <ItemsManager items={items} categories={categories} functions={functions} units={units} onChange={loadAll} />
        )}
        {!loading && tab === 'catalog' && (
          <div className="catalog-grid">
            <CatalogManager title="Categorias" table="categories" entries={categories} onChange={loadAll} />
            <CatalogManager title="Funções" table="functions" entries={functions} onChange={loadAll} />
            <CatalogManager title="Unidades de medida" table="units" entries={units} onChange={loadAll} />
          </div>
        )}
        {!loading && tab === 'history' && (
          <HistoryView movements={movements} />
        )}
      </main>
    </div>
  )
}
