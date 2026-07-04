CREATE POLICY "anon signup avatar upload" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'property-images' AND (storage.foldername(name))[1] = 'signup');