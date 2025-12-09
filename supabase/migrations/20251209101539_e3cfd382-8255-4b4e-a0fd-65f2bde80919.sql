-- Drop the public SELECT policy that exposes sensitive streaming credentials
DROP POLICY IF EXISTS "Anyone can view live channels" ON public.live_channels;

-- Create a secure view for public channel information (excludes sensitive streaming credentials)
CREATE OR REPLACE VIEW public.live_channels_public AS
SELECT 
  id,
  name,
  slug,
  logo_url,
  description,
  timezone,
  is_active,
  is_live_streaming,
  playback_url,
  created_at,
  updated_at,
  default_ad_interval_minutes
FROM public.live_channels;

-- Grant SELECT access on the public view to all users
GRANT SELECT ON public.live_channels_public TO authenticated;
GRANT SELECT ON public.live_channels_public TO anon;