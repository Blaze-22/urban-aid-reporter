-- Fix storage policies for issue-media bucket
CREATE POLICY "Anyone can upload to issue-media bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'issue-media');

CREATE POLICY "Anyone can view issue-media files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'issue-media');

CREATE POLICY "Users can update their own files in issue-media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'issue-media');

CREATE POLICY "Users can delete their own files in issue-media" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'issue-media');

-- Also update the issues table INSERT policy to allow anonymous submissions
DROP POLICY IF EXISTS "Authenticated users can create issues" ON public.issues;

CREATE POLICY "Anyone can create issues" 
ON public.issues 
FOR INSERT 
WITH CHECK (true);