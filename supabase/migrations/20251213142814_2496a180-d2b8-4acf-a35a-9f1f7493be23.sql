-- Add spots_available column to casting_roles for tracking number of positions needed
ALTER TABLE public.casting_roles 
ADD COLUMN spots_available integer NOT NULL DEFAULT 1;