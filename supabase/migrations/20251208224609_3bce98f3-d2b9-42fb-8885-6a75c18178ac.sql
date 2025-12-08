-- Add episode_id column to live_playlist_items to support episodic series
ALTER TABLE public.live_playlist_items 
ADD COLUMN episode_id uuid REFERENCES public.episodes(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_live_playlist_items_episode_id ON public.live_playlist_items(episode_id);

-- Comment for clarity
COMMENT ON COLUMN public.live_playlist_items.episode_id IS 'When set, this playlist item plays a specific episode instead of the content video_id';