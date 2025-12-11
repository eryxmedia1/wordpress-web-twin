-- Update existing generic categories to be movie type
UPDATE categories SET content_type = 'movie' WHERE slug IN ('action', 'anime', 'comedy', 'drama', 'family') AND content_type IS NULL;