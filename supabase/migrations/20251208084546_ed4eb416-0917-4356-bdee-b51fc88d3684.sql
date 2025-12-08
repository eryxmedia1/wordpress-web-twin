-- Add Mother Nature tag
INSERT INTO tags (name, slug, content_type) 
VALUES ('Mother Nature', 'mother-nature', null)
ON CONFLICT (slug) DO NOTHING;