-- 1) Public directory: replace anon-executable SECURITY DEFINER function with a view
CREATE OR REPLACE VIEW public.non_admin_profile_directory
WITH (security_invoker = off) AS
  SELECT p.id
  FROM public.profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.id AND ur.role = 'admin'::app_role
  );

GRANT SELECT ON public.non_admin_profile_directory TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.non_admin_profile_ids() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_agent(uuid) FROM anon;

-- 2) Guard against profiles column-grant drift
REVOKE SELECT (email, address) ON public.profiles FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.enforce_profiles_column_grants()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    EXECUTE 'REVOKE SELECT (email, address) ON public.profiles FROM anon, authenticated';
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

REVOKE EXECUTE ON FUNCTION public.enforce_profiles_column_grants() FROM PUBLIC, anon, authenticated;

DROP EVENT TRIGGER IF EXISTS profiles_column_grants_guard;
CREATE EVENT TRIGGER profiles_column_grants_guard
  ON ddl_command_end
  WHEN TAG IN ('GRANT', 'ALTER TABLE')
  EXECUTE FUNCTION public.enforce_profiles_column_grants();

-- 3) Storage: property images readable only by owner or admin
DROP POLICY IF EXISTS "property images public read" ON storage.objects;

CREATE POLICY "property images owner or admin read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'property-images'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);