REVOKE ALL ON FUNCTION public.sync_deals_closed() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_agent_subscribers() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_viewing_change() FROM public, anon, authenticated;