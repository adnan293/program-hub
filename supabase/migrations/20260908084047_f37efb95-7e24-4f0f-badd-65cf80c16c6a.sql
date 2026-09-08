CREATE POLICY "Anyone can upload program materials"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'program-materials');

CREATE POLICY "Anyone can upload submissions"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'program-submissions');