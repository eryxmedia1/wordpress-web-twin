-- Add work history for the talent profiles
INSERT INTO public.talent_work_history (talent_id, project_title, role, year, project_type, director, description)
SELECT t.id, 'The Last Summer', 'Lead - Sarah', '2024', 'TV Series', 'David Chen', 'Recurring role across 2 seasons on Netflix'
FROM talents t WHERE t.name = 'Maya Johnson'
UNION ALL
SELECT t.id, 'City Lights', 'Supporting - Detective Morris', '2023', 'Feature Film', 'James Cameron', 'Action drama for Warner Bros'
FROM talents t WHERE t.name = 'Maya Johnson'
UNION ALL
SELECT t.id, 'Echoes of Tomorrow', 'Lead - Dr. Elena Wright', '2022', 'Feature Film', 'Ari Aster', 'Sci-fi thriller, Sundance selection'
FROM talents t WHERE t.name = 'Maya Johnson'
UNION ALL
SELECT t.id, 'Breaking Through', 'Lead - David Kim', '2024', 'Limited Series', 'Ryan Murphy', '6-episode HBO Max limited series'
FROM talents t WHERE t.name = 'Marcus Chen'
UNION ALL
SELECT t.id, 'The Negotiator', 'Lead - Agent Chen', '2023', 'Feature Film', 'Antoine Fuqua', 'Action thriller for Paramount'
FROM talents t WHERE t.name = 'Marcus Chen'
UNION ALL
SELECT t.id, 'Stage Fright', 'Lead - Thomas Blake', '2021', 'Theater', 'Julie Taymor', 'Tony-nominated performance on Broadway'
FROM talents t WHERE t.name = 'Marcus Chen'
UNION ALL
SELECT t.id, 'Love in Manhattan', 'Lead - Isabella', '2024', 'TV Movie', 'Nancy Meyers', 'Romantic comedy for Hallmark'
FROM talents t WHERE t.name = 'Sofia Rodriguez'
UNION ALL
SELECT t.id, 'Dance Revolution', 'Supporting - Maria', '2023', 'TV Series', 'Kenny Ortega', 'Dance competition series for Disney+'
FROM talents t WHERE t.name = 'Sofia Rodriguez'
UNION ALL
SELECT t.id, 'Summer Nights', 'Lead - Ana', '2022', 'Feature Film', 'Greta Gerwig', 'Coming-of-age comedy for Sony Pictures'
FROM talents t WHERE t.name = 'Sofia Rodriguez';