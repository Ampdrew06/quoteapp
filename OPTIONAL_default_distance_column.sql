-- Only needed if the app reports that default_miles does not exist.
-- Adds one column without deleting or recreating any customer records.
alter table public.customers
  add column if not exists default_miles numeric not null default 0;
