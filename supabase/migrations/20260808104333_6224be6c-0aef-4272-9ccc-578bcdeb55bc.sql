-- Remove blanket column access for signed-in users on profiles
REVOKE SELECT ON public.profiles FROM authenticated;

GRANT SELECT (
  id, full_name, phone, agency_name, bio, profile_photo_url, photo_public_id,
  status, created_at, updated_at, achievements, plan, plan_expires_at,
  is_verified, verified_expires_at, cancel_at_period_end
) ON public.profiles TO authenticated;

-- anon keeps its existing narrower column grants; make sure new columns aren't leaked
REVOKE SELECT (email, address) ON public.profiles FROM anon;

-- Owner/admin-only access to contact details
CREATE OR REPLACE FUNCTION public.profile_contacts()
RETURNS TABLE (id uuid, email text, address text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.email, p.address
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND (p.id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
$$;

REVOKE ALL ON FUNCTION public.profile_contacts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.profile_contacts() TO authenticated;