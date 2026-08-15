-- Function returning ids of profiles that are NOT admins (public directory safe)
CREATE OR REPLACE FUNCTION public.non_admin_profile_ids()
RETURNS TABLE(id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id
  FROM public.profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.id AND ur.role = 'admin'::app_role
  )
$$;

REVOKE ALL ON FUNCTION public.non_admin_profile_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.non_admin_profile_ids() TO anon, authenticated, service_role;

-- Admin-only hard delete of an agent account and all their data
CREATE OR REPLACE FUNCTION public.admin_delete_agent(_agent_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can delete agents';
  END IF;

  IF public.has_role(_agent_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin accounts cannot be deleted here';
  END IF;

  DELETE FROM public.listing_views WHERE agent_id = _agent_id;
  DELETE FROM public.monetization_events WHERE agent_id = _agent_id;
  DELETE FROM public.upgrade_requests WHERE agent_id = _agent_id;
  DELETE FROM public.properties WHERE agent_id = _agent_id;
  DELETE FROM public.user_roles WHERE user_id = _agent_id;
  DELETE FROM public.profiles WHERE id = _agent_id;
  DELETE FROM auth.users WHERE id = _agent_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_agent(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_agent(uuid) TO authenticated, service_role;