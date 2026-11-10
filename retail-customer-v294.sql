-- Run in the Timberlite Supabase SQL Editor after the v275 customer-details migration.
-- Add the shared Retail account without changing existing customers or orders.
insert into public.customers
  (id, name, username, login_code, role, discount_pct, default_miles, details_json)
select
  'c8d4d7f1-5c5d-4769-994b-940c9d70cba1'::uuid, 'Retail', 'Retail', null, 'public', 0, 0,
  '{"active":true,"defaultSpec":"top","notes":"Shared account for retail roof orders. No trade discount or login."}'::jsonb
where not exists (
  select 1 from public.customers
  where lower(btrim(name)) = 'retail' and role = 'public' and discount_pct = 0
)
on conflict (id) do nothing;
