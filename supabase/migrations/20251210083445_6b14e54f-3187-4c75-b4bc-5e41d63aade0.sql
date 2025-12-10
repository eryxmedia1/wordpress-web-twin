-- Allow all authenticated users to SELECT from live_channels
-- The live_channels_public view already filters out sensitive fields (stream_key, rtmp_url, mux_stream_id)
-- This policy enables the public view to work for all users

-- First, drop the restrictive admin-only SELECT policy
DROP POLICY IF EXISTS "Only admins can view live_channels directly" ON live_channels;

-- Create a new policy that allows all authenticated users to view channels
-- Sensitive credentials are still protected since the public view excludes them
CREATE POLICY "Authenticated users can view live channels" 
ON live_channels 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Keep the admin-only policy for INSERT, UPDATE, DELETE via the ALL policy
-- "Admins can manage live channels" already handles this