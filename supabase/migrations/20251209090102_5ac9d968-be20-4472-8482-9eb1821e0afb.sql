-- Add restriction columns to indie_channels table
ALTER TABLE indie_channels ADD COLUMN IF NOT EXISTS can_go_live boolean DEFAULT false;
ALTER TABLE indie_channels ADD COLUMN IF NOT EXISTS max_rows integer DEFAULT 5;
ALTER TABLE indie_channels ADD COLUMN IF NOT EXISTS max_videos_per_row integer DEFAULT 20;
ALTER TABLE indie_channels ADD COLUMN IF NOT EXISTS allowed_countries text[] DEFAULT '{}';
ALTER TABLE indie_channels ADD COLUMN IF NOT EXISTS allowed_regions text[] DEFAULT '{}';
ALTER TABLE indie_channels ADD COLUMN IF NOT EXISTS max_total_videos integer DEFAULT 100;
ALTER TABLE indie_channels ADD COLUMN IF NOT EXISTS allow_ads boolean DEFAULT true;
ALTER TABLE indie_channels ADD COLUMN IF NOT EXISTS revenue_share_percent integer DEFAULT 70;
ALTER TABLE indie_channels ADD COLUMN IF NOT EXISTS custom_branding_enabled boolean DEFAULT false;
ALTER TABLE indie_channels ADD COLUMN IF NOT EXISTS analytics_access boolean DEFAULT true;

-- Create push_subscriptions table for browser push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, endpoint)
);

-- Enable RLS on push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for push_subscriptions
CREATE POLICY "Users can manage their own push subscriptions"
ON push_subscriptions FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.id = push_subscriptions.profile_id
  AND user_profiles.account_id = auth.uid()
));

-- Add push notification preference to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS push_notifications_enabled boolean DEFAULT true;