-- Create channel_views table for detailed analytics
CREATE TABLE public.channel_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  indie_channel_id UUID REFERENCES public.indie_channels(id) ON DELETE CASCADE,
  live_channel_id UUID REFERENCES public.live_channels(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.contents(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  user_id UUID,
  watched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_seconds INTEGER DEFAULT 0,
  progress_percent INTEGER DEFAULT 0,
  geo_country TEXT,
  geo_region TEXT,
  geo_city TEXT,
  geo_postal TEXT,
  device_type TEXT,
  time_zone TEXT
);

-- Enable RLS
ALTER TABLE public.channel_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert views (tracking)
CREATE POLICY "Anyone can insert views"
ON public.channel_views
FOR INSERT
WITH CHECK (true);

-- Admins can view all analytics
CREATE POLICY "Admins can view all analytics"
ON public.channel_views
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
));

-- Channel owners can view their own channel analytics
CREATE POLICY "Channel owners can view their channel analytics"
ON public.channel_views
FOR SELECT
USING (
  (indie_channel_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM indie_channels WHERE indie_channels.id = channel_views.indie_channel_id AND indie_channels.owner_id = auth.uid()
  ))
);

-- Create indexes for faster queries
CREATE INDEX idx_channel_views_indie_channel ON public.channel_views(indie_channel_id);
CREATE INDEX idx_channel_views_live_channel ON public.channel_views(live_channel_id);
CREATE INDEX idx_channel_views_watched_at ON public.channel_views(watched_at);
CREATE INDEX idx_channel_views_geo_country ON public.channel_views(geo_country);