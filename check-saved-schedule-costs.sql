-- Read-only. Replace the example job numbers with ones shown in your Sales alerts.
select
  e.entry_json->>'jobNumber' as job_number,
  e.entry_json->>'customerName' as customer,
  e.entry_json->>'reference' as reference,
  e.entry_json->>'deliveryDate' as delivery_date,
  nullif(e.entry_json->>'materialsCost','') as saved_materials_cost,
  nullif(e.entry_json->>'deliveryCost','') as saved_delivery_cost,
  nullif(e.entry_json->>'netCost','') as saved_combined_net_cost,
  e.updated_at as last_saved
from public.timberlite_schedule_entries e
where lower(trim(e.entry_json->>'jobNumber')) in ('replace-with-job-number')
order by delivery_date, job_number;
