-- Add new categories for both movies and shows (with unique slugs)
INSERT INTO public.categories (name, slug, description, content_type) VALUES
('Chases', 'chases-movie', 'Chase scenes and pursuit content', 'movie'),
('Chases', 'chases-show', 'Chase scenes and pursuit content', 'show'),
('Police Chase', 'police-chase-movie', 'Police pursuit and chase content', 'movie'),
('Police Chase', 'police-chase-show', 'Police pursuit and chase content', 'show'),
('Fails', 'fails-movie', 'Funny fails and blooper content', 'movie'),
('Fails', 'fails-show', 'Funny fails and blooper content', 'show');

-- Add new tags
INSERT INTO public.tags (name, slug, content_type) VALUES
('Chases', 'chases', NULL),
('Police Chase', 'police-chase', NULL),
('Fails', 'fails', NULL);