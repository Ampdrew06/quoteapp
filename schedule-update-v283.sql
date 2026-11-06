-- Schedule calendar editing, admin invoice colours and staff leave counters v283.
-- Uses the existing day records. No table, day note, order or payment is deleted.
BEGIN;
CREATE OR REPLACE FUNCTION public.timberlite_schedule_calendar_year(admin_code text,calendar_year integer)
 RETURNS SETOF public.timberlite_schedule_calendar_days LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM public.timberlite_schedule_check_admin(admin_code);
 IF calendar_year IS NULL OR calendar_year<1900 OR calendar_year>9998 THEN RAISE EXCEPTION 'Choose a valid calendar year.'; END IF;
 RETURN QUERY SELECT * FROM public.timberlite_schedule_calendar_days c
  WHERE c.day>=make_date(calendar_year,1,1) AND c.day<make_date(calendar_year+1,1,1) ORDER BY c.day;
END $$;
REVOKE ALL ON FUNCTION public.timberlite_schedule_calendar_year(text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.timberlite_schedule_calendar_year(text,integer) TO anon,authenticated;
CREATE OR REPLACE FUNCTION public.timberlite_schedule_calendar_save(admin_code text,calendar_day date,expected_version bigint,payload jsonb)
 RETURNS SETOF public.timberlite_schedule_calendar_days LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result public.timberlite_schedule_calendar_days; staff_key text; leave_value jsonb;
BEGIN
 PERFORM public.timberlite_schedule_check_admin(admin_code);
 IF calendar_day IS NULL OR payload IS NULL OR jsonb_typeof(payload)<>'object'
 OR (payload->>'colour') IS NULL OR (payload->>'colour') NOT IN ('auto','green','red','yellow','blue','orange','purple','grey','white')
 OR jsonb_typeof(payload->'note') IS DISTINCT FROM 'string' OR length(payload->>'note')>3000
 OR (payload->'bankHoliday' IS NOT NULL AND jsonb_typeof(payload->'bankHoliday') NOT IN ('boolean','null'))
 THEN RAISE EXCEPTION 'Invalid calendar day details.'; END IF;
 IF payload ? 'staffLeave' THEN
  IF jsonb_typeof(payload->'staffLeave') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid staff leave.'; END IF;
  FOR staff_key,leave_value IN SELECT key,value FROM jsonb_each(payload->'staffLeave') LOOP
   IF staff_key NOT IN ('CB','RS') OR jsonb_typeof(leave_value) IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Choose valid CB/RS leave amounts.'; END IF;
   IF (leave_value::text)::numeric NOT IN (0,0.5,1) THEN RAISE EXCEPTION 'Staff leave must be zero, half a day or one day.'; END IF;
  END LOOP;
 END IF;
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
NOTIFY pgrst,'reload schema';
COMMIT;
