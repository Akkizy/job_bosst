'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function DashboardClient({ userEmail, initialPreference, initialJobs }) {
  const router = useRouter()
  const [jobTitle, setJobTitle] = useState(initialPreference?.job_title || '')
  const [workModel, setWorkModel] = useState(initialPreference?.work_model || 'qualquer')
  const [market, setMarket] = useState(initialPreference?.market || 'ambos')
  const [salaryMin, setSalaryMin] = useState(initialPreference?.salary_min || '')
  const [saving, setSaving] = useState(false)
  const [searching, setSearching] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [jobs, setJobs] = useState(initialJobs)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return jobs
    const q = search.toLowerCase()
    return jobs.filter(j =>
      j.title?.toLowerCase().includes(q) ||
      j.company?.toLowerCase().includes(q) ||
      j.location?.toLowerCase().includes(q)
    )
  }, [jobs, search])

  async function savePreferences() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return supabase.from('preferences').upsert(
      { user_id: user.id, job_title: jobTitle, work_model: workModel, market, salary_min: salaryMin || null },
      { onConflict: 'user_id' }
    )
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true); setSaved(false); setSaveErr('')
    const { error } = await savePreferences()
    setSaving(false)
    if (error) { setSaveErr('Erro ao salvar.'); return }
    setSaved(true)
  }

  async function handleSearch() {
    if (!jobTitle.trim()) { setSaveErr('Preencha o cargo antes de buscar.'); return }
    setSaveErr(''); setSearching(true); setSaved(false)
    await savePreferences()
    try {
      const res = await fetch('/api/match-jobs', { method: 'POST' })
      const data = await res.json()
      if (data.jobs) setJobs(data.jobs)
      setSaved(true)
    } catch (e) { console.error(e) }
    setSearching(false)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login'); router.refresh()
  }

  function MarketTag({ market }) {
    if (market === 'nacional') return <span className="tag tag-nacional">🇧🇷 Nacional</span>
    if (market === 'internacional') return <span className="tag tag-internacional">🌎 Internacional</span>
    return null
  }

  function ModelTag({ remote }) {
    return remote
      ? <span className="tag tag-remote">🌐 Remoto</span>
      : <span className="tag tag-onsite">🏢 Presencial</span>
  }

  return (
    <div className="dash">
      <aside className="sidebar">
        <div className="logo">vagas<span>.diárias</span></div>
        <div className="user-pill">👤 {userEmail}</div>

        <div>
          <p className="section-title">🎯 Preferências</p>
          <div className="filter-group">
            <input
              type="text"
              placeholder="Cargo (ex: Dev Backend, Designer...)"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
            />

            <select value={market} onChange={e => setMarket(e.target.value)}>
              <option value="ambos">🌍 Nacional + Internacional</option>
              <option value="nacional">🇧🇷 Só Nacional (Brasil)</option>
              <option value="internacional">🌎 Só Internacional</option>
            </select>

            <select value={workModel} onChange={e => setWorkModel(e.target.value)}>
              <option value="qualquer">🔀 Qualquer modelo</option>
              <option value="remoto">🌐 Remoto</option>
              <option value="hibrido">🔁 Híbrido</option>
              <option value="presencial">🏢 Presencial</option>
            </select>

            <input
              type="number"
              placeholder="Salário mínimo (opcional)"
              value={salaryMin}
              onChange={e => setSalaryMin(e.target.value)}
            />
          </div>
          {saveErr && <p className="save-err" style={{marginTop:8}}>{saveErr}</p>}
          {saved && <p className="save-msg" style={{marginTop:8}}>✓ Preferências salvas</p>}
        </div>

        <button className="btn-search" onClick={handleSearch} disabled={searching}>
          {searching ? '⏳ Buscando...' : '🔍 Buscar vagas agora'}
        </button>

        <button
          style={{padding:'8px',background:'transparent',color:'#9090a8',border:'1px solid #2e2e3e',borderRadius:'8px',fontSize:'13px',cursor:'pointer'}}
          onClick={handleSave} disabled={saving}
        >
          {saving ? 'Salvando...' : '💾 Só salvar preferências'}
        </button>

        <button className="btn-signout" onClick={handleSignOut}>Sair →</button>
      </aside>

      <main className="main">
        <div className="main-header">
          <h1>Vagas para você <span className="badge">{filtered.length}</span></h1>
        </div>

        <input
          className="search-bar"
          placeholder="🔎 Filtrar por título, empresa ou localização..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {searching && <div className="spinner" />}

        {!searching && filtered.length === 0 && (
          <div className="empty">
            <h3>Nenhuma vaga encontrada</h3>
            <p>Configure seu cargo e clique em <strong>"Buscar vagas agora"</strong><br/>para ver as vagas que combinam com seu perfil.</p>
          </div>
        )}

        {!searching && filtered.length > 0 && (
          <div className="jobs-grid">
            {filtered.map(job => (
              <div className="job-card" key={job.id}>
                <div className="job-card-header">
                  <span className="job-title">{job.title}</span>
                  {job.salary_min && (
                    <span className="job-salary">
                      {job.market === 'nacional' ? `R$ ${job.salary_min.toLocaleString('pt-BR')}` : `$${job.salary_min.toLocaleString()}`}
                    </span>
                  )}
                </div>
                <div className="job-meta">
                  <span className="job-company">🏢 {job.company}</span>
                  <span className="job-company">📍 {job.location}</span>
                  <ModelTag remote={job.remote} />
                  <MarketTag market={job.market} />
                  <span className="tag tag-source">{job.source}</span>
                </div>
                <a className="job-link" href={job.url} target="_blank" rel="noopener noreferrer">
                  Ver vaga →
                </a>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
