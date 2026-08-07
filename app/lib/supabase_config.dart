/// Supabase project credentials.
///
/// The anon key is safe to embed in a client app by design (Supabase access
/// control is enforced by Postgres RLS policies, not by hiding this key) —
/// see supabase/migrations/0001_init.sql for the policies that protect it.
const String kSupabaseUrl = 'https://xvyludyzcmziutwhwjhp.supabase.co';
const String kSupabaseAnonKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2eWx1ZHl6Y216aXV0d2h3amhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwOTA0MzcsImV4cCI6MjEwMTY2NjQzN30.Pr6wPsjO8ymjfcXgdheKSulXVz70_o_6UPeH54v4HRg';
