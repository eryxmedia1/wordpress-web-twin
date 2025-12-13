-- Create storage bucket for talent media uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'talent-media', 
  'talent-media', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Add is_primary column to talent_photos table for main photo selection
ALTER TABLE public.talent_photos 
ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false;

-- Create storage policies for talent-media bucket
CREATE POLICY "Anyone can view talent media"
ON storage.objects FOR SELECT
USING (bucket_id = 'talent-media');

CREATE POLICY "Authenticated users can upload talent media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'talent-media' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own talent media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'talent-media' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own talent media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'talent-media' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);