-- Create membership_plans table
CREATE TABLE public.membership_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10, 2) DEFAULT 0,
    features TEXT[],
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view plans
CREATE POLICY "Anyone can view membership plans"
ON public.membership_plans
FOR SELECT
USING (true);

-- Only admins can modify plans
CREATE POLICY "Admins can manage membership plans"
ON public.membership_plans
FOR ALL
USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
));

-- Insert default plans
INSERT INTO public.membership_plans (name, slug, sort_order) VALUES
('Free Plan', 'free', 1),
('Diamond Plan', 'diamond', 2),
('Platinum Plan', 'platinum', 3);

-- Create content_membership_plans junction table for assigning plans to content
CREATE TABLE public.content_membership_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.membership_plans(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(content_id, plan_id)
);

-- Enable RLS
ALTER TABLE public.content_membership_plans ENABLE ROW LEVEL SECURITY;

-- Anyone can view content plan assignments
CREATE POLICY "Anyone can view content plans"
ON public.content_membership_plans
FOR SELECT
USING (true);

-- Only admins can modify content plan assignments
CREATE POLICY "Admins can manage content plans"
ON public.content_membership_plans
FOR ALL
USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
));

-- Add subtitles column to contents table as JSONB array
ALTER TABLE public.contents 
ADD COLUMN IF NOT EXISTS subtitles JSONB DEFAULT '[]'::jsonb;

-- Add additional video fields
ALTER TABLE public.contents
ADD COLUMN IF NOT EXISTS is_affiliate_url BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS video_sources JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS crew_members JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS download_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS download_url TEXT;