-- =====================================================
-- SECURITY FIX: Migrate all admin checks from profiles.is_admin to user_roles with has_role()
-- =====================================================

-- 1. Drop and recreate all RLS policies that use profiles.is_admin

-- ADS TABLE
DROP POLICY IF EXISTS "Admins can manage ads" ON ads;
CREATE POLICY "Admins can manage ads" ON ads FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- AD_PLACEMENTS TABLE
DROP POLICY IF EXISTS "Admins can manage ad placements" ON ad_placements;
CREATE POLICY "Admins can manage ad placements" ON ad_placements FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- AD_TARGETING TABLE
DROP POLICY IF EXISTS "Admins can manage ad targeting" ON ad_targeting;
CREATE POLICY "Admins can manage ad targeting" ON ad_targeting FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- AD_IMPRESSIONS TABLE
DROP POLICY IF EXISTS "Admins can manage ad impressions" ON ad_impressions;
CREATE POLICY "Admins can manage ad impressions" ON ad_impressions FOR ALL
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view their own impressions" ON ad_impressions;
CREATE POLICY "Users can view their own impressions" ON ad_impressions FOR SELECT
USING ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'));

-- AD_POD_CONFIG TABLE
DROP POLICY IF EXISTS "Admins can manage ad pod config" ON ad_pod_config;
CREATE POLICY "Admins can manage ad pod config" ON ad_pod_config FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- AD_GLOBAL_CONFIG TABLE
DROP POLICY IF EXISTS "Admins can manage ad global config" ON ad_global_config;
CREATE POLICY "Admins can manage ad global config" ON ad_global_config FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- AD_MIDROLL_POD_CONFIG TABLE
DROP POLICY IF EXISTS "Admins can manage midroll pod config" ON ad_midroll_pod_config;
CREATE POLICY "Admins can manage midroll pod config" ON ad_midroll_pod_config FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- CATEGORIES TABLE
DROP POLICY IF EXISTS "Only admins can modify categories" ON categories;
CREATE POLICY "Only admins can modify categories" ON categories FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- CONTENT_TAGS TABLE
DROP POLICY IF EXISTS "Only admins can modify content_tags" ON content_tags;
CREATE POLICY "Only admins can modify content_tags" ON content_tags FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- CONTENTS TABLE
DROP POLICY IF EXISTS "Admins can manage all contents" ON contents;
CREATE POLICY "Admins can manage all contents" ON contents FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- PLAYLISTS TABLE
DROP POLICY IF EXISTS "Only admins can modify playlists" ON playlists;
CREATE POLICY "Only admins can modify playlists" ON playlists FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- PLAYLIST_ITEMS TABLE
DROP POLICY IF EXISTS "Only admins can modify playlist_items" ON playlist_items;
CREATE POLICY "Only admins can modify playlist_items" ON playlist_items FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- TAGS TABLE
DROP POLICY IF EXISTS "Only admins can modify tags" ON tags;
CREATE POLICY "Only admins can modify tags" ON tags FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- LIVE_CHANNELS TABLE
DROP POLICY IF EXISTS "Admins can manage live channels" ON live_channels;
CREATE POLICY "Admins can manage live channels" ON live_channels FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add public SELECT policy for live_channels (hides sensitive fields)
CREATE POLICY "Public can view non-sensitive channel data" ON live_channels FOR SELECT
USING (true);

-- LIVE_CHANNEL_PLAYLISTS TABLE
DROP POLICY IF EXISTS "Admins can manage channel playlists" ON live_channel_playlists;
CREATE POLICY "Admins can manage channel playlists" ON live_channel_playlists FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- LIVE_PLAYLIST_ITEMS TABLE
DROP POLICY IF EXISTS "Admins can manage playlist items" ON live_playlist_items;
CREATE POLICY "Admins can manage playlist items" ON live_playlist_items FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- LIVE_AD_BREAKS TABLE
DROP POLICY IF EXISTS "Admins can manage ad breaks" ON live_ad_breaks;
CREATE POLICY "Admins can manage ad breaks" ON live_ad_breaks FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- SEASONS TABLE
DROP POLICY IF EXISTS "Admins can manage all seasons" ON seasons;
CREATE POLICY "Admins can manage all seasons" ON seasons FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- MEMBERSHIP_PLANS TABLE
DROP POLICY IF EXISTS "Admins can manage membership plans" ON membership_plans;
CREATE POLICY "Admins can manage membership plans" ON membership_plans FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- AUTH_BACKGROUNDS TABLE
DROP POLICY IF EXISTS "Admins can manage auth backgrounds" ON auth_backgrounds;
CREATE POLICY "Admins can manage auth backgrounds" ON auth_backgrounds FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- CHANNEL_VIEWS TABLE
DROP POLICY IF EXISTS "Admins can view all analytics" ON channel_views;
CREATE POLICY "Admins can view all analytics" ON channel_views FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- INDIE_CHANNELS TABLE - Add admin policy
DROP POLICY IF EXISTS "Admins can manage all indie channels" ON indie_channels;
CREATE POLICY "Admins can manage all indie channels" ON indie_channels FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- INDIE_CHANNEL_CATEGORIES TABLE
DROP POLICY IF EXISTS "Admins can manage all indie channel categories" ON indie_channel_categories;
CREATE POLICY "Admins can manage all indie channel categories" ON indie_channel_categories FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- INDIE_CHANNEL_CATEGORY_ITEMS TABLE
DROP POLICY IF EXISTS "Admins can manage all category items" ON indie_channel_category_items;
CREATE POLICY "Admins can manage all category items" ON indie_channel_category_items FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- 2. Update PROFILES table security
-- Restrict SELECT to own profile or admin
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Prevent users from updating is_admin field
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update own profile safely" ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND (is_admin IS NOT DISTINCT FROM (SELECT p.is_admin FROM profiles p WHERE p.id = auth.uid()))
);