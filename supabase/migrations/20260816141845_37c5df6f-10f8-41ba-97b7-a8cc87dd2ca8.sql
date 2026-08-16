GRANT SELECT (id, full_name, phone, agency_name, bio, profile_photo_url, photo_public_id, achievements, status, plan, plan_expires_at, is_verified, verified_expires_at, cancel_at_period_end, is_public_agent, created_at, updated_at) ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
SELECT public.assert_profiles_column_grants();