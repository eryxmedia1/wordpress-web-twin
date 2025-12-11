-- Add remaining standard genres with movie-specific slugs
INSERT INTO categories (name, slug, description, content_type) VALUES
('Action', 'action-movies', 'High-energy action films with stunts and excitement', 'movie'),
('Anime', 'anime-movies', 'Japanese animated films and series', 'movie'),
('Comedy', 'comedy-movies', 'Laugh-out-loud funny films', 'movie'),
('Drama', 'drama-movies', 'Emotional and character-driven stories', 'movie'),
('Family', 'family-movies', 'Family-friendly entertainment for all ages', 'movie');