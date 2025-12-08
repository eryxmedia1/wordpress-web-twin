-- Create storage bucket for channel logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('channel-logos', 'channel-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view channel logos (public bucket)
CREATE POLICY "Channel logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'channel-logos');

-- Allow admins to upload channel logos
CREATE POLICY "Admins can upload channel logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'channel-logos' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Allow admins to update channel logos
CREATE POLICY "Admins can update channel logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'channel-logos' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Allow admins to delete channel logos
CREATE POLICY "Admins can delete channel logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'channel-logos' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);