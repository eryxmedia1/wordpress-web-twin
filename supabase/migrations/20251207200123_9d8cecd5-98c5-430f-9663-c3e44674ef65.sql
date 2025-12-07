-- Add channels column to contents table for network/channel tagging
ALTER TABLE public.contents 
ADD COLUMN IF NOT EXISTS channels text[] DEFAULT '{}';

-- Add comment explaining the column
COMMENT ON COLUMN public.contents.channels IS 'Array of channel/network names this content belongs to (e.g., Zoe RatedTV, MadFaceTV, AyiTV, MyPureTV, Yard MonTV, Indie Films, More Networks)';