-- ============ profiles: agent profile enhancement ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS social_instagram text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS social_facebook text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS social_tiktok text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS social_linkedin text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS whatsapp_business text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS specializations text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_independent boolean NOT NULL DEFAULT true;

GRANT SELECT (social_instagram, social_facebook, social_tiktok, social_linkedin,
              whatsapp_business, specializations, is_independent)
  ON public.profiles TO anon, authenticated;

-- ============ properties: structured, category-aware fields ============
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS negotiable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS province text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS district text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sector text NOT NULL DEFAULT '';

-- ============ inquiries (contact events) ============
CREATE TABLE IF NOT EXISTS public.agent_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'whatsapp',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.agent_inquiries TO authenticated;
GRANT ALL ON public.agent_inquiries TO service_role;
ALTER TABLE public.agent_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients insert own inquiries" ON public.agent_inquiries;
CREATE POLICY "clients insert own inquiries" ON public.agent_inquiries
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id AND length(channel) <= 32);

DROP POLICY IF EXISTS "inquiry visible to client agent or admin" ON public.agent_inquiries;
CREATE POLICY "inquiry visible to client agent or admin" ON public.agent_inquiries
  FOR SELECT TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = agent_id OR public.has_role(auth.uid(), 'admin'));

-- ============ reviews ============
CREATE TABLE IF NOT EXISTS public.agent_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  communication smallint NOT NULL CHECK (communication BETWEEN 1 AND 5),
  accuracy smallint NOT NULL CHECK (accuracy BETWEEN 1 AND 5),
  professionalism smallint NOT NULL CHECK (professionalism BETWEEN 1 AND 5),
  recommends boolean NOT NULL DEFAULT true,
  comment text NOT NULL DEFAULT '' CHECK (length(comment) <= 300),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published','flagged','removed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, client_id)
);
GRANT SELECT ON public.agent_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_reviews TO authenticated;
GRANT ALL ON public.agent_reviews TO service_role;
ALTER TABLE public.agent_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "published reviews are public" ON public.agent_reviews;
CREATE POLICY "published reviews are public" ON public.agent_reviews
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "authors and admins read own reviews" ON public.agent_reviews;
CREATE POLICY "authors and admins read own reviews" ON public.agent_reviews
  FOR SELECT TO authenticated
  USING (auth.uid() = client_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "clients review agents they contacted" ON public.agent_reviews;
CREATE POLICY "clients review agents they contacted" ON public.agent_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = client_id
    AND auth.uid() <> agent_id
    AND EXISTS (
      SELECT 1 FROM public.agent_inquiries ai
      WHERE ai.client_id = auth.uid() AND ai.agent_id = agent_reviews.agent_id
    )
  );

DROP POLICY IF EXISTS "clients edit own reviews" ON public.agent_reviews;
CREATE POLICY "clients edit own reviews" ON public.agent_reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = client_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = client_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "clients delete own reviews" ON public.agent_reviews;
CREATE POLICY "clients delete own reviews" ON public.agent_reviews
  FOR DELETE TO authenticated
  USING (auth.uid() = client_id OR public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS agent_reviews_updated_at ON public.agent_reviews;
CREATE TRIGGER agent_reviews_updated_at BEFORE UPDATE ON public.agent_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ saved properties ============
CREATE TABLE IF NOT EXISTS public.saved_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_properties TO authenticated;
GRANT ALL ON public.saved_properties TO service_role;
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users manage own saved properties" ON public.saved_properties;
CREATE POLICY "users manage own saved properties" ON public.saved_properties
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============ public agent flag: agents only (not admins, not clients) ============
CREATE OR REPLACE FUNCTION public.sync_is_public_agent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _uid uuid := COALESCE(NEW.user_id, OLD.user_id);
BEGIN
  UPDATE public.profiles p
  SET is_public_agent = (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'agent'::app_role)
    AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'admin'::app_role)
  )
  WHERE p.id = _uid;
  RETURN NULL;
END
$function$;

UPDATE public.profiles p
SET is_public_agent = (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'agent'::app_role)
  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'admin'::app_role)
);

-- ============ new users: Google sign-ups become client accounts ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _provider text := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
  _is_client boolean := _provider <> 'email';
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, address, agency_name, bio, profile_photo_url, status)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name',''), NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', ''),
    COALESCE(NEW.raw_user_meta_data->>'agency_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'bio', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'profile_photo_url',''), NEW.raw_user_meta_data->>'avatar_url', ''),
    CASE WHEN _is_client THEN 'active'::account_status ELSE 'suspended'::account_status END
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN _is_client THEN 'client'::app_role ELSE 'agent'::app_role END)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END
$function$;