-- ============ profiles additions ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_deal_count boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deals_closed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leads_opt_out boolean NOT NULL DEFAULT false;

GRANT SELECT (show_deal_count, deals_closed) ON public.profiles TO anon, authenticated;
GRANT SELECT (leads_opt_out) ON public.profiles TO authenticated;

-- ============ listing boosts ============
CREATE TABLE IF NOT EXISTS public.listing_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  days integer NOT NULL DEFAULT 7,
  amount_rwf integer NOT NULL DEFAULT 0,
  payment_reference text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  admin_note text NOT NULL DEFAULT '',
  reviewed_by uuid,
  reviewed_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.listing_boosts TO authenticated;
GRANT SELECT ON public.listing_boosts TO anon;
GRANT ALL ON public.listing_boosts TO service_role;
ALTER TABLE public.listing_boosts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "boosts public read" ON public.listing_boosts;
CREATE POLICY "boosts public read" ON public.listing_boosts
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "agents request own boosts" ON public.listing_boosts;
CREATE POLICY "agents request own boosts" ON public.listing_boosts
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = agent_id
    AND EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.agent_id = auth.uid())
  );

CREATE TRIGGER listing_boosts_updated_at BEFORE UPDATE ON public.listing_boosts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.approve_listing_boost(_boost_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE b public.listing_boosts;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Only administrators can approve boosts';
  END IF;
  SELECT * INTO b FROM public.listing_boosts WHERE id = _boost_id AND status = 'pending';
  IF b.id IS NULL THEN RAISE EXCEPTION 'Boost not found or already reviewed'; END IF;

  UPDATE public.listing_boosts
    SET status='approved', reviewed_by=auth.uid(), reviewed_at=now(),
        starts_at=now(), ends_at=now() + (b.days || ' days')::interval
  WHERE id = _boost_id;

  UPDATE public.properties SET is_featured = true WHERE id = b.property_id;

  INSERT INTO public.monetization_events (agent_id, event_type, amount_rwf, metadata)
  VALUES (b.agent_id, 'boost_activated', b.amount_rwf,
          jsonb_build_object('property_id', b.property_id, 'days', b.days));

  INSERT INTO public.notifications (user_id, type, title, body, url)
  VALUES (b.agent_id, 'boost_approved', 'Your boost is live',
          'Your listing is now featured for ' || b.days || ' days.', '/dashboard/billing');
END $$;

CREATE OR REPLACE FUNCTION public.reject_listing_boost(_boost_id uuid, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE b public.listing_boosts;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Only administrators can reject boosts';
  END IF;
  UPDATE public.listing_boosts
    SET status='rejected', admin_note=COALESCE(_note,''), reviewed_by=auth.uid(), reviewed_at=now()
  WHERE id=_boost_id AND status='pending' RETURNING * INTO b;
  IF b.id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, url)
    VALUES (b.agent_id, 'boost_rejected', 'Boost request declined',
            COALESCE(NULLIF(_note,''), 'An admin declined your boost request.'), '/dashboard/billing');
  END IF;
END $$;

-- keeps is_featured honest: clears listings whose boost window has closed
CREATE OR REPLACE FUNCTION public.expire_listing_boosts()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  UPDATE public.properties p SET is_featured = false
  WHERE p.is_featured
    AND EXISTS (SELECT 1 FROM public.listing_boosts b WHERE b.property_id = p.id AND b.status='approved')
    AND NOT EXISTS (
      SELECT 1 FROM public.listing_boosts b
      WHERE b.property_id = p.id AND b.status='approved' AND b.ends_at > now()
    );
$$;

-- ============ notifications ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own notifications" ON public.notifications;
CREATE POLICY "own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "mark own notifications" ON public.notifications;
CREATE POLICY "mark own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete own notifications" ON public.notifications;
CREATE POLICY "delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ deals ============
CREATE TABLE IF NOT EXISTS public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  property_title text NOT NULL DEFAULT '',
  property_location text NOT NULL DEFAULT '',
  deal_type text NOT NULL DEFAULT 'sale',
  client_name text NOT NULL DEFAULT '',
  client_contact text NOT NULL DEFAULT '',
  deal_value numeric NOT NULL DEFAULT 0,
  commission_pct numeric NOT NULL DEFAULT 3,
  closed_on date NOT NULL DEFAULT current_date,
  reference text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO authenticated;
GRANT ALL ON public.deals TO service_role;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agent or admin reads deals" ON public.deals;
CREATE POLICY "agent or admin reads deals" ON public.deals
  FOR SELECT TO authenticated USING (auth.uid() = agent_id OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "agents insert own deals" ON public.deals;
CREATE POLICY "agents insert own deals" ON public.deals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = agent_id AND public.has_role(auth.uid(),'agent'));
DROP POLICY IF EXISTS "agents update own deals" ON public.deals;
CREATE POLICY "agents update own deals" ON public.deals
  FOR UPDATE TO authenticated USING (auth.uid() = agent_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = agent_id OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "agents delete own deals" ON public.deals;
CREATE POLICY "agents delete own deals" ON public.deals
  FOR DELETE TO authenticated USING (auth.uid() = agent_id OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER deals_updated_at BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.sync_deals_closed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _agent uuid := COALESCE(NEW.agent_id, OLD.agent_id);
BEGIN
  UPDATE public.profiles p
    SET deals_closed = (SELECT count(*) FROM public.deals d WHERE d.agent_id = _agent)
  WHERE p.id = _agent;
  RETURN NULL;
END $$;

CREATE TRIGGER deals_sync_count AFTER INSERT OR DELETE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.sync_deals_closed();

-- ============ agent pages ============
CREATE TABLE IF NOT EXISTS public.agent_pages (
  agent_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  tagline text NOT NULL DEFAULT '',
  banner_url text NOT NULL DEFAULT '',
  banner_public_id text NOT NULL DEFAULT '',
  ai_chat_enabled boolean NOT NULL DEFAULT true,
  viewings_enabled boolean NOT NULL DEFAULT true,
  viewing_fee_rwf integer NOT NULL DEFAULT 0,
  slot_minutes integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.agent_pages TO anon, authenticated;
GRANT INSERT, UPDATE ON public.agent_pages TO authenticated;
GRANT ALL ON public.agent_pages TO service_role;
ALTER TABLE public.agent_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agent pages public read" ON public.agent_pages;
CREATE POLICY "agent pages public read" ON public.agent_pages
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "agents create own page" ON public.agent_pages;
CREATE POLICY "agents create own page" ON public.agent_pages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = agent_id);
DROP POLICY IF EXISTS "agents update own page" ON public.agent_pages;
CREATE POLICY "agents update own page" ON public.agent_pages
  FOR UPDATE TO authenticated USING (auth.uid() = agent_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = agent_id OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER agent_pages_updated_at BEFORE UPDATE ON public.agent_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ agent subscriptions ============
CREATE TABLE IF NOT EXISTS public.agent_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscriber_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  max_price numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, subscriber_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_subscriptions TO authenticated;
GRANT ALL ON public.agent_subscriptions TO service_role;
ALTER TABLE public.agent_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriber or agent reads" ON public.agent_subscriptions;
CREATE POLICY "subscriber or agent reads" ON public.agent_subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = subscriber_id OR auth.uid() = agent_id OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "subscribe self" ON public.agent_subscriptions;
CREATE POLICY "subscribe self" ON public.agent_subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = subscriber_id AND auth.uid() <> agent_id);
DROP POLICY IF EXISTS "update own subscription" ON public.agent_subscriptions;
CREATE POLICY "update own subscription" ON public.agent_subscriptions
  FOR UPDATE TO authenticated USING (auth.uid() = subscriber_id) WITH CHECK (auth.uid() = subscriber_id);
DROP POLICY IF EXISTS "unsubscribe self" ON public.agent_subscriptions;
CREATE POLICY "unsubscribe self" ON public.agent_subscriptions
  FOR DELETE TO authenticated USING (auth.uid() = subscriber_id);

CREATE OR REPLACE FUNCTION public.notify_agent_subscribers()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status <> 'active' THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, type, title, body, url)
  SELECT s.subscriber_id, 'new_listing',
         'New listing from ' || COALESCE(NULLIF(pr.full_name,''), 'an agent you follow'),
         NEW.title || ' — ' || COALESCE(NULLIF(NEW.city,''), NEW.location),
         '/properties/' || NEW.id
  FROM public.agent_subscriptions s
  JOIN public.profiles pr ON pr.id = s.agent_id
  WHERE s.agent_id = NEW.agent_id
    AND (s.category = '' OR s.category = NEW.category::text)
    AND (s.city = '' OR lower(s.city) = lower(NEW.city))
    AND (s.max_price IS NULL OR NEW.price <= s.max_price);
  RETURN NEW;
END $$;

CREATE TRIGGER properties_notify_subscribers AFTER INSERT ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.notify_agent_subscribers();

-- ============ viewings ============
CREATE TABLE IF NOT EXISTS public.viewing_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  weekday smallint NOT NULL,
  start_minute smallint NOT NULL DEFAULT 540,
  end_minute smallint NOT NULL DEFAULT 1020,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.viewing_slots TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.viewing_slots TO authenticated;
GRANT ALL ON public.viewing_slots TO service_role;
ALTER TABLE public.viewing_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "slots public read" ON public.viewing_slots;
CREATE POLICY "slots public read" ON public.viewing_slots
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "agents manage own slots" ON public.viewing_slots;
CREATE POLICY "agents manage own slots" ON public.viewing_slots
  FOR ALL TO authenticated USING (auth.uid() = agent_id) WITH CHECK (auth.uid() = agent_id);

CREATE TABLE IF NOT EXISTS public.viewing_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  client_name text NOT NULL DEFAULT '',
  client_phone text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  starts_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.viewing_bookings TO authenticated;
GRANT ALL ON public.viewing_bookings TO service_role;
ALTER TABLE public.viewing_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "booking parties read" ON public.viewing_bookings;
CREATE POLICY "booking parties read" ON public.viewing_bookings
  FOR SELECT TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = agent_id OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "clients book viewings" ON public.viewing_bookings;
CREATE POLICY "clients book viewings" ON public.viewing_bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id AND auth.uid() <> agent_id);
DROP POLICY IF EXISTS "parties update booking" ON public.viewing_bookings;
CREATE POLICY "parties update booking" ON public.viewing_bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = agent_id OR auth.uid() = client_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = agent_id OR auth.uid() = client_id OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER viewing_bookings_updated_at BEFORE UPDATE ON public.viewing_bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.notify_viewing_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, type, title, body, url)
    VALUES (NEW.agent_id, 'viewing_requested', 'New viewing request',
            COALESCE(NULLIF(NEW.client_name,''),'A client') || ' asked to view on ' ||
            to_char(NEW.starts_at, 'DD Mon YYYY HH24:MI'), '/dashboard/viewings');
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, type, title, body, url)
    VALUES (NEW.client_id, 'viewing_' || NEW.status, 'Viewing ' || NEW.status,
            'Your viewing on ' || to_char(NEW.starts_at, 'DD Mon YYYY HH24:MI') || ' was ' || NEW.status || '.',
            '/account');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER viewing_bookings_notify AFTER INSERT OR UPDATE ON public.viewing_bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_viewing_change();

-- ============ leads club ============
CREATE TABLE IF NOT EXISTS public.buyer_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  summary text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  listing_type text NOT NULL DEFAULT '',
  budget_min numeric,
  budget_max numeric,
  score integer NOT NULL DEFAULT 0,
  price_rwf integer NOT NULL DEFAULT 5000,
  max_sales integer NOT NULL DEFAULT 3,
  sold_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  contact_name text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  last_active_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id)
);
REVOKE ALL ON public.buyer_leads FROM anon, authenticated;
GRANT SELECT (id, summary, category, city, listing_type, budget_min, budget_max, score,
              price_rwf, max_sales, sold_count, status, last_active_at, created_at)
  ON public.buyer_leads TO authenticated;
GRANT ALL ON public.buyer_leads TO service_role;
ALTER TABLE public.buyer_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agents browse open leads" ON public.buyer_leads;
CREATE POLICY "agents browse open leads" ON public.buyer_leads
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'agent') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.lead_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.buyer_leads(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_rwf integer NOT NULL DEFAULT 0,
  payment_reference text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  admin_note text NOT NULL DEFAULT '',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lead_id, agent_id)
);
GRANT SELECT, INSERT ON public.lead_purchases TO authenticated;
GRANT ALL ON public.lead_purchases TO service_role;
ALTER TABLE public.lead_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agent or admin reads purchases" ON public.lead_purchases;
CREATE POLICY "agent or admin reads purchases" ON public.lead_purchases
  FOR SELECT TO authenticated USING (auth.uid() = agent_id OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "agents request leads" ON public.lead_purchases;
CREATE POLICY "agents request leads" ON public.lead_purchases
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = agent_id AND public.has_role(auth.uid(),'agent')
    AND EXISTS (SELECT 1 FROM public.buyer_leads l WHERE l.id = lead_id AND l.status = 'open')
  );

CREATE TRIGGER lead_purchases_updated_at BEFORE UPDATE ON public.lead_purchases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.lead_contact(_lead_id uuid)
RETURNS TABLE(name text, phone text, email text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT l.contact_name, l.contact_phone, l.contact_email
  FROM public.buyer_leads l
  WHERE l.id = _lead_id
    AND (
      public.has_role(auth.uid(),'admin')
      OR EXISTS (
        SELECT 1 FROM public.lead_purchases lp
        WHERE lp.lead_id = l.id AND lp.agent_id = auth.uid() AND lp.status = 'approved'
      )
    )
$$;
REVOKE ALL ON FUNCTION public.lead_contact(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.lead_contact(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.approve_lead_purchase(_purchase_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE p public.lead_purchases; l public.buyer_leads;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Only administrators can approve lead purchases';
  END IF;
  SELECT * INTO p FROM public.lead_purchases WHERE id=_purchase_id AND status='pending';
  IF p.id IS NULL THEN RAISE EXCEPTION 'Purchase not found or already reviewed'; END IF;

  UPDATE public.lead_purchases SET status='approved', reviewed_by=auth.uid(), reviewed_at=now()
  WHERE id=_purchase_id;

  UPDATE public.buyer_leads
    SET sold_count = sold_count + 1,
        status = CASE WHEN sold_count + 1 >= max_sales THEN 'exhausted' ELSE status END
  WHERE id = p.lead_id RETURNING * INTO l;

  INSERT INTO public.monetization_events (agent_id, event_type, amount_rwf, metadata)
  VALUES (p.agent_id, 'lead_purchased', p.amount_rwf, jsonb_build_object('lead_id', p.lead_id));

  INSERT INTO public.notifications (user_id, type, title, body, url)
  VALUES (p.agent_id, 'lead_unlocked', 'Lead unlocked',
          'Contact details are now visible for the lead you bought.', '/dashboard/leads');
END $$;

CREATE OR REPLACE FUNCTION public.reject_lead_purchase(_purchase_id uuid, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Only administrators can reject lead purchases';
  END IF;
  UPDATE public.lead_purchases
    SET status='rejected', admin_note=COALESCE(_note,''), reviewed_by=auth.uid(), reviewed_at=now()
  WHERE id=_purchase_id AND status='pending';
END $$;

CREATE OR REPLACE FUNCTION public.retire_buyer_lead(_lead_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Only administrators can retire leads';
  END IF;
  UPDATE public.buyer_leads SET status='retired' WHERE id=_lead_id;
END $$;

-- Builds/refreshes anonymised buyer leads from browsing behaviour.
CREATE OR REPLACE FUNCTION public.generate_buyer_leads()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _n integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Only administrators can generate leads';
  END IF;

  WITH activity AS (
    SELECT sp.user_id,
           count(*) * 2 AS score,
           max(sp.created_at) AS last_active,
           mode() WITHIN GROUP (ORDER BY p.category::text) AS category,
           mode() WITHIN GROUP (ORDER BY p.city) AS city,
           mode() WITHIN GROUP (ORDER BY p.property_type::text) AS listing_type,
           min(p.price) AS budget_min,
           max(p.price) AS budget_max
    FROM public.saved_properties sp
    JOIN public.properties p ON p.id = sp.property_id
    GROUP BY sp.user_id
    UNION ALL
    SELECT ai.client_id, count(*) * 3, max(ai.created_at),
           mode() WITHIN GROUP (ORDER BY p.category::text),
           mode() WITHIN GROUP (ORDER BY p.city),
           mode() WITHIN GROUP (ORDER BY p.property_type::text),
           min(p.price), max(p.price)
    FROM public.agent_inquiries ai
    JOIN public.properties p ON p.id = ai.property_id
    GROUP BY ai.client_id
  ), rolled AS (
    SELECT user_id,
           sum(score)::int AS score,
           max(last_active) AS last_active,
           (array_agg(category ORDER BY score DESC))[1] AS category,
           (array_agg(city ORDER BY score DESC))[1] AS city,
           (array_agg(listing_type ORDER BY score DESC))[1] AS listing_type,
           min(budget_min) AS budget_min,
           max(budget_max) AS budget_max
    FROM activity WHERE user_id IS NOT NULL
    GROUP BY user_id
  )
  INSERT INTO public.buyer_leads (
    client_id, summary, category, city, listing_type, budget_min, budget_max, score,
    contact_name, contact_phone, contact_email, last_active_at
  )
  SELECT r.user_id,
         'Active buyer looking for ' || COALESCE(NULLIF(r.category,''),'property') ||
         CASE WHEN COALESCE(r.city,'') <> '' THEN ' in ' || r.city ELSE '' END ||
         CASE WHEN r.listing_type = 'rent' THEN ' to rent' ELSE ' to buy' END,
         COALESCE(r.category,''), COALESCE(r.city,''), COALESCE(r.listing_type,''),
         r.budget_min, r.budget_max, r.score,
         pr.full_name, COALESCE(pr.phone,''), pr.email, r.last_active
  FROM rolled r
  JOIN public.profiles pr ON pr.id = r.user_id
  WHERE r.score >= 4
    AND pr.leads_opt_out = false
    AND NOT public.has_role(r.user_id, 'agent')
    AND NOT public.has_role(r.user_id, 'admin')
  ON CONFLICT (client_id) DO UPDATE SET
    summary = EXCLUDED.summary,
    category = EXCLUDED.category,
    city = EXCLUDED.city,
    listing_type = EXCLUDED.listing_type,
    budget_min = EXCLUDED.budget_min,
    budget_max = EXCLUDED.budget_max,
    score = EXCLUDED.score,
    contact_name = EXCLUDED.contact_name,
    contact_phone = EXCLUDED.contact_phone,
    contact_email = EXCLUDED.contact_email,
    last_active_at = EXCLUDED.last_active_at;

  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END $$;

REVOKE ALL ON FUNCTION public.approve_listing_boost(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.reject_listing_boost(uuid, text) FROM public, anon;
REVOKE ALL ON FUNCTION public.expire_listing_boosts() FROM public, anon;
REVOKE ALL ON FUNCTION public.approve_lead_purchase(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.reject_lead_purchase(uuid, text) FROM public, anon;
REVOKE ALL ON FUNCTION public.retire_buyer_lead(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.generate_buyer_leads() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.approve_listing_boost(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_listing_boost(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_listing_boosts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_lead_purchase(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_lead_purchase(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.retire_buyer_lead(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_buyer_leads() TO authenticated;