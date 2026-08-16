DROP VIEW IF EXISTS public.non_admin_profile_directory;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_public_agent boolean NOT NULL DEFAULT true;

REVOKE SELECT (email, address) ON public.profiles FROM anon, authenticated;

UPDATE public.profiles p
SET is_public_agent = NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.id AND ur.role = 'admin'::app_role
);

CREATE OR REPLACE FUNCTION public.sync_is_public_agent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _uid uuid := COALESCE(NEW.user_id, OLD.user_id);
BEGIN
  UPDATE public.profiles p
  SET is_public_agent = NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.id AND ur.role = 'admin'::app_role
  )
  WHERE p.id = _uid;
  RETURN NULL;
END $$;

REVOKE EXECUTE ON FUNCTION public.sync_is_public_agent() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS user_roles_sync_public_agent ON public.user_roles;
CREATE TRIGGER user_roles_sync_public_agent
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.sync_is_public_agent();