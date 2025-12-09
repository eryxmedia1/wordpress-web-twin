-- Randomize playlist items for MyPureTV playlist
-- Using a random shuffle algorithm by assigning random order

WITH shuffled AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY random()) as new_order
  FROM live_playlist_items
  WHERE channel_playlist_id = 'b6824830-2f3b-4858-99a9-ab6e1544a46f'
)
UPDATE live_playlist_items 
SET order_index = shuffled.new_order
FROM shuffled
WHERE live_playlist_items.id = shuffled.id;