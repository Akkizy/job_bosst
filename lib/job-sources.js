// Fontes de vagas: RemoteOK + Arbeitnow (internacionais) + Adzuna Brasil (nacionais)

export async function fetchRemoteOK() {
  const jobs = []
  try {
    const res = await fetch('https://remoteok.com/api', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 0 },
    })
    const data = await res.json()
    for (const item of data) {
      if (!item || !item.position) continue
      jobs.push({
        id: `remoteok-${item.id}`,
        title: item.position,
        company: item.company || 'N/A',
        url: item.url || `https://remoteok.com/remote-jobs/${item.id}`,
        salary_min: item.salary_min || null,
        remote: true,
        location: 'Remoto (internacional)',
        source: 'remoteok',
        market: 'internacional',
      })
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
      jobs.push({
        id: `arbeitnow-${item.slug}`,
        title: item.title,
        company: item.company_name || 'N/A',
        url: item.url || '',
        salary_min: null,
        remote: !!item.remote,
        location: item.remote ? 'Remoto (internacional)' : item.location || 'N/A',
        source: 'arbeitnow',
        market: 'internacional',
      })
    }
  } catch (e) { console.error('Erro Arbeitnow:', e.message) }
  return jobs
}

export async function fetchAdzunaBR(keyword) {
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY
  if (!appId || !appKey) {
    console.warn('Adzuna não configurado — pulando vagas brasileiras.')
    return []
  }

  const jobs = []
  try {
    const query = encodeURIComponent(keyword || 'designer')
    const url = `https://api.adzuna.com/v1/api/jobs/br/search/1?app_id=${appId}&app_key=${appKey}&what=${query}&results_per_page=50&content-type=application/json`
    const res = await fetch(url, { next: { revalidate: 0 } })
    const json = await res.json()
    for (const item of json.results || []) {
      const isRemote = item.title?.toLowerCase().includes('remoto') ||
        item.title?.toLowerCase().includes('remote') ||
        item.description?.toLowerCase().includes('remoto') || false
      jobs.push({
        id: `adzuna-${item.id}`,
        title: item.title,
        company: item.company?.display_name || 'N/A',
        url: item.redirect_url || '',
        salary_min: item.salary_min ? Math.round(item.salary_min) : null,
        remote: isRemote,
        location: item.location?.display_name || 'Brasil',
        source: 'adzuna-br',
        market: 'nacional',
      })
    }
  } catch (e) { console.error('Erro Adzuna BR:', e.message) }
  return jobs
}

export async function fetchAllJobs(keyword, market = 'ambos') {
  const fetchers = []

  if (market === 'internacional' || market === 'ambos') {
    fetchers.push(fetchRemoteOK(), fetchArbeitnow())
  }
  if (market === 'nacional' || market === 'ambos') {
    fetchers.push(fetchAdzunaBR(keyword))
  }

  const results = await Promise.all(fetchers)
  return results.flat()
}

export function matchesPreference(job, preference) {
  const titleMatches = job.title?.toLowerCase().includes(preference.job_title?.toLowerCase())
  if (!titleMatches) return false

  // Filtro de mercado
  const market = preference.market || 'ambos'
  if (market !== 'ambos' && job.market !== market) return false

  // Filtro de modelo de trabalho
  if (preference.work_model === 'qualquer') return true
  if (preference.work_model === 'remoto') return job.remote === true
  if (preference.work_model === 'presencial') return job.remote === false

  return true
}
