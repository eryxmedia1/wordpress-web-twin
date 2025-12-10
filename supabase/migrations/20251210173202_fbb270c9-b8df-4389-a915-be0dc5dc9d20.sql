-- Create table to track active Live TV viewers
CREATE TABLE public.live_channel_active_viewers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_channel_id uuid NOT NULL REFERENCES public.live_channels(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  device_type text,
  geo_country text,
  geo_region text,
  geo_city text,
  started_at timestamp with time zone DEFAULT now(),
  last_heartbeat timestamp with time zone DEFAULT now(),
  UNIQUE(session_id)
);

-- Enable RLS
ALTER TABLE public.live_channel_active_viewers ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can insert/update their own sessions
CREATE POLICY "Users can manage their own viewer sessions"
ON public.live_channel_active_viewers
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all active viewers
CREATE POLICY "Admins can view all active viewers"
ON public.live_channel_active_viewers
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for efficient queries
CREATE INDEX idx_active_viewers_channel ON public.live_channel_active_viewers(live_channel_id);
CREATE INDEX idx_active_viewers_heartbeat ON public.live_channel_active_viewers(last_heartbeat);