-- Add midroll_config column to contents table for storing mid-roll ad configuration
ALTER TABLE public.contents 
ADD COLUMN midroll_config jsonb DEFAULT '{"enabled": false, "count": 1, "startAfterMinutes": 5, "intervalMinutes": 10}'::jsonb;