-- Create ad_campaigns table
CREATE TABLE public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  priority integer NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  start_at timestamptz,
  end_at timestamptz,
  max_impressions integer,
  max_impressions_per_day integer,
  max_impressions_per_user_per_day integer,
  allowed_positions text[] DEFAULT '{pre_roll,mid_roll,post_roll,live_break}'::text[],
  allowed_membership_tiers text[] DEFAULT '{free,standard}'::text[],
  target_countries text[] DEFAULT '{}'::text[],
  target_regions text[] DEFAULT '{}'::text[],
  target_cities text[] DEFAULT '{}'::text[],
  target_postal_codes text[] DEFAULT '{}'::text[],
  target_timezones text[] DEFAULT '{}'::text[],
  target_devices text[] DEFAULT '{}'::text[],
  notes text,
  current_impressions integer DEFAULT 0,
  current_impressions_today integer DEFAULT 0,
  last_impression_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create campaign_creatives join table
CREATE TABLE public.campaign_creatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  creative_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  weight integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, creative_id)
);

-- Create campaign_channels join table
CREATE TABLE public.campaign_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL,
  channel_type text NOT NULL DEFAULT 'live' CHECK (channel_type IN ('live', 'indie')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, channel_id)
);

-- Create campaign_content_items join table
CREATE TABLE public.campaign_content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, content_id)
);

-- Add click_through_url to ads table
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS click_through_url text;

-- Add campaign_id and creative_id to ad_impressions
ALTER TABLE public.ad_impressions 
ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.ad_campaigns(id),
ADD COLUMN IF NOT EXISTS creative_id uuid REFERENCES public.ads(id);

-- Enable RLS on all new tables
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_content_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for ad_campaigns
CREATE POLICY "Admins can manage ad campaigns" ON public.ad_campaigns
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view ad campaigns" ON public.ad_campaigns
FOR SELECT USING (true);

-- RLS policies for campaign_creatives
CREATE POLICY "Admins can manage campaign creatives" ON public.campaign_creatives
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view campaign creatives" ON public.campaign_creatives
FOR SELECT USING (true);

-- RLS policies for campaign_channels
CREATE POLICY "Admins can manage campaign channels" ON public.campaign_channels
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view campaign channels" ON public.campaign_channels
FOR SELECT USING (true);

-- RLS policies for campaign_content_items
CREATE POLICY "Admins can manage campaign content items" ON public.campaign_content_items
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view campaign content items" ON public.campaign_content_items
FOR SELECT USING (true);

-- Create index for performance
CREATE INDEX idx_ad_campaigns_status ON public.ad_campaigns(status);
CREATE INDEX idx_ad_campaigns_priority ON public.ad_campaigns(priority DESC);
CREATE INDEX idx_campaign_creatives_campaign_id ON public.campaign_creatives(campaign_id);
CREATE INDEX idx_campaign_channels_campaign_id ON public.campaign_channels(campaign_id);
CREATE INDEX idx_campaign_content_items_campaign_id ON public.campaign_content_items(campaign_id);
CREATE INDEX idx_ad_impressions_campaign_id ON public.ad_impressions(campaign_id);