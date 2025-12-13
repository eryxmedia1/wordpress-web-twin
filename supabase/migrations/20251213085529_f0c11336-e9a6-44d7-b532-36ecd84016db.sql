-- Create talent categories enum
CREATE TYPE public.talent_category AS ENUM ('actor', 'model', 'singer', 'dancer', 'extra', 'voice_artist', 'host', 'influencer', 'other');

-- Create talents table
CREATE TABLE public.talents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  category talent_category NOT NULL DEFAULT 'actor',
  country TEXT,
  city TEXT,
  state TEXT,
  height TEXT,
  bust TEXT,
  waist TEXT,
  hips TEXT,
  shoe_size TEXT,
  weight TEXT,
  hair_color TEXT,
  eye_color TEXT,
  ethnicity TEXT,
  age_range TEXT,
  primary_photo_url TEXT,
  video_reel_url TEXT,
  instagram_url TEXT,
  tiktok_url TEXT,
  youtube_url TEXT,
  website_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create talent photos table
CREATE TABLE public.talent_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create talent work history table
CREATE TABLE public.talent_work_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
  project_title TEXT NOT NULL,
  role TEXT,
  project_type TEXT,
  year TEXT,
  director TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create casting calls table
CREATE TABLE public.casting_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  project_name TEXT,
  category talent_category NOT NULL DEFAULT 'actor',
  location TEXT,
  compensation TEXT,
  deadline DATE,
  requirements TEXT,
  age_range TEXT,
  gender TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  poster_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create casting applications table
CREATE TABLE public.casting_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  casting_call_id UUID REFERENCES public.casting_calls(id) ON DELETE CASCADE NOT NULL,
  talent_id UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending',
  cover_letter TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(casting_call_id, talent_id)
);

-- Create casting hero banners table
CREATE TABLE public.casting_hero_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  button_text TEXT DEFAULT 'Become a Talent',
  button_url TEXT DEFAULT '/talent/signup',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.talents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_work_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casting_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casting_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casting_hero_banners ENABLE ROW LEVEL SECURITY;

-- Talents policies
CREATE POLICY "Anyone can view approved talents" ON public.talents
  FOR SELECT USING (is_approved = true AND is_active = true);

CREATE POLICY "Users can view their own talent profile" ON public.talents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own talent profile" ON public.talents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own talent profile" ON public.talents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own talent profile" ON public.talents
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all talents" ON public.talents
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Talent photos policies
CREATE POLICY "Anyone can view photos of approved talents" ON public.talent_photos
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.talents 
    WHERE talents.id = talent_photos.talent_id 
    AND (talents.is_approved = true OR talents.user_id = auth.uid())
  ));

CREATE POLICY "Users can manage their own photos" ON public.talent_photos
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.talents 
    WHERE talents.id = talent_photos.talent_id 
    AND talents.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all photos" ON public.talent_photos
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Work history policies
CREATE POLICY "Anyone can view work history of approved talents" ON public.talent_work_history
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.talents 
    WHERE talents.id = talent_work_history.talent_id 
    AND (talents.is_approved = true OR talents.user_id = auth.uid())
  ));

CREATE POLICY "Users can manage their own work history" ON public.talent_work_history
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.talents 
    WHERE talents.id = talent_work_history.talent_id 
    AND talents.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all work history" ON public.talent_work_history
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Casting calls policies
CREATE POLICY "Anyone can view active casting calls" ON public.casting_calls
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all casting calls" ON public.casting_calls
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Casting applications policies
CREATE POLICY "Talents can view their own applications" ON public.casting_applications
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.talents 
    WHERE talents.id = casting_applications.talent_id 
    AND talents.user_id = auth.uid()
  ));

CREATE POLICY "Talents can create applications" ON public.casting_applications
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.talents 
    WHERE talents.id = casting_applications.talent_id 
    AND talents.user_id = auth.uid()
  ));

CREATE POLICY "Talents can delete their own applications" ON public.casting_applications
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.talents 
    WHERE talents.id = casting_applications.talent_id 
    AND talents.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all applications" ON public.casting_applications
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Hero banners policies
CREATE POLICY "Anyone can view active banners" ON public.casting_hero_banners
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage banners" ON public.casting_hero_banners
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_talents_updated_at
  BEFORE UPDATE ON public.talents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_casting_calls_updated_at
  BEFORE UPDATE ON public.casting_calls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();