import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { fetchAllJobs, matchesPreference } from '@/lib/job-sources'

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const supabase = createAdminClient()
  const jobs = await fetchAllJobs()
  if (jobs.length > 0) {
    await supabase.from('jobs').upsert(jobs, { onConflict: 'id', ignoreDuplicates: true })
  }
  const { data: allPreferences } = await supabase.from('preferences').select('*')
  let totalMatches = 0
  for (const pref of allPreferences || []) {
    const matched = jobs.filter((job) => matchesPreference(job, pref))
    if (matched.length === 0) continue
    const rows = matched.map((job) => ({ user_id: pref.user_id, job_id: job.id }))
    const { error } = await supabase.from('user_jobs').upsert(rows, { onConflict: 'user_id,job_id', ignoreDuplicates: true })
    if (!error) totalMatches += matched.length
  }
  return NextResponse.json({ ok: true, jobsFetched: jobs.length, totalMatches })
}
