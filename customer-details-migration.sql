-- Run once in your existing Supabase project's SQL Editor before using v275.
-- Adds profile storage only; existing customers, IDs, roles and prices remain.
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS details_json jsonb NOT NULL DEFAULT '{}'::jsonb;
NOTIFY pgrst, 'reload schema';
-- Imported directory entries do not receive login credentials automatically.
ALTER TABLE public.customers ALTER COLUMN login_code DROP NOT NULL;
