import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase-server'
import { fetchAllJobs, matchesPreference } from '@/lib/job-sources'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createAdminClient()

  const { data: pref } = await admin
    .from('preferences').select('*').eq('user_id', user.id).maybeSingle()
  if (!pref) return NextResponse.json({ jobs: [] })

  // Busca vagas nas fontes externas
  const allJobs = await fetchAllJobs(pref.job_title, pref.market || 'ambos')

  // Salva vagas novas no banco global
  if (allJobs.length > 0) {
    await admin.from('jobs').upsert(
      allJobs.map(j => ({ ...j })),
      { onConflict: 'id', ignoreDuplicates: true }
    )
  }

  // Filtra as que combinam com as preferências
  const matched = allJobs.filter(job => matchesPreference(job, pref))

  // ── RESET: apaga matches anteriores do usuário antes de salvar os novos ──
  await admin.from('user_jobs').delete().eq('user_id', user.id)

  // Salva apenas os matches desta busca
  if (matched.length > 0) {
    const rows = matched.map(job => ({ user_id: user.id, job_id: job.id }))
    await admin.from('user_jobs').insert(rows)
  }

  // Retorna os jobs diretamente (já filtrados e frescos)
  return NextResponse.json({ jobs: matched, total: matched.length })
}
