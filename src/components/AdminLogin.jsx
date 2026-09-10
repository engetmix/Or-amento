import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AdminLogin({ onBack, onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError('E-mail ou senha incorretos.')
      return
    }
    onSuccess()
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <button type="button" className="link-btn" onClick={onBack}>← Voltar</button>
        <h1>Acesso do almoxarife</h1>
        <p className="muted">Entre com a conta criada no Supabase para gerenciar o estoque.</p>

        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label>
          Senha
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="btn-primary btn-block" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
