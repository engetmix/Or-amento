export default function HistoryView({ movements }) {
  return (
    <div>
      <h2 className="panel-title">Histórico de movimentações</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Data</th><th>Item</th><th>Tipo</th><th>Qtd.</th><th>Solicitante</th><th>Observação</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((m) => (
            <tr key={m.id}>
              <td>{new Date(m.created_at).toLocaleString('pt-BR')}</td>
              <td>{m.item?.name || 'Item removido'}</td>
              <td>
                <span className={m.type === 'entrada' ? 'badge badge-in' : 'badge badge-out'}>
                  {m.type === 'entrada' ? 'Entrada' : 'Saída'}
                </span>
              </td>
              <td>{m.quantity}</td>
              <td>
                {m.requester_name ? `${m.requester_name}${m.requester_sector ? ' · ' + m.requester_sector : ''}` : '—'}
              </td>
              <td>{m.note || '—'}</td>
            </tr>
          ))}
          {movements.length === 0 && (
            <tr><td colSpan="6" className="muted">Nenhuma movimentação registrada ainda.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
