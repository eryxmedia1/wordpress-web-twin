-- Update global ad config to 60-minute intervals for Live TV and episodic content
-- This ensures 4 mid-rolls per hour (at 15, 30, 45, 60 minutes)
UPDATE ad_global_config 
SET midroll_interval_minutes = 60,
    updated_at = now()
WHERE id = '3949d1bb-e7ae-460f-b60c-8ae7881a8ad3';

-- If no row exists, insert one with the 60-minute interval
INSERT INTO ad_global_config (preroll_pod_size, midroll_pod_size, postroll_pod_size, midroll_interval_minutes)
SELECT 1, 1, 1, 60
WHERE NOT EXISTS (SELECT 1 FROM ad_global_config LIMIT 1);