import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { fetchAllJobs, matchesPreference } from '@/lib/job-sources'

// Esta rota é chamada automaticamente todo dia pelo Vercel Cron (ver vercel.json)
// Protegida por um segredo para que só o Vercel (ou você) possa disparar

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // 1. Busca vagas novas nas fontes externas
  const jobs = await fetchAllJobs()

  // 2. Salva (ou atualiza) as vagas no banco, ignorando duplicadas
  if (jobs.length > 0) {
    const { error: upsertError } = await supabase
      .from('jobs')
      .upsert(jobs, { onConflict: 'id', ignoreDuplicates: true })
    if (upsertError) console.error('Erro ao salvar vagas:', upsertError.message)
  }

  // 3. Busca todas as preferências de todos os usuários
  const { data: allPreferences, error: prefError } = await supabase
    .from('preferences')
    .select('*')

  if (prefError) {
    return NextResponse.json({ error: prefError.message }, { status: 500 })
  }

  // 4. Para cada usuário, cruza as vagas novas com a preferência dele e grava o "match"
  let totalMatches = 0
  for (const pref of allPreferences || []) {
    const matched = jobs.filter((job) => matchesPreference(job, pref))
    if (matched.length === 0) continue

    const rows = matched.map((job) => ({ user_id: pref.user_id, job_id: job.id }))
    const { error: matchError } = await supabase
      .from('user_jobs')
      .upsert(rows, { onConflict: 'user_id,job_id', ignoreDuplicates: true })

    if (!matchError) totalMatches += matched.length
  }

  return NextResponse.json({
    ok: true,
    jobsFetched: jobs.length,
    usersProcessed: (allPreferences || []).length,
    totalMatches,
  })
}
