-- EmoBuddy initial schema: mood logging + self-care plans
-- Auth is handled by Supabase Auth (auth.users); these tables reference it directly.

create table if not exists public.mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null check (source in ('text', 'voice', 'both')),
  text_result text,
  audio_result text,
  fusion_result text not null check (fusion_result in ('happy', 'sad', 'angry', 'neutral')),
  confidence numeric(4, 3) not null check (confidence >= 0 and confidence <= 1),
  crisis_triggered boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists mood_logs_user_created_idx
  on public.mood_logs (user_id, created_at desc);

create table if not exists public.self_care_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mood_log_id uuid not null references public.mood_logs (id) on delete cascade,
  day_index smallint not null check (day_index between 1 and 3),
  activity text not null,
  language text not null check (language in ('en', 'ms')),
  completed_at timestamptz
);

create index if not exists self_care_plans_user_idx
  on public.self_care_plans (user_id, mood_log_id);

alter table public.mood_logs enable row level security;
alter table public.self_care_plans enable row level security;

drop policy if exists "mood_logs_select_own" on public.mood_logs;
create policy "mood_logs_select_own" on public.mood_logs
  for select using (auth.uid() = user_id);

drop policy if exists "mood_logs_insert_own" on public.mood_logs;
create policy "mood_logs_insert_own" on public.mood_logs
  for insert with check (auth.uid() = user_id);

drop policy if exists "mood_logs_update_own" on public.mood_logs;
create policy "mood_logs_update_own" on public.mood_logs
  for update using (auth.uid() = user_id);

drop policy if exists "mood_logs_delete_own" on public.mood_logs;
create policy "mood_logs_delete_own" on public.mood_logs
  for delete using (auth.uid() = user_id);

drop policy if exists "self_care_plans_select_own" on public.self_care_plans;
create policy "self_care_plans_select_own" on public.self_care_plans
  for select using (auth.uid() = user_id);

drop policy if exists "self_care_plans_insert_own" on public.self_care_plans;
create policy "self_care_plans_insert_own" on public.self_care_plans
  for insert with check (auth.uid() = user_id);

drop policy if exists "self_care_plans_update_own" on public.self_care_plans;
create policy "self_care_plans_update_own" on public.self_care_plans
  for update using (auth.uid() = user_id);

drop policy if exists "self_care_plans_delete_own" on public.self_care_plans;
create policy "self_care_plans_delete_own" on public.self_care_plans
  for delete using (auth.uid() = user_id);
