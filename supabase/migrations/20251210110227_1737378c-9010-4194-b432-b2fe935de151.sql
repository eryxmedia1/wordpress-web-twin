-- Add allowed_tiers column to live_channel_playlists table
ALTER TABLE live_channel_playlists ADD COLUMN allowed_tiers text[] DEFAULT ARRAY['free', 'standard', 'premium']::text[];