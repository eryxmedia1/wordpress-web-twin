-- Add creator_tier to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS creator_tier text DEFAULT NULL;

-- Create creator_plans table
CREATE TABLE IF NOT EXISTS creator_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  price numeric DEFAULT 0,
  max_total_videos integer DEFAULT 100,
  max_rows integer DEFAULT 5,
  max_videos_per_row integer DEFAULT 20,
  can_go_live boolean DEFAULT false,
  can_upload_shows boolean DEFAULT false,
  allow_ads boolean DEFAULT false,
  revenue_share_eligible boolean DEFAULT false,
  analytics_level text DEFAULT 'basic',
  custom_branding boolean DEFAULT false,
  features text[] DEFAULT '{}',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE creator_plans ENABLE ROW LEVEL SECURITY;

-- Anyone can view creator plans
CREATE POLICY "Anyone can view creator plans" ON creator_plans FOR SELECT USING (true);

-- Only admins can manage creator plans
CREATE POLICY "Admins can manage creator plans" ON creator_plans FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert creator tiers
INSERT INTO creator_plans (name, slug, price, max_total_videos, max_rows, max_videos_per_row, can_go_live, can_upload_shows, allow_ads, revenue_share_eligible, analytics_level, custom_branding, features, sort_order) VALUES
('Basic', 'basic', 295, 100, 5, 20, false, false, false, false, 'basic', false, ARRAY['1 Indie Channel','Channel page & branding','Logo + description','Custom rows','Basic stats only'], 1),
('Professional', 'pro', 495, 500, 10, 50, false, true, true, true, 'full', false, ARRAY['Everything in Basic','TV shows & seasons','Episode selector','Categories & rows','Full analytics dashboard','Eligible for revenue share'], 2),
('Enterprise', 'enterprise', 995, 1000, 20, 50, true, true, true, true, 'advanced', true, ARRAY['Unlimited customization','Live streaming (RTMP)','Full ad control','Sponsorship eligible','Advanced analytics','Revenue reports','Export data','Priority support'], 3)
ON CONFLICT (slug) DO NOTHING;

-- Update membership_plans features
UPDATE membership_plans SET features = ARRAY[
  'Limited content access',
  'Ad-supported (4 breaks/hour)',
  'HD quality (1080p)',
  'Basic channels only',
  'Up to 2 profiles',
  'Continue Watching',
  'My List',
  'Like content'
] WHERE slug = 'free';

UPDATE membership_plans SET features = ARRAY[
  'Most content access',
  'Limited ads (max 2 per show)',
  'HD quality (1080p)',
  'Most channels included',
  'Up to 4 profiles',
  'Custom playlists (up to 10)',
  'Binge mode',
  'Smart recommendations'
] WHERE slug = 'standard';

UPDATE membership_plans SET features = ARRAY[
  'ALL content access',
  'NO ADS EVER',
  '4K + HDR quality',
  'All channels included',
  'Up to 6 profiles',
  'Unlimited playlists',
  'Skip intros',
  'Instant playback',
  'Download for offline',
  'Priority support'
] WHERE slug = 'premium';