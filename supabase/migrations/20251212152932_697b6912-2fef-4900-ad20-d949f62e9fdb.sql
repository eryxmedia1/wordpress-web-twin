-- Add SELECT policy so users can see their own sessions (needed for upsert to work)
CREATE POLICY "Users can view their own sessions"
ON public.live_channel_active_viewers
FOR SELECT
USING (
  session_id LIKE (auth.uid()::text || '-%')
  OR user_id = auth.uid()
  OR auth.uid() IS NULL -- Allow anonymous sessions too
);

-- Also add a policy for anonymous users to see their sessions by session_id
CREATE POLICY "Anonymous users can view their sessions"
ON public.live_channel_active_viewers
FOR SELECT
USING (auth.uid() IS NULL);