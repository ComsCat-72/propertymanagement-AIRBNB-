
CREATE POLICY "property images public read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'property-images');
CREATE POLICY "agents upload own folder" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "agents update own files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "agents delete own files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'property-images' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));
