export async function fetchRemoteOK() {
  const jobs = []
  try {
    const res = await fetch('https://remoteok.com/api', { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 0 } })
    const data = await res.json()
    for (const item of data) {
      if (!item || !item.position) continue
      jobs.push({ id: `remoteok-${item.id}`, title: item.position, company: item.company || 'N/A', url: item.url || `https://remoteok.com/remote-jobs/${item.id}`, salary_min: item.salary_min || null, remote: true, location: 'Remoto (internacional)', source: 'remoteok' })
    }
  } catch (e) { console.error('Erro RemoteOK:', e.message) }
  return jobs
}

export async function fetchArbeitnow() {
  const jobs = []
  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api', { next: { revalidate: 0 } })
    const json = await res.json()
    for (const item of json.data || []) {
      jobs.push({ id: `arbeitnow-${item.slug}`, title: item.title, company: item.company_name || 'N/A', url: item.url || '', salary_min: null, remote: !!item.remote, location: item.remote ? 'Remoto' : item.location || 'N/A', source: 'arbeitnow' })
    }
  } catch (e) { console.error('Erro Arbeitnow:', e.message) }
  return jobs
}

export async function fetchAllJobs() {
  const [a, b] = await Promise.all([fetchRemoteOK(), fetchArbeitnow()])
  return [...a, ...b]
}

export function matchesPreference(job, preference) {
  const titleMatches = job.title.toLowerCase().includes(preference.job_title.toLowerCase())
  if (!titleMatches) return false
  if (preference.work_model === 'qualquer') return true
  if (preference.work_model === 'remoto') return job.remote === true
  if (preference.work_model === 'presencial') return job.remote === false
  return true
}
