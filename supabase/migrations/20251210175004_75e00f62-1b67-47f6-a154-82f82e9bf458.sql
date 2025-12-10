
-- Delete all test/dummy data from channel_views for live channels
-- These were inserted on 2025-12-10 as test data
DELETE FROM channel_views 
WHERE live_channel_id IS NOT NULL 
AND watched_at >= '2025-12-10 12:00:00+00'
AND watched_at <= '2025-12-10 18:00:00+00';

-- Also clean up any stale active viewers (should already be empty)
DELETE FROM live_channel_active_viewers;
