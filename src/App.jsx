import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Home from './components/Home'
import VisitorView from './components/VisitorView'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'

export default function App() {
  const [screen, setScreen] = useState('home') // home | visitor | adminLogin | admin
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setScreen('admin')
      setCheckingSession(false)
    })
  }, [])

  if (checkingSession) {
    return <div className="loading-screen">Carregando...</div>
  }

  if (screen === 'visitor') {
    return <VisitorView onBack={() => setScreen('home')} />
  }
  if (screen === 'adminLogin') {
    return <AdminLogin onBack={() => setScreen('home')} onSuccess={() => setScreen('admin')} />
  }
  if (screen === 'admin') {
    return <AdminDashboard onLogout={() => setScreen('home')} />
  }
  return <Home onSelect={setScreen} />
}
