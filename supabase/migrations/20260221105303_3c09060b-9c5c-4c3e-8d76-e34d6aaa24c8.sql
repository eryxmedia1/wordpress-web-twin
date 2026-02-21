
-- ============================================
-- FIX 1: Talent PII exposure - create public view without sensitive fields
-- ============================================

-- Create a public view for talents that excludes PII
CREATE OR REPLACE VIEW public.talents_public
WITH (security_invoker=on) AS
  SELECT 
    id, user_id, category, is_featured, is_active, is_approved,
    created_at, updated_at, name, bio, country, city, state,
    height, hair_color, eye_color, ethnicity, age_range,
    primary_photo_url, video_reel_url,
    skills_tags, languages, union_status, availability_notes,
    willing_to_travel, has_passport,
    comfort_speaking, comfort_improv, comfort_stunts, comfort_swimwear,
    has_drivers_license, applicant_type,
    crew_primary_role, crew_secondary_roles, crew_years_experience,
    portfolio_url, imdb_url, website_url,
    instagram_url, tiktok_url, youtube_url, facebook_url, x_twitter_url
  FROM public.talents;
  -- Excludes: email, phone, bust, waist, hips, shoe_size, weight,
  -- clothing_size_top, clothing_size_bottom, skin_tone, tattoo_notes,
  -- piercing_notes, distinguishing_features, has_tattoos, has_piercings,
  -- comfort_romance_level, follower_count, best_platform, resume_url,
  -- crew_gear_owned, crew_software, crew_certifications, crew_work_preferences,
  -- availability_dates

-- ============================================
-- FIX 2: live_channel_active_viewers - remove overly permissive policies
-- ============================================

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can delete viewer sessions" ON public.live_channel_active_viewers;
DROP POLICY IF EXISTS "Anyone can insert viewer sessions" ON public.live_channel_active_viewers;
DROP POLICY IF EXISTS "Anyone can update viewer sessions" ON public.live_channel_active_viewers;
DROP POLICY IF EXISTS "Anonymous users can view their sessions" ON public.live_channel_active_viewers;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.live_channel_active_viewers;

-- Create proper restrictive policies
CREATE POLICY "Authenticated users can insert their own viewer sessions"
ON public.live_channel_active_viewers FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (user_id IS NULL OR user_id = auth.uid())
);

CREATE POLICY "Users can update their own viewer sessions"
ON public.live_channel_active_viewers FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND (user_id = auth.uid() OR session_id LIKE (auth.uid()::text || '-%'))
);

CREATE POLICY "Users can delete their own viewer sessions"
ON public.live_channel_active_viewers FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND (user_id = auth.uid() OR session_id LIKE (auth.uid()::text || '-%'))
);

CREATE POLICY "Users can view their own viewer sessions"
ON public.live_channel_active_viewers FOR SELECT
USING (
  user_id = auth.uid() 
  OR session_id LIKE (auth.uid()::text || '-%')
);

-- ============================================
-- FIX 3: channel_notifications - fix always-true INSERT
-- ============================================

DROP POLICY IF EXISTS "System can insert notifications" ON public.channel_notifications;

-- Replace with a policy that requires authentication or service role
CREATE POLICY "Service role can insert notifications"
ON public.channel_notifications FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- ============================================
-- FIX 4: user_notifications - fix always-true INSERT  
-- ============================================

DROP POLICY IF EXISTS "System can insert notifications" ON public.user_notifications;

-- Replace with admin-only insert (notifications created by system/admin)
CREATE POLICY "Admins can insert notifications"
ON public.user_notifications FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- ============================================
-- FIX 5: Conversations - tighten department staff access
-- ============================================

DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;

CREATE POLICY "Users can view own conversations"
ON public.conversations FOR SELECT
USING (
  auth.uid() = user_id 
  OR (
    EXISTS (
      SELECT 1 FROM department_staff ds
      WHERE ds.department_id = conversations.department_id 
      AND ds.user_id = auth.uid()
      AND ds.is_active = true
      AND (ds.permissions->>'can_message')::boolean = true
    )
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);
