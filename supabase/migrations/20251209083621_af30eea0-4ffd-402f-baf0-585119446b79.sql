-- Create indie_channels table
CREATE TABLE public.indie_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  logo_url text,
  trailer_url text,
  backdrop_url text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indie_channel_favorites table
CREATE TABLE public.indie_channel_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  indie_channel_id uuid NOT NULL REFERENCES public.indie_channels(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(profile_id, indie_channel_id)
);

-- Add indie_channel_id to contents table
ALTER TABLE public.contents ADD COLUMN indie_channel_id uuid REFERENCES public.indie_channels(id) ON DELETE SET NULL;

-- Add indie_channel_id to ad_placements table for ad targeting
ALTER TABLE public.ad_placements ADD COLUMN indie_channel_id uuid REFERENCES public.indie_channels(id) ON DELETE CASCADE;

-- Enable RLS on new tables
ALTER TABLE public.indie_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indie_channel_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for indie_channels
CREATE POLICY "Anyone can view active indie channels" 
ON public.indie_channels 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all indie channels" 
ON public.indie_channels 
FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Owners can manage their own channels" 
ON public.indie_channels 
FOR ALL 
USING (owner_id = auth.uid());

-- RLS Policies for indie_channel_favorites
CREATE POLICY "Users can view their profile favorites" 
ON public.indie_channel_favorites 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = indie_channel_favorites.profile_id AND user_profiles.account_id = auth.uid()));

CREATE POLICY "Users can add to their profile favorites" 
ON public.indie_channel_favorites 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = indie_channel_favorites.profile_id AND user_profiles.account_id = auth.uid()));

CREATE POLICY "Users can remove from their profile favorites" 
ON public.indie_channel_favorites 
FOR DELETE 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = indie_channel_favorites.profile_id AND user_profiles.account_id = auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_contents_indie_channel ON public.contents(indie_channel_id);
CREATE INDEX idx_indie_channel_favorites_profile ON public.indie_channel_favorites(profile_id);
CREATE INDEX idx_indie_channel_favorites_channel ON public.indie_channel_favorites(indie_channel_id);