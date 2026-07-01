import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: preference } = await supabase
    .from('preferences').select('*').eq('user_id', user.id).maybeSingle()

  const { data: matchedJobs } = await supabase
    .from('user_jobs').select('matched_at, jobs(*)').eq('user_id', user.id)
    .order('matched_at', { ascending: false }).limit(50)

  return (
    <DashboardClient
      userEmail={user.email}
      initialPreference={preference}
      initialJobs={(matchedJobs || []).map((m) => m.jobs).filter(Boolean)}
    />
  )
}
