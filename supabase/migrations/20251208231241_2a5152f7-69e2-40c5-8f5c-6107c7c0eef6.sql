-- Add hourly ad break settings to playlists
ALTER TABLE public.live_channel_playlists
ADD COLUMN IF NOT EXISTS ad_breaks_per_hour integer DEFAULT 2,
ADD COLUMN IF NOT EXISTS ad_break_duration_seconds integer DEFAULT 30;