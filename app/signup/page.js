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
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setDone(true)
  }

  return (
    <div className="wrap">
      <p className="eyebrow">Criar conta</p>
      <h1>Suas vagas, todo dia.</h1>
      <p className="subtitle">Crie sua conta e configure o cargo e modelo de trabalho que você procura.</p>
      {done ? (
        <div className="success">Conta criada! Verifique seu e-mail para confirmar e depois <a href="/login">faça login</a>.</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="password">Senha</label>
          <input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>{loading ? 'Criando conta...' : 'Criar conta'}</button>
        </form>
      )}
      <p className="link-row">Já tem conta? <a href="/login">Entrar</a></p>
    </div>
  )
}
