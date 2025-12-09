-- Add max_midroll_count column to ad_pod_config for per-content/per-channel mid-roll count
ALTER TABLE public.ad_pod_config 
ADD COLUMN max_midroll_count integer DEFAULT 4;