/**
 * Fontes de vagas:
 * - CareerJet  → agregador global + Brasil, TODAS as áreas (sem chave)
 * - Adzuna     → Brasil + internacional, TODAS as áreas (chave gratuita)
 * - Jooble     → agregador 140k+ fontes (chave gratuita, opcional)
 * - RemoteOK   → vagas remotas tech (sem chave) — só para buscas tech/remote
 * - Remotive   → vagas remotas globais (sem chave) — só para buscas tech/remote
 * - Arbeitnow  → agregador internacional tech (sem chave) — só para buscas tech/remote
 */

// Palavras-chave que indicam busca por área de tecnologia
const TECH_KEYWORDS = [
  'developer', 'desenvolvedor', 'engineer', 'engenheiro', 'programmer',
  'software', 'frontend', 'backend', 'fullstack', 'devops', 'data',
  'designer', 'ux', 'ui', 'product', 'mobile', 'ios', 'android',
  'react', 'python', 'javascript', 'java', 'node', 'cloud', 'qa', 'tech',
]

function isTechKeyword(keyword) {
  if (!keyword) return false
  const k = keyword.toLowerCase()
  return TECH_KEYWORDS.some(t => k.includes(t))
}

// ─── CareerJet (todas as áreas, nacional + internacional) ────
export async function fetchCareerJet(keyword, market) {
  const jobs = []
  const configs = market === 'nacional'
    ? [{ locale: 'pt_BR', location: 'Brasil' }]
    : market === 'internacional'
    ? [{ locale: 'en_US', location: '' }]
    : [{ locale: 'pt_BR', location: 'Brasil' }, { locale: 'en_US', location: '' }]

  for (const { locale, location } of configs) {
    try {
      const params = new URLSearchParams({
        keywords: keyword || '',
        location,
        locale_code: locale,
        affid: 'a28cf86fa3ce7be90e1d2e62c67e3e46',
        user_ip: '1.1.1.1',
        user_agent: 'Mozilla/5.0',
        url: 'https://job-boost-six.vercel.app',
      })
      const res = await fetch(`https://public.api.careerjet.net/search?${params}`, { next: { revalidate: 0 } })
      const json = await res.json()
      for (const item of json.jobs || []) {
        const isBR = locale === 'pt_BR'
        const isRemote = ['remoto', 'remote', 'home office']
          .some(w => (item.title + (item.description || '')).toLowerCase().includes(w))
        const rawId = (item.url || item.title || Math.random().toString()).slice(0, 40)
        jobs.push({
          id: `careerjet-${Buffer.from(rawId).toString('base64').slice(0, 24)}`,
          title: item.title,
          company: item.company || 'N/A',
          url: item.url || '',
          salary_min: null,
          remote: isRemote,
          location: item.locations || (isBR ? 'Brasil' : 'Internacional'),
          source: 'CareerJet',
          market: isBR ? 'nacional' : 'internacional',
        })
      }
    } catch (e) { console.error('Erro CareerJet:', e.message) }
  }
  return jobs
}

// ─── Adzuna (todas as áreas, nacional + internacional) ───────
export async function fetchAdzuna(keyword, market) {
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY
  if (!appId || !appKey) return []

  const jobs = []
  const countries = market === 'nacional' ? ['br'] : market === 'internacional' ? ['gb', 'us'] : ['br', 'gb']

  for (const country of countries) {
    try {
      const query = encodeURIComponent(keyword || '')
      const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&what=${query}&results_per_page=50&content-type=application/json`
      const res = await fetch(url, { next: { revalidate: 0 } })
      const json = await res.json()
      for (const item of json.results || []) {
        const isBR = country === 'br'
        const isRemote = ['remoto', 'remote', 'home office']
          .some(w => (item.title + (item.description || '')).toLowerCase().includes(w))
        jobs.push({
          id: `adzuna-${item.id}`,
          title: item.title,
          company: item.company?.display_name || 'N/A',
          url: item.redirect_url || '',
          salary_min: item.salary_min ? Math.round(item.salary_min) : null,
          remote: isRemote,
          location: item.location?.display_name || (isBR ? 'Brasil' : 'Internacional'),
          source: 'Adzuna',
          market: isBR ? 'nacional' : 'internacional',
        })
      }
    } catch (e) { console.error(`Erro Adzuna (${country}):`, e.message) }
  }
  return jobs
}

// ─── Jooble (opcional, todas as áreas) ──────────────────────
export async function fetchJooble(keyword, market) {
  const apiKey = process.env.JOOBLE_API_KEY
  if (!apiKey) return []

  const jobs = []
  const locations = market === 'nacional' ? ['Brasil'] : market === 'internacional' ? [''] : ['Brasil', '']

  for (const location of locations) {
    try {
      const res = await fetch(`https://jooble.org/api/${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: keyword || '', location, resultsOnPage: 30 }),
        next: { revalidate: 0 },
      })
      const json = await res.json()
      for (const item of json.jobs || []) {
        const isBR = location === 'Brasil' ||
          (item.location || '').toLowerCase().includes('brasil') ||
          (item.location || '').toLowerCase().includes('brazil')
        const isRemote = ['remoto', 'remote', 'home office']
          .some(w => (item.title + (item.snippet || '')).toLowerCase().includes(w))
        const rawId = (item.link || item.title || Math.random().toString()).slice(0, 40)
        jobs.push({
          id: `jooble-${Buffer.from(rawId).toString('base64').slice(0, 24)}`,
          title: item.title,
          company: item.company || 'N/A',
          url: item.link || '',
          salary_min: item.salary ? parseFloat(item.salary.replace(/[^\d.]/g, '')) || null : null,
          remote: isRemote,
          location: item.location || (isBR ? 'Brasil' : 'Internacional'),
          source: 'Jooble',
          market: isBR ? 'nacional' : 'internacional',
        })
      }
    } catch (e) { console.error('Erro Jooble:', e.message) }
  }
  return jobs
}

// ─── RemoteOK (só tech/remote) ───────────────────────────────
export async function fetchRemoteOK(keyword) {
  const jobs = []
  try {
    const res = await fetch('https://remoteok.com/api', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 0 },
    })
    const data = await res.json()
    for (const item of data) {
      if (!item?.position) continue
      if (keyword && !item.position.toLowerCase().includes(keyword.toLowerCase())) continue
      jobs.push({
        id: `remoteok-${item.id}`,
        title: item.position,
        company: item.company || 'N/A',
        url: item.url || `https://remoteok.com/remote-jobs/${item.id}`,
        salary_min: item.salary_min || null,
        remote: true,
        location: 'Remoto (internacional)',
        source: 'RemoteOK',
        market: 'internacional',
      })
    }
  } catch (e) { console.error('Erro RemoteOK:', e.message) }
  return jobs
}

// ─── Remotive (só tech/remote) ───────────────────────────────
export async function fetchRemotive(keyword) {
  const jobs = []
  try {
    const query = keyword ? `?search=${encodeURIComponent(keyword)}` : ''
    const res = await fetch(`https://remotive.com/api/remote-jobs${query}`, { next: { revalidate: 0 } })
    const json = await res.json()
    for (const item of json.jobs || []) {
      jobs.push({
        id: `remotive-${item.id}`,
        title: item.title,
        company: item.company_name || 'N/A',
        url: item.url || '',
        salary_min: null,
        remote: true,
        location: item.candidate_required_location || 'Remoto (mundial)',
        source: 'Remotive',
        market: 'internacional',
      })
    }
  } catch (e) { console.error('Erro Remotive:', e.message) }
  return jobs
}

// ─── Arbeitnow (só tech/remote) ─────────────────────────────
export async function fetchArbeitnow(keyword) {
  const jobs = []
  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api', { next: { revalidate: 0 } })
    const json = await res.json()
    for (const item of json.data || []) {
      if (keyword && !item.title.toLowerCase().includes(keyword.toLowerCase())) continue
      jobs.push({
        id: `arbeitnow-${item.slug}`,
        title: item.title,
        company: item.company_name || 'N/A',
        url: item.url || '',
        salary_min: null,
        remote: !!item.remote,
        location: item.remote ? 'Remoto (internacional)' : item.location || 'N/A',
        source: 'Arbeitnow',
        market: 'internacional',
      })
    }
  } catch (e) { console.error('Erro Arbeitnow:', e.message) }
  return jobs
}

// ─── Orquestrador principal ──────────────────────────────────
export async function fetchAllJobs(keyword, market = 'ambos') {
  // CareerJet + Adzuna + Jooble cobrem TODAS as áreas
  const fetchers = [
    fetchCareerJet(keyword, market),
    fetchAdzuna(keyword, market),
    fetchJooble(keyword, market),
  ]

  // RemoteOK, Remotive e Arbeitnow só entram para buscas tech ou internacional
  if (isTechKeyword(keyword) || market === 'internacional' || market === 'ambos') {
    fetchers.push(fetchRemoteOK(keyword), fetchRemotive(keyword), fetchArbeitnow(keyword))
  }

  const results = await Promise.allSettled(fetchers)
  const all = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])

  // Remove duplicados por URL
  const seen = new Set()
  return all.filter(job => {
    if (!job.url || seen.has(job.url)) return false
    seen.add(job.url)
    return true
  })
}

// ─── Match de preferências ───────────────────────────────────
export function matchesPreference(job, preference) {
  // Se não tem cargo definido, retorna tudo
  if (!preference.job_title?.trim()) return true

  const keyword = preference.job_title.toLowerCase()
  const title = job.title?.toLowerCase() || ''
  const company = job.company?.toLowerCase() || ''
  const location = job.location?.toLowerCase() || ''

  // Match por título (principal)
  const titleMatches = title.includes(keyword)

  // Match parcial: cada palavra da busca aparece em algum campo
  const words = keyword.split(/\s+/).filter(Boolean)
  const partialMatch = words.every(w =>
    title.includes(w) || company.includes(w) || location.includes(w)
  )

  if (!titleMatches && !partialMatch) return false

  // Filtro de mercado
  const market = preference.market || 'ambos'
  if (market !== 'ambos' && job.market !== market) return false

  // Filtro de modelo de trabalho
  if (preference.work_model === 'remoto') return job.remote === true
  if (preference.work_model === 'presencial') return job.remote === false

  return true
}
