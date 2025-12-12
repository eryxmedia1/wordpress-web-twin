-- Drop existing policies on live_channel_active_viewers first
DROP POLICY IF EXISTS "Admins can view all active viewers" ON public.live_channel_active_viewers;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.live_channel_active_viewers;
DROP POLICY IF EXISTS "Authenticated users can insert viewer status" ON public.live_channel_active_viewers;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.live_channel_active_viewers;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.live_channel_active_viewers;
DROP POLICY IF EXISTS "Users can update their own view records" ON public.channel_views;

-- Now recreate the policies

-- Live channel active viewers - secure policies
CREATE POLICY "Admins can view all active viewers"
ON public.live_channel_active_viewers
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own sessions"
ON public.live_channel_active_viewers
FOR SELECT
USING (user_id = auth.uid() OR session_id LIKE (auth.uid()::text || '-%'));

CREATE POLICY "Authenticated users can insert viewer status"
ON public.live_channel_active_viewers
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (user_id IS NULL OR user_id = auth.uid())
  AND session_id LIKE (auth.uid()::text || '-%')
);

CREATE POLICY "Users can update own sessions"
ON public.live_channel_active_viewers
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND (user_id = auth.uid() OR session_id LIKE (auth.uid()::text || '-%'))
);

CREATE POLICY "Users can delete own sessions"
ON public.live_channel_active_viewers
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND (user_id = auth.uid() OR session_id LIKE (auth.uid()::text || '-%'))
);

-- Channel views - add UPDATE policy for duration tracking
CREATE POLICY "Users can update their own view records"
ON public.channel_views
FOR UPDATE
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());