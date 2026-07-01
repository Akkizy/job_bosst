'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError('E-mail ou senha incorretos.'); return }
    router.push('/dashboard'); router.refresh()
  }

  return (
    <div className="auth-wrap">
      <div className="auth-logo">vagas<span>.diárias</span></div>
      <div className="auth-title">Bem-vindo de volta.</div>
      <div className="auth-sub">Acesse para ver suas vagas do dia.</div>
      <form onSubmit={handleSubmit}>
        <div className="field"><label>E-mail</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div className="field"><label>Senha</label><input type="password" required value={password} onChange={e => setPassword(e.target.value)} /></div>
        {error && <div className="msg-error">{error}</div>}
        <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
      </form>
      <p className="auth-link">Ainda não tem conta? <a href="/signup">Criar conta</a></p>
    </div>
  )
}
