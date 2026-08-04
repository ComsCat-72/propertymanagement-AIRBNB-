DROP POLICY IF EXISTS "anyone can record a view" ON public.listing_views;

CREATE POLICY "record view for a real listing"
ON public.listing_views
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(coalesce(viewer_hash, '')) <= 128
  AND EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = listing_views.property_id
      AND p.agent_id = listing_views.agent_id
  )
);