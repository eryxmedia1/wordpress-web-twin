-- Add RTMP streaming fields to live_channels table
ALTER TABLE public.live_channels
ADD COLUMN IF NOT EXISTS mux_stream_id text,
ADD COLUMN IF NOT EXISTS rtmp_url text,
ADD COLUMN IF NOT EXISTS stream_key text,
ADD COLUMN IF NOT EXISTS playback_url text,
ADD COLUMN IF NOT EXISTS is_live_streaming boolean DEFAULT false;