'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function DashboardClient({ userEmail, initialPreference, initialJobs }) {
  const router = useRouter()
  const [jobTitle, setJobTitle] = useState(initialPreference?.job_title || '')
  const [workModel, setWorkModel] = useState(initialPreference?.work_model || 'remoto')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSavePreferences(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('preferences')
      .upsert(
        { user_id: user.id, job_title: jobTitle, work_model: workModel },
        { onConflict: 'user_id' }
      )

    setSaving(false)
    if (error) {
      setError('Não foi possível salvar. Tente novamente.')
      return
    }
    setSaved(true)
    router.refresh()
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="wrap-wide">
      <div className="topbar">
        <div className="logo">
          vagas<span>.diárias</span>
        </div>
        <button className="signout" onClick={handleSignOut}>Sair</button>
      </div>

      <div className="pref-card">
        <h2>Suas preferências</h2>
        <p className="hint">Vamos buscar vagas todo dia com base nisso.</p>

        <form onSubmit={handleSavePreferences}>
          <label htmlFor="jobTitle">Cargo desejado</label>
          <input
            id="jobTitle"
            type="text"
            required
            placeholder="ex: Product Designer, Analista Financeiro, Dev Backend..."
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />

          <label htmlFor="workModel">Modelo de trabalho</label>
          <select id="workModel" value={workModel} onChange={(e) => setWorkModel(e.target.value)}>
            <option value="remoto">Remoto</option>
            <option value="hibrido">Híbrido</option>
            <option value="presencial">Presencial</option>
            <option value="qualquer">Qualquer um</option>
          </select>

          {error && <div className="error">{error}</div>}
          {saved && <div className="success">Preferências salvas.</div>}

          <button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar preferências'}
          </button>
        </form>
      </div>

      <p className="section-label">Vagas encontradas para você ({initialJobs.length})</p>

      {initialJobs.length === 0 ? (
        <div className="empty-state">
          Nenhuma vaga encontrada ainda.
          <br />
          A busca roda automaticamente todo dia — volte amanhã ou ajuste suas preferências.
        </div>
      ) : (
        <div className="job-list">
          {initialJobs.map((job) => (
            <div className="job-card" key={job.id}>
              <p className="job-title">{job.title}</p>
              <p className="job-meta">
                {job.company} · {job.location}
                {job.salary_min ? ` · a partir de $${job.salary_min}` : ''}
              </p>
              <a className="apply" href={job.url} target="_blank" rel="noopener noreferrer">
                Ver vaga →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
