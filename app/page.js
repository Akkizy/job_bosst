'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setDone(true)
  }

  return (
    <div className="auth-wrap">
      <div className="auth-logo">vagas<span>.diárias</span></div>
      <div className="auth-title">Suas vagas, todo dia.</div>
      <div className="auth-sub">Configure o cargo e modelo de trabalho que você procura.</div>
      {done ? (
        <div className="msg-success">✓ Conta criada! Verifique seu e-mail e depois <a href="/login" style={{color:'#86efac'}}>faça login</a>.</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="field"><label>E-mail</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div className="field"><label>Senha</label><input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></div>
          {error && <div className="msg-error">{error}</div>}
          <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Criando...' : 'Criar conta'}</button>
        </form>
      )}
      <p className="auth-link">Já tem conta? <a href="/login">Entrar</a></p>
    </div>
  )
}
