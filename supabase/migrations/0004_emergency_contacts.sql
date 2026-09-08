-- Emergency contact + automatic crisis-notification audit trail.
-- No real SMS/WhatsApp/email is ever sent — emergency_notifications is a
-- real, timestamped log of the moment the system would have notified the
-- contact, so the feature is demo-ready without a third-party provider.

create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  relationship text,
  phone text not null,
  created_at timestamptz not null default now()
);

-- No unique constraint on user_id: v1 UI only ever shows/edits one contact
-- (the most recently created), but the schema doesn't forbid more later.
create index if not exists emergency_contacts_user_idx
  on public.emergency_contacts (user_id, created_at desc);

create table if not exists public.emergency_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  contact_id uuid references public.emergency_contacts (id) on delete set null,
  mood_log_id uuid not null references public.mood_logs (id) on delete cascade,
  -- Snapshotted at notification time so the audit row stays meaningful even
  -- if the contact is later edited or deleted (contact_id may go null).
  contact_name_snapshot text not null,
  contact_phone_snapshot text not null,
  channel text not null default 'stub'
    check (channel in ('stub', 'sms', 'whatsapp', 'email')),
  status text not null default 'simulated'
    check (status in ('simulated', 'sent', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists emergency_notifications_user_idx
  on public.emergency_notifications (user_id, created_at desc);

create index if not exists emergency_notifications_mood_log_idx
  on public.emergency_notifications (mood_log_id);

alter table public.emergency_contacts enable row level security;
alter table public.emergency_notifications enable row level security;

drop policy if exists "emergency_contacts_select_own" on public.emergency_contacts;
create policy "emergency_contacts_select_own" on public.emergency_contacts
  for select using (auth.uid() = user_id);

drop policy if exists "emergency_contacts_insert_own" on public.emergency_contacts;
create policy "emergency_contacts_insert_own" on public.emergency_contacts
  for insert with check (auth.uid() = user_id);

drop policy if exists "emergency_contacts_update_own" on public.emergency_contacts;
create policy "emergency_contacts_update_own" on public.emergency_contacts
  for update using (auth.uid() = user_id);

drop policy if exists "emergency_contacts_delete_own" on public.emergency_contacts;
create policy "emergency_contacts_delete_own" on public.emergency_contacts
  for delete using (auth.uid() = user_id);

drop policy if exists "emergency_notifications_select_own" on public.emergency_notifications;
create policy "emergency_notifications_select_own" on public.emergency_notifications
  for select using (auth.uid() = user_id);

drop policy if exists "emergency_notifications_insert_own" on public.emergency_notifications;
create policy "emergency_notifications_insert_own" on public.emergency_notifications
  for insert with check (auth.uid() = user_id);

drop policy if exists "emergency_notifications_update_own" on public.emergency_notifications;
create policy "emergency_notifications_update_own" on public.emergency_notifications
  for update using (auth.uid() = user_id);

drop policy if exists "emergency_notifications_delete_own" on public.emergency_notifications;
create policy "emergency_notifications_delete_own" on public.emergency_notifications
  for delete using (auth.uid() = user_id);
