-- Drop existing complex policies
DROP POLICY IF EXISTS "Authenticated users can manage their sessions" ON public.live_channel_active_viewers;
DROP POLICY IF EXISTS "Anyone can insert anonymous viewer sessions" ON public.live_channel_active_viewers;
DROP POLICY IF EXISTS "Anyone can update their own anonymous sessions" ON public.live_channel_active_viewers;
DROP POLICY IF EXISTS "Anyone can delete their own anonymous sessions" ON public.live_channel_active_viewers;

-- Create simpler, more permissive policies for viewer tracking
-- INSERT: Allow anyone to insert (authenticated or anonymous)
CREATE POLICY "Anyone can insert viewer sessions"
ON public.live_channel_active_viewers
FOR INSERT
WITH CHECK (true);

-- UPDATE: Allow anyone to update based on session_id match (checked in app logic)
CREATE POLICY "Anyone can update viewer sessions"
ON public.live_channel_active_viewers
FOR UPDATE
USING (true)
WITH CHECK (true);

-- DELETE: Allow anyone to delete based on session_id match (checked in app logic)
CREATE POLICY "Anyone can delete viewer sessions"
ON public.live_channel_active_viewers
FOR DELETE
USING (true);

-- Ensure there's a unique constraint on session_id for upsert to work
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'live_channel_active_viewers_session_id_key'
  ) THEN
    ALTER TABLE public.live_channel_active_viewers
    ADD CONSTRAINT live_channel_active_viewers_session_id_key UNIQUE (session_id);
  END IF;
END $$;