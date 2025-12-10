-- Fix security definer view by using security_invoker
DROP VIEW IF EXISTS live_channels_public;
CREATE VIEW live_channels_public 
WITH (security_invoker = true)
AS
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