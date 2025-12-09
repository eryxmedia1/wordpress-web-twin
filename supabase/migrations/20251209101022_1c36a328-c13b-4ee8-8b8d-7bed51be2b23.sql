-- Create live_channel_favorites table for following main Live TV channels
CREATE TABLE public.live_channel_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  live_channel_id UUID NOT NULL REFERENCES public.live_channels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(profile_id, live_channel_id)
);

-- Enable RLS
ALTER TABLE public.live_channel_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their profile favorites"
ON public.live_channel_favorites FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.id = live_channel_favorites.profile_id
  AND user_profiles.account_id = auth.uid()
));

CREATE POLICY "Users can add to their profile favorites"
ON public.live_channel_favorites FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.id = live_channel_favorites.profile_id
  AND user_profiles.account_id = auth.uid()
));

CREATE POLICY "Users can remove from their profile favorites"
ON public.live_channel_favorites FOR DELETE
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.id = live_channel_favorites.profile_id
  AND user_profiles.account_id = auth.uid()
));

-- Index for performance
CREATE INDEX idx_live_channel_favorites_profile ON public.live_channel_favorites(profile_id);
CREATE INDEX idx_live_channel_favorites_channel ON public.live_channel_favorites(live_channel_id);