-- Fix storage policies to use has_role instead of profiles.is_admin
DROP POLICY IF EXISTS "Admins can delete channel logos" ON storage.objects;
CREATE POLICY "Admins can delete channel logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'channel-logos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can update channel logos" ON storage.objects;
CREATE POLICY "Admins can update channel logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'channel-logos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can upload channel logos" ON storage.objects;
CREATE POLICY "Admins can upload channel logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'channel-logos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);