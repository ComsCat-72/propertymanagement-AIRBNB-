-- 1. Column-level protection of PII from anonymous visitors
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, full_name, agency_name, bio, profile_photo_url, achievements, status, phone, created_at, updated_at) ON public.profiles TO anon;

-- 2. Only agents/admins may upload to the property-images bucket
DROP POLICY IF EXISTS "agents upload own folder" ON storage.objects;
CREATE POLICY "agents upload own folder" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND (public.has_role(auth.uid(), 'agent'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
);

-- 3. SECURITY DEFINER functions should not be callable through the API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;