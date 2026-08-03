-- 1. Enum
CREATE TYPE public.subscription_plan AS ENUM ('free','tier1','tier2');

-- 2. Profile columns
ALTER TABLE public.profiles
  ADD COLUMN plan public.subscription_plan NOT NULL DEFAULT 'free',
  ADD COLUMN plan_expires_at timestamptz,
  ADD COLUMN is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN verified_expires_at timestamptz;

GRANT SELECT (plan, plan_expires_at, is_verified, verified_expires_at) ON public.profiles TO anon;

-- Prevent agents from self-upgrading: block plan/verified changes unless admin
CREATE OR REPLACE FUNCTION public.guard_profile_plan_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.plan IS DISTINCT FROM OLD.plan
     OR NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at
     OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
     OR NEW.verified_expires_at IS DISTINCT FROM OLD.verified_expires_at THEN
    RAISE EXCEPTION 'Only administrators can change subscription fields';
  END IF;
  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.guard_profile_plan_changes() FROM PUBLIC, anon;

CREATE TRIGGER profiles_guard_plan
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_plan_changes();

-- 3. plan_limits
CREATE TABLE public.plan_limits (
  plan public.subscription_plan PRIMARY KEY,
  label text NOT NULL,
  price_rwf integer NOT NULL DEFAULT 0,
  max_listings integer,
  perks text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.plan_limits TO anon, authenticated;
GRANT ALL ON public.plan_limits TO service_role;
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan limits public read" ON public.plan_limits FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.plan_limits (plan, label, price_rwf, max_listings, perks, sort_order) VALUES
  ('free','Free', 0, 10, ARRAY['Up to 10 listings','Public agent profile','WhatsApp inquiries'], 1),
  ('tier1','Tier 1', 10000, 50, ARRAY['Up to 50 listings','Analytics dashboard','Priority in search'], 2),
  ('tier2','Tier 2', 25000, NULL, ARRAY['Unlimited listings','Analytics dashboard','Priority support'], 3);

-- 4. upgrade_requests
CREATE TABLE public.upgrade_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_plan public.subscription_plan NOT NULL DEFAULT 'tier1',
  wants_badge boolean NOT NULL DEFAULT false,
  amount_rwf integer NOT NULL DEFAULT 0,
  payment_reference text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  admin_note text NOT NULL DEFAULT '',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.upgrade_requests TO authenticated;
GRANT ALL ON public.upgrade_requests TO service_role;
ALTER TABLE public.upgrade_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agents insert own upgrade requests" ON public.upgrade_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = agent_id);
CREATE POLICY "agents read own or admin" ON public.upgrade_requests
  FOR SELECT TO authenticated USING (auth.uid() = agent_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update upgrade requests" ON public.upgrade_requests
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER upgrade_requests_updated_at BEFORE UPDATE ON public.upgrade_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_upgrade_requests_status ON public.upgrade_requests (status, created_at DESC);

-- 5. listing_views
CREATE TABLE public.listing_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewer_hash text NOT NULL DEFAULT '',
  viewed_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.listing_views TO anon, authenticated;
GRANT SELECT ON public.listing_views TO authenticated;
GRANT ALL ON public.listing_views TO service_role;
ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can record a view" ON public.listing_views
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "agent or admin reads views" ON public.listing_views
  FOR SELECT TO authenticated USING (auth.uid() = agent_id OR public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_listing_views_agent ON public.listing_views (agent_id, viewed_at DESC);
CREATE INDEX idx_listing_views_property ON public.listing_views (property_id);

-- 6. Plan helpers
CREATE OR REPLACE FUNCTION public.current_plan(_user_id uuid)
RETURNS public.subscription_plan
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN p.plan = 'free' THEN 'free'::public.subscription_plan
    WHEN p.plan_expires_at IS NULL OR p.plan_expires_at < now() THEN 'free'::public.subscription_plan
    ELSE p.plan
  END
  FROM public.profiles p WHERE p.id = _user_id
$$;
REVOKE EXECUTE ON FUNCTION public.current_plan(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_plan(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.listing_quota_reached(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _max integer;
  _used integer;
BEGIN
  SELECT pl.max_listings INTO _max
  FROM public.plan_limits pl
  WHERE pl.plan = public.current_plan(_user_id);
  IF _max IS NULL THEN RETURN false; END IF;
  SELECT count(*) INTO _used FROM public.properties WHERE agent_id = _user_id;
  RETURN _used >= _max;
END $$;
REVOKE EXECUTE ON FUNCTION public.listing_quota_reached(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.listing_quota_reached(uuid) TO authenticated;

-- 7. Enforce quota on insert
DROP POLICY IF EXISTS "agents insert own" ON public.properties;
CREATE POLICY "agents insert own" ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = agent_id
    AND public.has_role(auth.uid(), 'agent')
    AND NOT public.listing_quota_reached(auth.uid())
  );

-- 8. Admin review functions
CREATE OR REPLACE FUNCTION public.approve_upgrade_request(_request_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r public.upgrade_requests;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Only administrators can approve upgrade requests';
  END IF;
  SELECT * INTO r FROM public.upgrade_requests WHERE id = _request_id AND status = 'pending';
  IF r.id IS NULL THEN RAISE EXCEPTION 'Request not found or already reviewed'; END IF;

  UPDATE public.profiles SET
    plan = r.requested_plan,
    plan_expires_at = GREATEST(COALESCE(plan_expires_at, now()), now()) + interval '30 days',
    is_verified = CASE WHEN r.wants_badge THEN true ELSE is_verified END,
    verified_expires_at = CASE WHEN r.wants_badge
      THEN GREATEST(COALESCE(verified_expires_at, now()), now()) + interval '30 days'
      ELSE verified_expires_at END
  WHERE id = r.agent_id;

  UPDATE public.upgrade_requests
    SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = _request_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.approve_upgrade_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_upgrade_request(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.reject_upgrade_request(_request_id uuid, _note text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Only administrators can reject upgrade requests';
  END IF;
  UPDATE public.upgrade_requests
    SET status = 'rejected', admin_note = COALESCE(_note,''), reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = _request_id AND status = 'pending';
END $$;
REVOKE EXECUTE ON FUNCTION public.reject_upgrade_request(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_upgrade_request(uuid, text) TO authenticated;

-- 9. Admin manual controls
CREATE OR REPLACE FUNCTION public.admin_set_verified(_agent_id uuid, _verified boolean, _days integer DEFAULT 30)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Only administrators can change verification';
  END IF;
  UPDATE public.profiles SET
    is_verified = _verified,
    verified_expires_at = CASE WHEN _verified THEN now() + (_days || ' days')::interval ELSE NULL END
  WHERE id = _agent_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_set_verified(uuid, boolean, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_verified(uuid, boolean, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_plan(_agent_id uuid, _plan public.subscription_plan, _days integer DEFAULT 30)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Only administrators can change plans';
  END IF;
  UPDATE public.profiles SET
    plan = _plan,
    plan_expires_at = CASE WHEN _plan = 'free' THEN NULL ELSE now() + (_days || ' days')::interval END
  WHERE id = _agent_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_set_plan(uuid, public.subscription_plan, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_plan(uuid, public.subscription_plan, integer) TO authenticated;