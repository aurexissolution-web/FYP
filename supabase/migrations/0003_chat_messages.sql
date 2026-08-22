-- Add chat message storage and session metadata for the ChatGPT-style
-- history list and open-ended sessions.

-- 1. Give sessions a title derived from the first user message.
alter table if exists public.mood_logs
  add column if not exists title text;

-- 2. Full message thread for every session.
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.mood_logs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'ai')),
  type text not null check (type in ('text', 'voice', 'mood', 'plan', 'crisis')),
  content text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_idx
  on public.chat_messages (session_id, created_at asc);

create index if not exists chat_messages_user_idx
  on public.chat_messages (user_id);

-- 3. Make it possible to order plans by when they were created.
alter table if exists public.self_care_plans
  add column if not exists created_at timestamptz not null default now();

-- 4. Row level security for chat_messages.
alter table public.chat_messages enable row level security;

drop policy if exists "chat_messages_select_own" on public.chat_messages;
create policy "chat_messages_select_own" on public.chat_messages
  for select using (auth.uid() = user_id);

drop policy if exists "chat_messages_insert_own" on public.chat_messages;
create policy "chat_messages_insert_own" on public.chat_messages
  for insert with check (auth.uid() = user_id);

drop policy if exists "chat_messages_update_own" on public.chat_messages;
create policy "chat_messages_update_own" on public.chat_messages
  for update using (auth.uid() = user_id);

drop policy if exists "chat_messages_delete_own" on public.chat_messages;
create policy "chat_messages_delete_own" on public.chat_messages
  for delete using (auth.uid() = user_id);
