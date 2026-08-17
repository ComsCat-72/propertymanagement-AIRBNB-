CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _provider text := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
  _is_client boolean := _provider <> 'email';
BEGIN
  INSERT INTO public.profiles (
    id, full_name, email, phone, address, agency_name, bio, profile_photo_url, status,
    social_instagram, social_facebook, social_tiktok, social_linkedin, whatsapp_business
  )
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name',''), NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', ''),
    COALESCE(NEW.raw_user_meta_data->>'agency_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'bio', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'profile_photo_url',''), NEW.raw_user_meta_data->>'avatar_url', ''),
    CASE WHEN _is_client THEN 'active'::account_status ELSE 'suspended'::account_status END,
    COALESCE(NEW.raw_user_meta_data->>'social_instagram', ''),
    COALESCE(NEW.raw_user_meta_data->>'social_facebook', ''),
    COALESCE(NEW.raw_user_meta_data->>'social_tiktok', ''),
    COALESCE(NEW.raw_user_meta_data->>'social_linkedin', ''),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp_business', '')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN _is_client THEN 'client'::app_role ELSE 'agent'::app_role END)
  ON CONFLICT DO NOTHING;

  IF _is_client THEN
    UPDATE public.profiles SET is_public_agent = false WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END
$$;