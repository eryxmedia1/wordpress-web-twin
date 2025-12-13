-- =============================================
-- PHASE 1: CASTING PORTAL DATABASE SCHEMA
-- =============================================

-- 1.1 Create casting_shows table (Shows We're Casting For)
CREATE TABLE public.casting_shows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logline TEXT,
  poster_url TEXT,
  trailer_url TEXT,
  filming_dates TEXT,
  filming_location TEXT,
  production_notes TEXT,
  pay_range_min NUMERIC,
  pay_range_max NUMERIC,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'hold', 'closed')),
  deadline DATE,
  is_featured BOOLEAN DEFAULT false,
  casting_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.2 Create casting_roles table (Roles Per Show)
CREATE TABLE public.casting_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  show_id UUID NOT NULL REFERENCES public.casting_shows(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  role_type TEXT NOT NULL DEFAULT 'talent' CHECK (role_type IN ('talent', 'crew')),
  description TEXT,
  requirements TEXT,
  shoot_dates TEXT,
  time_commitment TEXT,
  location_notes TEXT,
  pay_type TEXT CHECK (pay_type IN ('hourly', 'daily', 'flat', 'deferred', 'unpaid')),
  pay_amount TEXT,
  payment_terms TEXT,
  terms_conditions TEXT,
  custom_questions JSONB DEFAULT '[]'::jsonb,
  is_remote BOOLEAN DEFAULT false,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'filled', 'closed')),
  casting_email TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.3 Add new columns to talents table
ALTER TABLE public.talents
ADD COLUMN IF NOT EXISTS applicant_type TEXT DEFAULT 'talent' CHECK (applicant_type IN ('talent', 'crew')),
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS willing_to_travel BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_passport BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS pronouns TEXT,
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS union_status TEXT,
ADD COLUMN IF NOT EXISTS availability_notes TEXT,
ADD COLUMN IF NOT EXISTS availability_dates TEXT,
ADD COLUMN IF NOT EXISTS skills_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS clothing_size_top TEXT,
ADD COLUMN IF NOT EXISTS clothing_size_bottom TEXT,
ADD COLUMN IF NOT EXISTS skin_tone TEXT,
ADD COLUMN IF NOT EXISTS has_tattoos BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tattoo_notes TEXT,
ADD COLUMN IF NOT EXISTS has_piercings BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS piercing_notes TEXT,
ADD COLUMN IF NOT EXISTS distinguishing_features TEXT,
ADD COLUMN IF NOT EXISTS comfort_speaking BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS comfort_improv BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS comfort_romance_level TEXT DEFAULT 'none' CHECK (comfort_romance_level IN ('none', 'pg13', 'mature')),
ADD COLUMN IF NOT EXISTS comfort_stunts BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS comfort_swimwear BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_drivers_license BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS imdb_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS x_twitter_url TEXT,
ADD COLUMN IF NOT EXISTS follower_count TEXT,
ADD COLUMN IF NOT EXISTS best_platform TEXT,
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS crew_primary_role TEXT,
ADD COLUMN IF NOT EXISTS crew_secondary_roles TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS crew_years_experience INTEGER,
ADD COLUMN IF NOT EXISTS crew_gear_owned TEXT,
ADD COLUMN IF NOT EXISTS crew_software TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS crew_certifications TEXT,
ADD COLUMN IF NOT EXISTS crew_work_preferences TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0;

-- 1.4 Add new columns to casting_applications table
ALTER TABLE public.casting_applications
ADD COLUMN IF NOT EXISTS show_id UUID REFERENCES public.casting_shows(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS role_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS profile_snapshot JSONB,
ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS pay_acceptance_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS terms_acceptance_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS admin_rating INTEGER CHECK (admin_rating >= 1 AND admin_rating <= 5);

-- Update status check constraint to include new statuses
ALTER TABLE public.casting_applications DROP CONSTRAINT IF EXISTS casting_applications_status_check;
ALTER TABLE public.casting_applications ADD CONSTRAINT casting_applications_status_check 
  CHECK (status IN ('pending', 'new', 'reviewed', 'shortlist', 'audition', 'booked', 'not_selected', 'rejected'));

-- 1.5 Create casting_email_config table
CREATE TABLE public.casting_email_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_type TEXT NOT NULL CHECK (email_type IN ('global', 'per_show', 'per_role')),
  show_id UUID REFERENCES public.casting_shows(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.casting_roles(id) ON DELETE CASCADE,
  emails TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.casting_shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casting_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casting_email_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for casting_shows
CREATE POLICY "Anyone can view open casting shows" ON public.casting_shows
  FOR SELECT USING (status = 'open' OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage casting shows" ON public.casting_shows
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for casting_roles
CREATE POLICY "Anyone can view open casting roles" ON public.casting_roles
  FOR SELECT USING (
    status = 'open' 
    OR has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM casting_shows WHERE casting_shows.id = casting_roles.show_id AND casting_shows.status = 'open')
  );

CREATE POLICY "Admins can manage casting roles" ON public.casting_roles
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for casting_email_config
CREATE POLICY "Admins can manage email config" ON public.casting_email_config
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_casting_shows_status ON public.casting_shows(status);
CREATE INDEX IF NOT EXISTS idx_casting_shows_slug ON public.casting_shows(slug);
CREATE INDEX IF NOT EXISTS idx_casting_roles_show_id ON public.casting_roles(show_id);
CREATE INDEX IF NOT EXISTS idx_casting_roles_role_type ON public.casting_roles(role_type);
CREATE INDEX IF NOT EXISTS idx_casting_applications_show_id ON public.casting_applications(show_id);
CREATE INDEX IF NOT EXISTS idx_talents_applicant_type ON public.talents(applicant_type);
CREATE INDEX IF NOT EXISTS idx_talents_skills_tags ON public.talents USING GIN(skills_tags);

-- Update timestamp trigger for new tables
CREATE TRIGGER update_casting_shows_updated_at
  BEFORE UPDATE ON public.casting_shows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_casting_roles_updated_at
  BEFORE UPDATE ON public.casting_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();