-- Add default_description column to departments for industry-standard descriptions
ALTER TABLE departments ADD COLUMN IF NOT EXISTS default_description TEXT;

-- Add is_template column to crew_positions to identify default/template positions
ALTER TABLE crew_positions ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

-- Add template_position_id to link show-specific positions to their templates
ALTER TABLE crew_positions ADD COLUMN IF NOT EXISTS template_position_id UUID REFERENCES crew_positions(id);

-- Update existing departments with their industry-standard descriptions
UPDATE departments SET default_description = 'Oversees the overall logistics, budgeting, scheduling, and execution of the production, ensuring all departments operate efficiently and on schedule.' WHERE slug = 'production';
UPDATE departments SET default_description = 'Manages the shooting schedule, coordinates on-set operations, and serves as the communication bridge between the director and crew.' WHERE slug = 'assistant-directing';
UPDATE departments SET default_description = 'Responsible for identifying, auditioning, and selecting talent appropriate for each role.' WHERE slug = 'casting';
UPDATE departments SET default_description = 'Oversees the creative vision of the project, guiding performances, camera direction, and storytelling.' WHERE slug = 'directing';
UPDATE departments SET default_description = 'Responsible for capturing the visual elements of the production according to the director''s vision.' WHERE slug = 'camera';
UPDATE departments SET default_description = 'Captures clean, high-quality audio during production.' WHERE slug = 'sound';
UPDATE departments SET default_description = 'Designs and executes lighting and rigging setups to support the visual aesthetic.' WHERE slug = 'lighting-grip';
UPDATE departments SET default_description = 'Designs and maintains the visual environment of the production.' WHERE slug = 'art-department';
UPDATE departments SET default_description = 'Designs, sources, and manages wardrobe aligned with character and story.' WHERE slug = 'wardrobe-costume';
UPDATE departments SET default_description = 'Ensures talent appearance continuity and character accuracy.' WHERE slug = 'hair-makeup';
UPDATE departments SET default_description = 'Secures and manages filming locations and permits.' WHERE slug = 'locations';
UPDATE departments SET default_description = 'Manages transportation of cast, crew, and equipment.' WHERE slug = 'transportation';
UPDATE departments SET default_description = 'Provides meals and on-set refreshments.' WHERE slug = 'catering-craft';
UPDATE departments SET default_description = 'Finalizes the project through editing, sound, and visual effects.' WHERE slug = 'post-production';
UPDATE departments SET default_description = 'Promotes the project through media, content, and publicity.' WHERE slug = 'marketing-social';

-- Insert missing departments if they don't exist
INSERT INTO departments (name, slug, description, default_description, sort_order, is_hiring)
SELECT 'Production', 'production', 'Manages production operations and logistics', 'Oversees the overall logistics, budgeting, scheduling, and execution of the production, ensuring all departments operate efficiently and on schedule.', 1, false
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE slug = 'production');

INSERT INTO departments (name, slug, description, default_description, sort_order, is_hiring)
SELECT 'Assistant Directing', 'assistant-directing', 'Coordinates on-set operations and scheduling', 'Manages the shooting schedule, coordinates on-set operations, and serves as the communication bridge between the director and crew.', 2, false
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE slug = 'assistant-directing');

INSERT INTO departments (name, slug, description, default_description, sort_order, is_hiring)
SELECT 'Casting', 'casting', 'Talent selection and auditions', 'Responsible for identifying, auditioning, and selecting talent appropriate for each role.', 3, false
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE slug = 'casting');

INSERT INTO departments (name, slug, description, default_description, sort_order, is_hiring)
SELECT 'Directing / Creative', 'directing', 'Creative vision and direction', 'Oversees the creative vision of the project, guiding performances, camera direction, and storytelling.', 4, false
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE slug = 'directing');

INSERT INTO departments (name, slug, description, default_description, sort_order, is_hiring)
SELECT 'Camera', 'camera', 'Visual capture and cinematography', 'Responsible for capturing the visual elements of the production according to the director''s vision.', 5, false
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE slug = 'camera');

INSERT INTO departments (name, slug, description, default_description, sort_order, is_hiring)
SELECT 'Sound', 'sound', 'Audio recording and production', 'Captures clean, high-quality audio during production.', 6, false
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE slug = 'sound');

INSERT INTO departments (name, slug, description, default_description, sort_order, is_hiring)
SELECT 'Lighting / Grip', 'lighting-grip', 'Lighting design and grip work', 'Designs and executes lighting and rigging setups to support the visual aesthetic.', 7, false
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE slug = 'lighting-grip');

INSERT INTO departments (name, slug, description, default_description, sort_order, is_hiring)
SELECT 'Art Department', 'art-department', 'Set design and production design', 'Designs and maintains the visual environment of the production.', 8, false
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE slug = 'art-department');

INSERT INTO departments (name, slug, description, default_description, sort_order, is_hiring)
SELECT 'Wardrobe / Costume', 'wardrobe-costume', 'Costume design and management', 'Designs, sources, and manages wardrobe aligned with character and story.', 9, false
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE slug = 'wardrobe-costume');

INSERT INTO departments (name, slug, description, default_description, sort_order, is_hiring)
SELECT 'Hair & Makeup', 'hair-makeup', 'Hair styling and makeup artistry', 'Ensures talent appearance continuity and character accuracy.', 10, false
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE slug = 'hair-makeup');

INSERT INTO departments (name, slug, description, default_description, sort_order, is_hiring)
SELECT 'Locations', 'locations', 'Location scouting and management', 'Secures and manages filming locations and permits.', 11, false
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE slug = 'locations');

INSERT INTO departments (name, slug, description, default_description, sort_order, is_hiring)
SELECT 'Transportation', 'transportation', 'Cast and crew transportation', 'Manages transportation of cast, crew, and equipment.', 12, false
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE slug = 'transportation');

INSERT INTO departments (name, slug, description, default_description, sort_order, is_hiring)
SELECT 'Catering / Craft', 'catering-craft', 'Catering and craft services', 'Provides meals and on-set refreshments.', 13, false
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE slug = 'catering-craft');

INSERT INTO departments (name, slug, description, default_description, sort_order, is_hiring)
SELECT 'Post-Production', 'post-production', 'Editing, color, sound, and VFX', 'Finalizes the project through editing, sound, and visual effects.', 14, false
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE slug = 'post-production');

INSERT INTO departments (name, slug, description, default_description, sort_order, is_hiring)
SELECT 'Marketing / Social', 'marketing-social', 'Marketing, social media, and publicity', 'Promotes the project through media, content, and publicity.', 15, false
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE slug = 'marketing-social');