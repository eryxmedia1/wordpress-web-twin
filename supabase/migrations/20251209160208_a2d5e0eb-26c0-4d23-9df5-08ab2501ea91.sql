-- ============================================
-- SECURITY FIX: Comprehensive RLS Policy Updates
-- ============================================

-- 1. FIX: live_channels - Hide sensitive credentials from non-admins
-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view non-sensitive channel data" ON public.live_channels;

-- Create new SELECT policy that only allows admins to see full data
-- Non-admins should use the live_channels_public view instead
CREATE POLICY "Only admins can view live_channels directly"
ON public.live_channels
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. FIX: episodes - Migrate from profiles.is_admin to has_role()
DROP POLICY IF EXISTS "Admins can manage all episodes" ON public.episodes;

CREATE POLICY "Admins can manage all episodes"
ON public.episodes
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. FIX: content_membership_plans - Migrate from profiles.is_admin to has_role()
DROP POLICY IF EXISTS "Admins can manage content plans" ON public.content_membership_plans;

CREATE POLICY "Admins can manage content plans"
ON public.content_membership_plans
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. FIX: ad_impressions - Require authentication for INSERT (prevent anonymous data poisoning)
DROP POLICY IF EXISTS "Anyone can insert ad impressions" ON public.ad_impressions;

CREATE POLICY "Authenticated users can insert ad impressions"
ON public.ad_impressions
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 5. FIX: channel_views - Require authentication for INSERT (prevent anonymous tracking poisoning)
DROP POLICY IF EXISTS "Anyone can insert views" ON public.channel_views;

CREATE POLICY "Authenticated users can insert views"
ON public.channel_views
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 6. FIX: profiles table - Ensure users cannot modify is_admin field
-- Drop existing update policy and recreate with stricter check
DROP POLICY IF EXISTS "Users can update own profile safely" ON public.profiles;

CREATE POLICY "Users can update own profile safely"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND is_admin IS NOT DISTINCT FROM (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid())
);