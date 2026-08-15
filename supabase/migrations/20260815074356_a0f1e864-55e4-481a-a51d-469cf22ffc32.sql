-- Re-assert safe column grants on public.profiles (idempotent hardening)
REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT (id, full_name, agency_name, bio, achievements, profile_photo_url, status, is_verified, plan, plan_expires_at, verified_expires_at, phone, created_at, updated_at)
  ON public.profiles TO anon;

GRANT SELECT (id, full_name, agency_name, bio, achievements, profile_photo_url, photo_public_id, status, is_verified, plan, plan_expires_at, verified_expires_at, cancel_at_period_end, phone, created_at, updated_at)
  ON public.profiles TO authenticated;

-- Guard function: fails loudly if a future migration re-grants sensitive columns to anon/authenticated
CREATE OR REPLACE FUNCTION public.assert_profiles_column_grants()
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE bad text;
BEGIN
  SELECT string_agg(r || ':' || c, ', ')
  INTO bad
  FROM (
    SELECT r, c
    FROM unnest(ARRAY['anon','authenticated']) r,
         unnest(ARRAY['email','address']) c
    WHERE has_column_privilege(r, 'public.profiles', c, 'SELECT')
  ) s;

  IF bad IS NOT NULL THEN
    RAISE EXCEPTION 'Sensitive profiles columns are exposed: %', bad;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.assert_profiles_column_grants() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assert_profiles_column_grants() TO service_role;

-- Fail this migration immediately if the invariant is broken
DO $$ BEGIN PERFORM public.assert_profiles_column_grants(); END $$;