-- Create table for auth background images
CREATE TABLE public.auth_backgrounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auth_backgrounds ENABLE ROW LEVEL SECURITY;

-- Anyone can view active backgrounds (needed for login page which is public)
CREATE POLICY "Anyone can view auth backgrounds"
ON public.auth_backgrounds
FOR SELECT
USING (true);

-- Only admins can manage backgrounds
CREATE POLICY "Admins can manage auth backgrounds"
ON public.auth_backgrounds
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.is_admin = true
));