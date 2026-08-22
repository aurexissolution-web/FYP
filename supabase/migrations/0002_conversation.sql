alter table if exists public.mood_logs
add column if not exists conversation_text text;
