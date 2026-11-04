-- Timberlite Schedule v277 update. Run AFTER the v276 Schedule setup.
-- Existing jobs default OFF Schedule. No job, payment or Schedule row is deleted.
BEGIN;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS schedule_included boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION public.timberlite_schedule_set_included(
 admin_code text, source_quote_id uuid, include_job boolean, expected_included boolean)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result boolean;
BEGIN
 PERFORM public.timberlite_schedule_check_admin(admin_code);
 IF include_job IS NULL OR expected_included IS NULL THEN RAISE EXCEPTION 'Invalid Schedule selection.'; END IF;
 UPDATE public.quotes q SET schedule_included=include_job,updated_at=now()
  WHERE q.id=source_quote_id AND q.status='converted_to_job' AND q.schedule_included=expected_included
  RETURNING q.schedule_included INTO result;
 IF NOT FOUND THEN RAISE EXCEPTION 'This job or its Schedule selection changed elsewhere. Refresh Jobs and try again.'; END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.timberlite_schedule_set_included(text,uuid,boolean,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.timberlite_schedule_set_included(text,uuid,boolean,boolean) TO anon,authenticated;
CREATE OR REPLACE FUNCTION public.timberlite_schedule_save(
 admin_code text, entry_id uuid, source_quote_id uuid, expected_version bigint, payload jsonb)
 RETURNS SETOF public.timberlite_schedule_entries LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog,public AS $$
DECLARE result public.timberlite_schedule_entries; amount_key text;
BEGIN
 PERFORM public.timberlite_schedule_check_admin(admin_code);
 IF payload IS NULL OR jsonb_typeof(payload) <> 'object' OR octet_length(payload::text)>30000
  OR nullif(btrim(payload->>'customerName'),'') IS NULL
  OR (payload->>'status') IS NULL
  OR (payload->>'status') NOT IN ('Not Started','In Production','Complete','Scheduled','Delivered','On Hold','Cancelled')
 THEN RAISE EXCEPTION 'Invalid Schedule entry.'; END IF;
 FOREACH amount_key IN ARRAY ARRAY['areaM2','netCost','netSell','grossSell','deposit','otherPaid','labour'] LOOP
  IF nullif(payload->>amount_key,'') IS NOT NULL THEN
   IF (payload->>amount_key) !~ '^\d+(\.\d+)?$' THEN RAISE EXCEPTION 'Amounts must be non-negative numbers.'; END IF;
  END IF;
 END LOOP;
 FOREACH amount_key IN ARRAY ARRAY['deliveryDate','dueDate'] LOOP
  IF nullif(payload->>amount_key,'') IS NOT NULL THEN
   IF (payload->>amount_key) !~ '^\d{4}-\d{2}-\d{2}$' THEN RAISE EXCEPTION 'Invalid date.'; END IF;
   PERFORM (payload->>amount_key)::date;
  END IF;
 END LOOP;
 IF ((payload->>'delivered')::boolean IS TRUE) IS DISTINCT FROM ((payload->>'status')='Delivered')
 THEN RAISE EXCEPTION 'Delivered and production status must agree.'; END IF;
 IF source_quote_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.quotes WHERE id=source_quote_id AND status='converted_to_job' AND schedule_included IS TRUE)
 THEN RAISE EXCEPTION 'This job is not included in Schedule. Select it on the Jobs page, then refresh Schedule.'; END IF;
 IF nullif(btrim(payload->>'jobNumber'),'') IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.quotes q WHERE q.status='converted_to_job' AND (source_quote_id IS NULL OR q.id<>source_quote_id)
    AND lower(btrim(q.job_number::text))=lower(btrim(payload->>'jobNumber'))
 ) THEN RAISE EXCEPTION 'That job number already belongs to another app job.'; END IF;
 IF entry_id IS NULL THEN
  IF expected_version IS NOT NULL THEN RAISE EXCEPTION 'Invalid new entry version.'; END IF;
  INSERT INTO public.timberlite_schedule_entries(quote_id,entry_json) VALUES(source_quote_id,payload) RETURNING * INTO result;
 ELSE
  UPDATE public.timberlite_schedule_entries e SET entry_json=payload,quote_id=source_quote_id,version=e.version+1,updated_at=now()
   WHERE e.id=entry_id AND e.version=expected_version AND (e.quote_id IS NOT DISTINCT FROM source_quote_id OR (e.quote_id IS NULL AND source_quote_id IS NOT NULL
    AND nullif(btrim(e.entry_json->>'jobNumber'),'') IS NOT NULL
    AND lower(btrim(e.entry_json->>'jobNumber'))=lower(btrim(payload->>'jobNumber'))
    AND EXISTS(SELECT 1 FROM public.quotes q WHERE q.id=source_quote_id AND lower(btrim(q.job_number::text))=lower(btrim(payload->>'jobNumber'))))) RETURNING * INTO result;
  IF NOT FOUND THEN RAISE EXCEPTION 'This entry changed elsewhere. Keep your notes, refresh Schedule and review before saving again.'; END IF;
 END IF;
 RETURN NEXT result;
EXCEPTION WHEN unique_violation THEN
 RAISE EXCEPTION 'This job already has a Schedule entry or its job number is in use. Refresh and edit the existing row.';
END $$;
REVOKE ALL ON FUNCTION public.timberlite_schedule_save(text,uuid,uuid,bigint,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.timberlite_schedule_save(text,uuid,uuid,bigint,jsonb) TO anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
