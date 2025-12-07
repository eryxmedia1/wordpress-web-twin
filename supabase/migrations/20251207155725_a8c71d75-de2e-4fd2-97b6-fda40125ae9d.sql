-- Create app_role enum for user roles (security best practice)
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for proper role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create user_profiles table (household profiles like Netflix)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_color TEXT DEFAULT '#d4af37',
  avatar_icon TEXT DEFAULT 'smile',
  is_kids BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_profiles
CREATE POLICY "Users can view their own profiles"
ON public.user_profiles FOR SELECT
USING (auth.uid() = account_id);

CREATE POLICY "Users can create their own profiles"
ON public.user_profiles FOR INSERT
WITH CHECK (auth.uid() = account_id);

CREATE POLICY "Users can update their own profiles"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = account_id);

CREATE POLICY "Users can delete their own profiles"
ON public.user_profiles FOR DELETE
USING (auth.uid() = account_id);

-- Create favorites table (My List)
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, content_id)
);

-- Enable RLS on favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- RLS policies for favorites (user can only access favorites for profiles they own)
CREATE POLICY "Users can view their profiles favorites"
ON public.favorites FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_profiles
  WHERE user_profiles.id = favorites.profile_id
  AND user_profiles.account_id = auth.uid()
));

CREATE POLICY "Users can add to their profiles favorites"
ON public.favorites FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_profiles
  WHERE user_profiles.id = favorites.profile_id
  AND user_profiles.account_id = auth.uid()
));

CREATE POLICY "Users can remove from their profiles favorites"
ON public.favorites FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.user_profiles
  WHERE user_profiles.id = favorites.profile_id
  AND user_profiles.account_id = auth.uid()
));

-- Create likes table (thumbs up/down for recommendations)
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating IN (1, -1)),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, content_id)
);

-- Enable RLS on likes
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for likes
CREATE POLICY "Users can view their profiles likes"
ON public.likes FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_profiles
  WHERE user_profiles.id = likes.profile_id
  AND user_profiles.account_id = auth.uid()
));

CREATE POLICY "Users can add likes for their profiles"
ON public.likes FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_profiles
  WHERE user_profiles.id = likes.profile_id
  AND user_profiles.account_id = auth.uid()
));

CREATE POLICY "Users can update their profiles likes"
ON public.likes FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.user_profiles
  WHERE user_profiles.id = likes.profile_id
  AND user_profiles.account_id = auth.uid()
));

CREATE POLICY "Users can delete their profiles likes"
ON public.likes FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.user_profiles
  WHERE user_profiles.id = likes.profile_id
  AND user_profiles.account_id = auth.uid()
));

-- Create watch_history table (continue watching + viewing history)
CREATE TABLE public.watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE SET NULL,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  last_watched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, content_id, episode_id)
);

-- Enable RLS on watch_history
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for watch_history
CREATE POLICY "Users can view their profiles watch history"
ON public.watch_history FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_profiles
  WHERE user_profiles.id = watch_history.profile_id
  AND user_profiles.account_id = auth.uid()
));

CREATE POLICY "Users can add to their profiles watch history"
ON public.watch_history FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_profiles
  WHERE user_profiles.id = watch_history.profile_id
  AND user_profiles.account_id = auth.uid()
));

CREATE POLICY "Users can update their profiles watch history"
ON public.watch_history FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.user_profiles
  WHERE user_profiles.id = watch_history.profile_id
  AND user_profiles.account_id = auth.uid()
));

-- Add new columns to contents table for enhanced metadata
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS cast_members TEXT[];
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS creator TEXT;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS audio_languages TEXT[];
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS subtitle_languages TEXT[];
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS is_zoe_original BOOLEAN DEFAULT FALSE;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS top_rank INTEGER;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS maturity_rating TEXT;

-- Create function to auto-create default profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (account_id, name, avatar_color)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Profile 1'), '#d4af37');
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();