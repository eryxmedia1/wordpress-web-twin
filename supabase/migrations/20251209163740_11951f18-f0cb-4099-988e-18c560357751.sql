-- Randomize playlist items for Indie Films playlist
WITH shuffled AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY random()) as new_order
  FROM live_playlist_items
  WHERE channel_playlist_id = 'e306200f-b2a7-4132-a2b3-aefd3170416d'
)
UPDATE live_playlist_items 
SET order_index = shuffled.new_order
FROM shuffled
WHERE live_playlist_items.id = shuffled.id;