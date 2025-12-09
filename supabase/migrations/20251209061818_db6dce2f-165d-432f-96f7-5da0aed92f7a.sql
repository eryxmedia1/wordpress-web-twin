-- Phase 1: Ad Network Database Schema

-- 1.1 Extend ads table with new columns
ALTER TABLE public.ads 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS vast_tag_url text,
ADD COLUMN IF NOT EXISTS position_pre boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS position_mid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS position_post boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS weight integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_impressions integer,
ADD COLUMN IF NOT EXISTS current_impressions integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS start_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS end_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS frequency_cap_per_user_per_day integer;

-- Add check constraint for status
ALTER TABLE public.ads DROP CONSTRAINT IF EXISTS ads_status_check;
ALTER TABLE public.ads ADD CONSTRAINT ads_status_check CHECK (status IN ('active', 'paused', 'expired'));

-- Add check constraint for weight (1-100)
ALTER TABLE public.ads DROP CONSTRAINT IF EXISTS ads_weight_check;
ALTER TABLE public.ads ADD CONSTRAINT ads_weight_check CHECK (weight >= 1 AND weight <= 100);

-- 1.2 Create ad_targeting table for geo and audience targeting
CREATE TABLE IF NOT EXISTS public.ad_targeting (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  countries text[] DEFAULT '{}',
  regions text[] DEFAULT '{}',
  cities text[] DEFAULT '{}',
  postal_codes text[] DEFAULT '{}',
  time_zones text[] DEFAULT '{}',
  membership_tiers text[] DEFAULT '{}',
  device_types text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(ad_id)
);

-- Enable RLS on ad_targeting
ALTER TABLE public.ad_targeting ENABLE ROW LEVEL SECURITY;

-- RLS policies for ad_targeting
CREATE POLICY "Admins can manage ad targeting"
ON public.ad_targeting
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.is_admin = true
));

CREATE POLICY "Anyone can view ad targeting"
ON public.ad_targeting
FOR SELECT
USING (true);

-- 1.3 Create ad_placements table for content/channel targeting
CREATE TABLE IF NOT EXISTS public.ad_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  placement_type text NOT NULL DEFAULT 'global',
  content_id uuid REFERENCES public.contents(id) ON DELETE CASCADE,
  channel_id uuid REFERENCES public.live_channels(id) ON DELETE CASCADE,
  pre_enabled boolean DEFAULT true,
  mid_enabled boolean DEFAULT false,
  post_enabled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ad_placements_type_check CHECK (placement_type IN ('global', 'content', 'channel'))
);

-- Enable RLS on ad_placements
ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;

-- RLS policies for ad_placements
CREATE POLICY "Admins can manage ad placements"
ON public.ad_placements
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.is_admin = true
));

CREATE POLICY "Anyone can view ad placements"
ON public.ad_placements
FOR SELECT
USING (true);

-- 1.4 Create ad_impressions table for tracking
CREATE TABLE IF NOT EXISTS public.ad_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  profile_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  content_id uuid REFERENCES public.contents(id) ON DELETE SET NULL,
  channel_id uuid REFERENCES public.live_channels(id) ON DELETE SET NULL,
  position text NOT NULL,
  played_at timestamp with time zone DEFAULT now(),
  duration_ms integer,
  completed boolean DEFAULT false,
  geo_country text,
  geo_region text,
  geo_city text,
  geo_postal text,
  time_zone text,
  device_type text,
  membership_tier text,
  CONSTRAINT ad_impressions_position_check CHECK (position IN ('pre', 'mid', 'post'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ad_impressions_ad_id ON public.ad_impressions(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_user_id ON public.ad_impressions(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_played_at ON public.ad_impressions(played_at);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_position ON public.ad_impressions(position);

-- Enable RLS on ad_impressions
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;

-- RLS policies for ad_impressions
CREATE POLICY "Admins can manage ad impressions"
ON public.ad_impressions
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.is_admin = true
));

CREATE POLICY "Anyone can insert ad impressions"
ON public.ad_impressions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own impressions"
ON public.ad_impressions
FOR SELECT
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.is_admin = true
));

-- Create indexes on ads table for performance
CREATE INDEX IF NOT EXISTS idx_ads_status ON public.ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_start_at ON public.ads(start_at);
CREATE INDEX IF NOT EXISTS idx_ads_end_at ON public.ads(end_at);

-- Create function to auto-update ad status when max impressions reached
CREATE OR REPLACE FUNCTION public.check_ad_impression_limit()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.ads
  SET status = 'expired'
  WHERE id = NEW.ad_id
    AND max_impressions IS NOT NULL
    AND current_impressions >= max_impressions
    AND status = 'active';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to check impression limit after each impression
DROP TRIGGER IF EXISTS check_impression_limit_trigger ON public.ad_impressions;
CREATE TRIGGER check_impression_limit_trigger
AFTER INSERT ON public.ad_impressions
FOR EACH ROW
EXECUTE FUNCTION public.check_ad_impression_limit();

-- Create function to increment impression count
CREATE OR REPLACE FUNCTION public.increment_ad_impressions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.ads
  SET current_impressions = current_impressions + 1
  WHERE id = NEW.ad_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;