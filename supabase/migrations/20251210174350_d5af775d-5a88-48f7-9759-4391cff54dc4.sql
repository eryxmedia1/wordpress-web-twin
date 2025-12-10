-- Insert test historical views for Live TV channels
INSERT INTO channel_views (live_channel_id, duration_seconds, progress_percent, geo_country, geo_region, geo_city, device_type, watched_at)
VALUES 
  -- MadFaceTV views
  ('1486038e-fba7-4894-8afc-6c88a92f3c39', 1800, 100, 'US', 'California', 'Los Angeles', 'desktop', NOW() - INTERVAL '1 hour'),
  ('1486038e-fba7-4894-8afc-6c88a92f3c39', 2400, 100, 'US', 'New York', 'New York', 'mobile', NOW() - INTERVAL '2 hours'),
  ('1486038e-fba7-4894-8afc-6c88a92f3c39', 1200, 50, 'UK', 'England', 'London', 'desktop', NOW() - INTERVAL '3 hours'),
  ('1486038e-fba7-4894-8afc-6c88a92f3c39', 3600, 100, 'CA', 'Ontario', 'Toronto', 'tablet', NOW() - INTERVAL '4 hours'),
  ('1486038e-fba7-4894-8afc-6c88a92f3c39', 900, 25, 'US', 'Texas', 'Houston', 'mobile', NOW() - INTERVAL '5 hours'),
  
  -- Zoe RatedTV views
  ('f2ac34fc-3b6a-4240-8fab-edec2d6bc7cc', 2700, 100, 'US', 'Florida', 'Miami', 'desktop', NOW() - INTERVAL '30 minutes'),
  ('f2ac34fc-3b6a-4240-8fab-edec2d6bc7cc', 1500, 75, 'US', 'California', 'San Francisco', 'mobile', NOW() - INTERVAL '1 hour'),
  ('f2ac34fc-3b6a-4240-8fab-edec2d6bc7cc', 3000, 100, 'UK', 'Scotland', 'Edinburgh', 'desktop', NOW() - INTERVAL '2 hours'),
  ('f2ac34fc-3b6a-4240-8fab-edec2d6bc7cc', 1800, 100, 'AU', 'New South Wales', 'Sydney', 'tablet', NOW() - INTERVAL '3 hours'),
  
  -- MyPureTV views
  ('369e3513-63d3-4530-88f0-b8d5d78e5928', 2100, 100, 'US', 'Georgia', 'Atlanta', 'desktop', NOW() - INTERVAL '45 minutes'),
  ('369e3513-63d3-4530-88f0-b8d5d78e5928', 1800, 90, 'JM', 'Kingston', 'Kingston', 'mobile', NOW() - INTERVAL '1.5 hours'),
  ('369e3513-63d3-4530-88f0-b8d5d78e5928', 2400, 100, 'US', 'Illinois', 'Chicago', 'desktop', NOW() - INTERVAL '2.5 hours'),
  
  -- Indie Films views
  ('d84c5a92-0500-43a5-a88b-dfca0af562f1', 5400, 100, 'US', 'New York', 'Brooklyn', 'desktop', NOW() - INTERVAL '20 minutes'),
  ('d84c5a92-0500-43a5-a88b-dfca0af562f1', 4200, 80, 'CA', 'British Columbia', 'Vancouver', 'mobile', NOW() - INTERVAL '1 hour'),
  
  -- Switcher Live views
  ('8e8d0e22-2ef5-454a-9cb9-685993a84dd7', 1800, 100, 'US', 'Nevada', 'Las Vegas', 'desktop', NOW() - INTERVAL '15 minutes'),
  ('8e8d0e22-2ef5-454a-9cb9-685993a84dd7', 2100, 100, 'US', 'Arizona', 'Phoenix', 'mobile', NOW() - INTERVAL '40 minutes');

-- Insert simulated active viewers (with recent heartbeat to appear as "live")
INSERT INTO live_channel_active_viewers (session_id, live_channel_id, device_type, geo_country, geo_region, geo_city, last_heartbeat, started_at)
VALUES
  -- Active viewers on MadFaceTV
  ('test-session-1', '1486038e-fba7-4894-8afc-6c88a92f3c39', 'desktop', 'US', 'California', 'Los Angeles', NOW(), NOW() - INTERVAL '10 minutes'),
  ('test-session-2', '1486038e-fba7-4894-8afc-6c88a92f3c39', 'mobile', 'US', 'New York', 'New York', NOW(), NOW() - INTERVAL '5 minutes'),
  ('test-session-3', '1486038e-fba7-4894-8afc-6c88a92f3c39', 'tablet', 'UK', 'England', 'London', NOW(), NOW() - INTERVAL '8 minutes'),
  
  -- Active viewers on Zoe RatedTV
  ('test-session-4', 'f2ac34fc-3b6a-4240-8fab-edec2d6bc7cc', 'desktop', 'US', 'Texas', 'Dallas', NOW(), NOW() - INTERVAL '15 minutes'),
  ('test-session-5', 'f2ac34fc-3b6a-4240-8fab-edec2d6bc7cc', 'mobile', 'CA', 'Ontario', 'Toronto', NOW(), NOW() - INTERVAL '3 minutes'),
  
  -- Active viewer on MyPureTV
  ('test-session-6', '369e3513-63d3-4530-88f0-b8d5d78e5928', 'desktop', 'JM', 'Kingston', 'Kingston', NOW(), NOW() - INTERVAL '12 minutes'),
  
  -- Active viewers on Indie Films
  ('test-session-7', 'd84c5a92-0500-43a5-a88b-dfca0af562f1', 'mobile', 'US', 'Florida', 'Miami', NOW(), NOW() - INTERVAL '7 minutes'),
  ('test-session-8', 'd84c5a92-0500-43a5-a88b-dfca0af562f1', 'desktop', 'AU', 'Victoria', 'Melbourne', NOW(), NOW() - INTERVAL '2 minutes');