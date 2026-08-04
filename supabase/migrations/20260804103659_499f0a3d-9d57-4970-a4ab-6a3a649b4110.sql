ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;

-- 7-day grace window: quota stays at the paid tier, advanced features do not.
CREATE OR REPLACE FUNCTION public.current_plan(_user_id uuid)
RETURNS subscription_plan
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN p.plan = 'free' THEN 'free'::public.subscription_plan
    WHEN p.plan_expires_at IS NULL THEN 'free'::public.subscription_plan
    WHEN (p.plan_expires_at + interval '7 days') < now() THEN 'free'::public.subscription_plan
    ELSE p.plan
  END
  FROM public.profiles p WHERE p.id = _user_id
$$;

CREATE TABLE IF NOT EXISTS public.monetization_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  plan subscription_plan,
  amount_rwf integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.monetization_events TO authenticated;
GRANT ALL ON public.monetization_events TO service_role;

ALTER TABLE public.monetization_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent or admin reads events"
ON public.monetization_events FOR SELECT TO authenticated
USING (auth.uid() = agent_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "agents insert own events"
ON public.monetization_events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = agent_id AND length(event_type) <= 64);

CREATE INDEX IF NOT EXISTS monetization_events_agent_created_idx
  ON public.monetization_events (agent_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.log_listing_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.monetization_events (agent_id, event_type, plan, metadata)
  VALUES (NEW.agent_id, 'listing_created', public.current_plan(NEW.agent_id),
          jsonb_build_object('property_id', NEW.id, 'title', NEW.title));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS properties_log_created ON public.properties;
CREATE TRIGGER properties_log_created
AFTER INSERT ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.log_listing_created();

CREATE OR REPLACE FUNCTION public.log_plan_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    INSERT INTO public.monetization_events (agent_id, event_type, plan, metadata)
    VALUES (
      NEW.id,
      CASE WHEN NEW.plan > OLD.plan THEN 'tier_upgrade' ELSE 'tier_downgrade' END,
      NEW.plan,
      jsonb_build_object('from', OLD.plan, 'to', NEW.plan)
    );
  ELSIF NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at
        AND NEW.plan <> 'free'
        AND NEW.plan_expires_at > COALESCE(OLD.plan_expires_at, now()) THEN
    INSERT INTO public.monetization_events (agent_id, event_type, plan, metadata)
    VALUES (NEW.id, 'plan_renewed', NEW.plan,
            jsonb_build_object('expires_at', NEW.plan_expires_at));
  END IF;

  IF NEW.is_verified = true AND COALESCE(OLD.is_verified, false) = false THEN
    INSERT INTO public.monetization_events (agent_id, event_type, plan, metadata)
    VALUES (NEW.id, 'badge_activated', NEW.plan,
            jsonb_build_object('expires_at', NEW.verified_expires_at));
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_log_plan_events ON public.profiles;
CREATE TRIGGER profiles_log_plan_events
AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_plan_events();

REVOKE ALL ON FUNCTION public.log_listing_created() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_plan_events() FROM PUBLIC, anon, authenticated;