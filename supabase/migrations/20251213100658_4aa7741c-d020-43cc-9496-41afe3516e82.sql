-- Add photos for the talent profiles
INSERT INTO public.talent_photos (talent_id, photo_url, caption, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop', 'Headshot - Natural Light', 1
FROM talents t WHERE t.name = 'Maya Johnson'
UNION ALL
SELECT t.id, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop', 'Full Body - Casual', 2
FROM talents t WHERE t.name = 'Maya Johnson'
UNION ALL
SELECT t.id, 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop', 'Dramatic Headshot', 3
FROM talents t WHERE t.name = 'Maya Johnson'
UNION ALL
SELECT t.id, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop', 'Headshot - Studio', 1
FROM talents t WHERE t.name = 'Marcus Chen'
UNION ALL
SELECT t.id, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop', 'Character Shot', 2
FROM talents t WHERE t.name = 'Marcus Chen'
UNION ALL
SELECT t.id, 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&h=800&fit=crop', 'Full Body - Suit', 3
FROM talents t WHERE t.name = 'Marcus Chen'
UNION ALL
SELECT t.id, 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop', 'Headshot - Warm', 1
FROM talents t WHERE t.name = 'Sofia Rodriguez'
UNION ALL
SELECT t.id, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop', 'Portrait - Outdoor', 2
FROM talents t WHERE t.name = 'Sofia Rodriguez'
UNION ALL
SELECT t.id, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop', 'Dance Shot', 3
FROM talents t WHERE t.name = 'Sofia Rodriguez'
UNION ALL
SELECT t.id, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop', 'Professional Headshot', 1
FROM talents t WHERE t.name = 'James Mitchell'
UNION ALL
SELECT t.id, 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=800&fit=crop', 'On Set', 2
FROM talents t WHERE t.name = 'James Mitchell'
UNION ALL
SELECT t.id, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&h=800&fit=crop', 'Professional Portrait', 1
FROM talents t WHERE t.name = 'Amanda Park'
UNION ALL
SELECT t.id, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=800&fit=crop', 'Working Portrait', 2
FROM talents t WHERE t.name = 'Amanda Park'
UNION ALL
SELECT t.id, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop', 'Headshot', 1
FROM talents t WHERE t.name = 'Derek Washington'
UNION ALL
SELECT t.id, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=800&fit=crop', 'Studio Portrait', 2
FROM talents t WHERE t.name = 'Derek Washington';