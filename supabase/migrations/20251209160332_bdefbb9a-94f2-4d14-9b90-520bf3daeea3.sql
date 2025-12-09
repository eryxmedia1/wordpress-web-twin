-- ============================================
-- SECURITY FIX: Strengthen INSERT policies with user validation
-- ============================================

-- 1. FIX: ad_impressions - Validate user_id matches authenticated user
DROP POLICY IF EXISTS "Authenticated users can insert ad impressions" ON public.ad_impressions;

CREATE POLICY "Users can insert their own ad impressions"
ON public.ad_impressions
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- 2. FIX: channel_views - Validate user_id matches authenticated user  
DROP POLICY IF EXISTS "Authenticated users can insert views" ON public.channel_views;

CREATE POLICY "Users can insert their own views"
ON public.channel_views
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (user_id IS NULL OR user_id = auth.uid())
);