-- Add preferred_genres to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN preferred_genres TEXT[] DEFAULT '{}';

-- Add included_channels and editable features to membership_plans
ALTER TABLE public.membership_plans 
ADD COLUMN included_channels TEXT[] DEFAULT '{}';

-- Create user_playlists table for user-created playlists
CREATE TABLE public.user_playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_playlist_items for content in user playlists
CREATE TABLE public.user_playlist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.user_playlists(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(playlist_id, content_id)
);

-- Enable RLS on user_playlists
ALTER TABLE public.user_playlists ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_playlists
CREATE POLICY "Users can view their own playlists"
ON public.user_playlists
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.id = user_playlists.profile_id
  AND user_profiles.account_id = auth.uid()
));

CREATE POLICY "Users can create playlists for their profiles"
ON public.user_playlists
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.id = user_playlists.profile_id
  AND user_profiles.account_id = auth.uid()
));

CREATE POLICY "Users can update their own playlists"
ON public.user_playlists
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.id = user_playlists.profile_id
  AND user_profiles.account_id = auth.uid()
));

CREATE POLICY "Users can delete their own playlists"
ON public.user_playlists
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.id = user_playlists.profile_id
  AND user_profiles.account_id = auth.uid()
));

-- Enable RLS on user_playlist_items
ALTER TABLE public.user_playlist_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_playlist_items
CREATE POLICY "Users can view items in their playlists"
ON public.user_playlist_items
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_playlists
  JOIN user_profiles ON user_profiles.id = user_playlists.profile_id
  WHERE user_playlists.id = user_playlist_items.playlist_id
  AND user_profiles.account_id = auth.uid()
));

CREATE POLICY "Users can add items to their playlists"
ON public.user_playlist_items
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM user_playlists
  JOIN user_profiles ON user_profiles.id = user_playlists.profile_id
  WHERE user_playlists.id = user_playlist_items.playlist_id
  AND user_profiles.account_id = auth.uid()
));

CREATE POLICY "Users can update items in their playlists"
ON public.user_playlist_items
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM user_playlists
  JOIN user_profiles ON user_profiles.id = user_playlists.profile_id
  WHERE user_playlists.id = user_playlist_items.playlist_id
  AND user_profiles.account_id = auth.uid()
));

CREATE POLICY "Users can remove items from their playlists"
ON public.user_playlist_items
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM user_playlists
  JOIN user_profiles ON user_profiles.id = user_playlists.profile_id
  WHERE user_playlists.id = user_playlist_items.playlist_id
  AND user_profiles.account_id = auth.uid()
));

-- Update default features for membership plans
UPDATE public.membership_plans 
SET features = ARRAY['Limited content access', 'Ad-supported viewing', 'SD quality (480p)', 'Basic channels only'],
    included_channels = ARRAY['Zoe RatedTV']
WHERE slug = 'free';

UPDATE public.membership_plans 
SET features = ARRAY['Most content access', 'Limited ads (max 2 per show)', 'HD quality (1080p)', 'Most channels included', 'Create playlists'],
    included_channels = ARRAY['Zoe RatedTV', 'MadFaceTV', 'AyiTV', 'MyPureTV']
WHERE slug = 'standard';

UPDATE public.membership_plans 
SET features = ARRAY['All content access', 'No ads ever', '4K + HDR quality', 'All channels included', 'Create unlimited playlists', 'Download for offline', 'Multiple devices'],
    included_channels = ARRAY['Zoe RatedTV', 'MadFaceTV', 'AyiTV', 'MyPureTV', 'Yard MonTV', 'Indie Films', 'More Networks']
WHERE slug = 'premium';