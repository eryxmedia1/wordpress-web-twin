-- Fix security definer view issue by recreating with security_invoker = true
DROP VIEW IF EXISTS public.live_channels_public;

CREATE VIEW public.live_channels_public
WITH (security_invoker = true)
AS SELECT 
  id,
  name,
  slug,
  logo_url,
  description,
  is_active,
  is_live_streaming,
  timezone,
  playback_url,
  default_ad_interval_minutes,
  created_at,
  updated_at
FROM public.live_channels;

-- Grant SELECT to anon and authenticated roles
GRANT SELECT ON public.live_channels_public TO anon;
GRANT SELECT ON public.live_channels_public TO authenticated;