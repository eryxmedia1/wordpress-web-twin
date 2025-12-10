-- Allow anonymous users to insert and manage their own sessions
DROP POLICY IF EXISTS "Users can manage their own viewer sessions" ON public.live_channel_active_viewers;
DROP POLICY IF EXISTS "Anonymous can insert viewer sessions" ON public.live_channel_active_viewers;

-- Policy for authenticated users
CREATE POLICY "Authenticated users can manage their sessions" 
ON public.live_channel_active_viewers 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for anonymous tracking (session_id based, no user_id required)
CREATE POLICY "Anyone can insert anonymous viewer sessions" 
ON public.live_channel_active_viewers 
FOR INSERT 
WITH CHECK (user_id IS NULL);

-- Policy for anonymous to update their own sessions by session_id
CREATE POLICY "Anyone can update their own anonymous sessions" 
ON public.live_channel_active_viewers 
FOR UPDATE 
USING (user_id IS NULL)
WITH CHECK (user_id IS NULL);

-- Policy for anonymous to delete their own sessions
CREATE POLICY "Anyone can delete their own anonymous sessions" 
ON public.live_channel_active_viewers 
FOR DELETE 
USING (user_id IS NULL);