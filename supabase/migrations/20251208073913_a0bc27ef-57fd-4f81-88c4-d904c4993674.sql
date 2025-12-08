-- Add is_coming_soon column to contents table
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS is_coming_soon BOOLEAN DEFAULT false;