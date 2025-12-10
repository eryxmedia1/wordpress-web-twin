-- Add allowed_tiers column to live_channels table
ALTER TABLE live_channels ADD COLUMN allowed_tiers text[] DEFAULT ARRAY['free', 'standard', 'premium']::text[];

-- Update the live_channels_public view to include allowed_tiers
DROP VIEW IF EXISTS live_channels_public;
CREATE VIEW live_channels_public AS
SELECT 
  id,
  name,
  slug,
  logo_url,
  description,
  timezone,
  is_active,
  is_live_streaming,
  default_ad_interval_minutes,
  playback_url,
  allowed_tiers,
  created_at,
  updated_at
FROM live_channels;