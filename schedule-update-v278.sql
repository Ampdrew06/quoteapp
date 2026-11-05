-- Run after the v276 setup and v277 selection update.
-- Calendar-only data is separate from orders, payments and job geometry.
BEGIN;
CREATE TABLE IF NOT EXISTS public.timberlite_schedule_calendar_days (
 day date PRIMARY KEY,
 details_json jsonb NOT NULL DEFAULT '{}'::jsonb,
 version bigint NOT NULL DEFAULT 1,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.timberlite_schedule_calendar_days ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.timberlite_schedule_calendar_days FROM anon,authenticated;
CREATE OR REPLACE FUNCTION public.timberlite_schedule_calendar_read(admin_code text,calendar_month date)
 RETURNS SETOF public.timberlite_schedule_calendar_days LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM public.timberlite_schedule_check_admin(admin_code);
 IF calendar_month IS NULL THEN RAISE EXCEPTION 'Choose a calendar month.'; END IF;
 RETURN QUERY SELECT * FROM public.timberlite_schedule_calendar_days c
 WHERE c.day>=date_trunc('month',calendar_month)::date AND c.day<(date_trunc('month',calendar_month)+interval '1 month')::date ORDER BY c.day;
END $$;
CREATE OR REPLACE FUNCTION public.timberlite_schedule_calendar_save(admin_code text,calendar_day date,expected_version bigint,payload jsonb)
 RETURNS SETOF public.timberlite_schedule_calendar_days LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result public.timberlite_schedule_calendar_days;
BEGIN
 PERFORM public.timberlite_schedule_check_admin(admin_code);
 IF calendar_day IS NULL OR payload IS NULL OR jsonb_typeof(payload)<>'object'
 OR (payload->>'colour') IS NULL OR (payload->>'colour') NOT IN ('auto','green','red','yellow','blue','grey','white')
 OR jsonb_typeof(payload->'note') IS DISTINCT FROM 'string' OR length(payload->>'note')>3000
 OR (payload->'bankHoliday' IS NOT NULL AND jsonb_typeof(payload->'bankHoliday') NOT IN ('boolean','null'))
 THEN RAISE EXCEPTION 'Invalid calendar day details.'; END IF;
 IF expected_version IS NULL THEN
  INSERT INTO public.timberlite_schedule_calendar_days(day,details_json) VALUES(calendar_day,payload) RETURNING * INTO result;
 ELSE
  UPDATE public.timberlite_schedule_calendar_days c SET details_json=payload,version=c.version+1,updated_at=now()
   WHERE c.day=calendar_day AND c.version=expected_version RETURNING * INTO result;
  IF NOT FOUND THEN RAISE EXCEPTION 'This day changed elsewhere. Copy your note, refresh Calendar and review before saving again.'; END IF;
 END IF;
 RETURN NEXT result;
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'This day was edited elsewhere. Copy your note, refresh Calendar and review before saving again.';
END $$;
REVOKE ALL ON FUNCTION public.timberlite_schedule_calendar_read(text,date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.timberlite_schedule_calendar_save(text,date,bigint,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.timberlite_schedule_calendar_read(text,date) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.timberlite_schedule_calendar_save(text,date,bigint,jsonb) TO anon,authenticated;
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
 FOREACH amount_key IN ARRAY ARRAY['areaM2','netCost','netSell','grossSell','deposit','otherPaid','labour','materialsCost','deliveryCost'] LOOP
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
