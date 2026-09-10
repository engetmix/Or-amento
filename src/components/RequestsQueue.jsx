import { useState } from 'react'
import { resolveRequest } from '../lib/db'

export default function RequestsQueue({ requests, onChange }) {
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  async function handle(request, approve) {
    setBusyId(request.id)
    setError('')
    try {
      await resolveRequest(request, approve)
      onChange()
    } catch (e) {
      setError(e.message || 'Não foi possível processar esta requisição.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <h2 className="panel-title">Requisições pendentes</h2>
      <p className="muted">
        Confirme quando o item já tiver saído fisicamente do estoque. Isso dá baixa na quantidade e registra no histórico.
      </p>

      {error && <p className="error-text">{error}</p>}

      {requests.length === 0 && <p className="muted">Nenhuma requisição pendente no momento.</p>}

      <ul className="request-list">
        {requests.map((req) => (
          <li key={req.id} className="request-card">
            <div>
              <p className="item-name">{req.item?.name || 'Item removido'}</p>
              <p className="muted">
                {req.quantity} {req.item?.unit?.name || 'un'} · pedido por {req.requester_name}
                {req.requester_sector ? ` (${req.requester_sector})` : ''}
              </p>
              {req.note && <p className="request-note">"{req.note}"</p>}
              <p className="request-date">{new Date(req.created_at).toLocaleString('pt-BR')}</p>
            </div>
            <div className="request-actions">
              <button
                className="btn-tiny btn-danger"
                disabled={busyId === req.id}
                onClick={() => handle(req, false)}
              >
                Recusar
              </button>
              <button
                className="btn-tiny btn-confirm"
                disabled={busyId === req.id}
                onClick={() => handle(req, true)}
              >
                {busyId === req.id ? 'Processando...' : 'Confirmar saída'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
