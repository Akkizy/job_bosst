import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase-server'
import { fetchAllJobs, matchesPreference } from '@/lib/job-sources'

// Chamada pelo botão "Buscar agora" do dashboard — busca vagas, salva e retorna as que combinam com o usuário atual
export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createAdminClient()

  // Preferências do usuário atual
  const { data: pref } = await admin.from('preferences').select('*').eq('user_id', user.id).maybeSingle()
  if (!pref) return NextResponse.json({ jobs: [] })

  // Busca vagas nas fontes externas
  const allJobs = await fetchAllJobs()

  // Salva vagas novas no banco
  if (allJobs.length > 0) {
    await admin.from('jobs').upsert(allJobs, { onConflict: 'id', ignoreDuplicates: true })
  }

  // Filtra as que combinam com as preferências
  const matched = allJobs.filter(job => matchesPreference(job, pref))

  // Salva os matches do usuário
  if (matched.length > 0) {
    const rows = matched.map(job => ({ user_id: user.id, job_id: job.id }))
    await admin.from('user_jobs').upsert(rows, { onConflict: 'user_id,job_id', ignoreDuplicates: true })
  }

  // Retorna todas as vagas do usuário (novas + antigas)
  const { data: userJobs } = await admin
    .from('user_jobs')
    .select('jobs(*)')
    .eq('user_id', user.id)
    .order('matched_at', { ascending: false })
    .limit(100)

  const jobs = (userJobs || []).map(r => r.jobs).filter(Boolean)
  return NextResponse.json({ jobs, total: jobs.length })
}
