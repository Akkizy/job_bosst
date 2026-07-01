create table if not exists public.preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  job_title text not null,
  work_model text not null check (work_model in ('remoto', 'hibrido', 'presencial', 'qualquer')),
  created_at timestamptz default now(),
  unique(user_id)
);

create table if not exists public.jobs (
  id text primary key,
  title text not null,
  company text,
  location text,
  url text not null,
  remote boolean default false,
  salary_min numeric,
  source text,
  fetched_at timestamptz default now()
);

create table if not exists public.user_jobs (
  user_id uuid references auth.users(id) on delete cascade not null,
  job_id text references public.jobs(id) on delete cascade not null,
  matched_at timestamptz default now(),
  primary key (user_id, job_id)
);

alter table public.preferences enable row level security;
alter table public.user_jobs enable row level security;
alter table public.jobs enable row level security;

create policy "Usuários veem apenas suas preferências" on public.preferences for select using (auth.uid() = user_id);
create policy "Usuários editam apenas suas preferências" on public.preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Usuários veem apenas suas vagas combinadas" on public.user_jobs for select using (auth.uid() = user_id);
create policy "Todos podem ler a lista de vagas" on public.jobs for select using (true);
