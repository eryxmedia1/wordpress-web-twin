-- Create live_channels table
CREATE TABLE public.live_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  is_active BOOLEAN DEFAULT true,
  default_ad_interval_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create ads table (before live_playlist_items since it references ads)
CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  video_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  ad_type TEXT NOT NULL CHECK (ad_type IN ('preroll', 'midroll', 'postroll', 'generic_break')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create live_channel_playlists table
CREATE TABLE public.live_channel_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.live_channels(id) ON DELETE CASCADE,
  playlist_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  start_time TIME NOT NULL DEFAULT '08:00',
  loop_mode TEXT NOT NULL DEFAULT 'continuous_loop' CHECK (loop_mode IN ('continuous_loop', 'end_then_idle')),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create live_playlist_items table
CREATE TABLE public.live_playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_playlist_id UUID NOT NULL REFERENCES public.live_channel_playlists(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  duration_seconds INTEGER,
  preroll_ad_id UUID REFERENCES public.ads(id) ON DELETE SET NULL,
  postroll_ad_id UUID REFERENCES public.ads(id) ON DELETE SET NULL,
  midroll_breaks_json JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create live_ad_breaks table
CREATE TABLE public.live_ad_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_playlist_id UUID NOT NULL REFERENCES public.live_channel_playlists(id) ON DELETE CASCADE,
  interval_minutes INTEGER NOT NULL DEFAULT 15,
  ad_pod_length_seconds INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.live_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_channel_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_ad_breaks ENABLE ROW LEVEL SECURITY;

-- Public SELECT policies
CREATE POLICY "Anyone can view live channels" ON public.live_channels FOR SELECT USING (true);
CREATE POLICY "Anyone can view ads" ON public.ads FOR SELECT USING (true);
CREATE POLICY "Anyone can view channel playlists" ON public.live_channel_playlists FOR SELECT USING (true);
CREATE POLICY "Anyone can view playlist items" ON public.live_playlist_items FOR SELECT USING (true);
CREATE POLICY "Anyone can view ad breaks" ON public.live_ad_breaks FOR SELECT USING (true);

-- Admin-only modification policies
CREATE POLICY "Admins can manage live channels" ON public.live_channels FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can manage ads" ON public.ads FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can manage channel playlists" ON public.live_channel_playlists FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can manage playlist items" ON public.live_playlist_items FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can manage ad breaks" ON public.live_ad_breaks FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Create indexes for performance
CREATE INDEX idx_live_channels_slug ON public.live_channels(slug);
CREATE INDEX idx_live_channels_active ON public.live_channels(is_active);
CREATE INDEX idx_live_channel_playlists_channel ON public.live_channel_playlists(channel_id);
CREATE INDEX idx_live_channel_playlists_active ON public.live_channel_playlists(is_active);
CREATE INDEX idx_live_playlist_items_playlist ON public.live_playlist_items(channel_playlist_id);
CREATE INDEX idx_live_playlist_items_order ON public.live_playlist_items(channel_playlist_id, order_index);
CREATE INDEX idx_ads_type ON public.ads(ad_type);
CREATE INDEX idx_ads_active ON public.ads(is_active);