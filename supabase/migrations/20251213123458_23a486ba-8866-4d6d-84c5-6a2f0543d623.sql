-- Locations positions
INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Location Manager', 'Oversees all location operations, securing permits and managing relationships.', '• Secure filming locations
• Negotiate location deals
• Obtain permits
• Manage location team
• Handle location logistics', true, 'open'
FROM departments d WHERE d.slug = 'locations' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Location Manager' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Location Scout', 'Finds and photographs potential filming locations based on script requirements.', '• Scout potential locations
• Photograph and document sites
• Present options to production
• Research location availability
• Assess location feasibility', true, 'open'
FROM departments d WHERE d.slug = 'locations' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Location Scout' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Location Assistant', 'Supports the location department with logistics, permits, and on-set management.', '• Assist with location setup
• Manage parking and traffic
• Handle location paperwork
• Support location manager
• Coordinate with local authorities', true, 'open'
FROM departments d WHERE d.slug = 'locations' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Location Assistant' AND is_template = true AND department_id = d.id);

-- Transportation positions
INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Transportation Captain', 'Leads the transportation department, managing all vehicles and drivers.', '• Manage all production vehicles
• Schedule and coordinate drivers
• Ensure vehicle maintenance
• Handle transportation logistics
• Oversee cast/crew transportation', true, 'open'
FROM departments d WHERE d.slug = 'transportation' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Transportation Captain' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Driver', 'Transports cast, crew, and equipment safely and on schedule.', '• Drive assigned vehicles
• Transport cast and crew
• Maintain vehicle cleanliness
• Follow production schedule
• Ensure safety on the road', true, 'open'
FROM departments d WHERE d.slug = 'transportation' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Driver' AND is_template = true AND department_id = d.id);

-- Catering positions
INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Catering Lead', 'Manages catering operations, planning and executing meals for cast and crew.', '• Plan daily menus
• Manage catering team
• Coordinate meal times
• Handle dietary requirements
• Maintain food safety', true, 'open'
FROM departments d WHERE d.slug = 'catering-craft' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Catering Lead' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Craft Services', 'Provides snacks, beverages, and refreshments throughout the shoot day.', '• Maintain craft table
• Stock beverages and snacks
• Set up coffee service
• Keep craft area clean
• Restock throughout day', true, 'open'
FROM departments d WHERE d.slug = 'catering-craft' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Craft Services' AND is_template = true AND department_id = d.id);

-- Post-Production positions
INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Post Producer', 'Manages the post-production process, coordinating between editorial, sound, and visual effects.', '• Manage post schedule
• Coordinate post vendors
• Oversee deliverables
• Handle post budget
• Liaise with production', true, 'open'
FROM departments d WHERE d.slug = 'post-production' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Post Producer' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Editor', 'Assembles footage into the final film, working closely with the director on pacing and story.', '• Assemble rough and fine cuts
• Collaborate with director
• Manage project files
• Create multiple versions
• Prepare for color and sound', true, 'open'
FROM departments d WHERE d.slug = 'post-production' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Editor' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Assistant Editor', 'Supports the editor by organizing footage, syncing audio, and managing project files.', '• Organize and label footage
• Sync audio and video
• Manage project organization
• Prepare outputs for review
• Support editor as needed', true, 'open'
FROM departments d WHERE d.slug = 'post-production' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Assistant Editor' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Colorist', 'Creates the final color grade, establishing the visual tone and ensuring consistency.', '• Create color grade
• Match shots for continuity
• Develop visual look
• Handle HDR/SDR versions
• Deliver final color output', true, 'open'
FROM departments d WHERE d.slug = 'post-production' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Colorist' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Sound Designer', 'Creates and edits all sound elements, from dialogue to effects to ambient audio.', '• Design sound effects
• Edit dialogue
• Create ambient soundscapes
• Mix audio elements
• Deliver final audio', true, 'open'
FROM departments d WHERE d.slug = 'post-production' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Sound Designer' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Composer', 'Creates original music and score to enhance the emotional impact of the film.', '• Compose original score
• Create themes and cues
• Collaborate with director
• Record and mix music
• Deliver final music tracks', true, 'open'
FROM departments d WHERE d.slug = 'post-production' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Composer' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'VFX Artist', 'Creates visual effects and composites elements to achieve shots impossible to capture practically.', '• Create visual effects
• Composite green screen
• Handle digital cleanup
• Animate elements
• Deliver final VFX shots', true, 'open'
FROM departments d WHERE d.slug = 'post-production' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'VFX Artist' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Motion Graphics Artist', 'Creates animated graphics, titles, and visual elements for the production.', '• Design motion graphics
• Create title sequences
• Animate infographics
• Design lower thirds
• Deliver final graphics', true, 'open'
FROM departments d WHERE d.slug = 'post-production' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Motion Graphics Artist' AND is_template = true AND department_id = d.id);

-- Marketing positions
INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Social Media Manager', 'Manages the production''s social media presence, creating content and engaging with audiences.', '• Manage social accounts
• Create engaging content
• Build audience engagement
• Track analytics
• Coordinate with publicity', true, 'open'
FROM departments d WHERE d.slug = 'marketing-social' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Social Media Manager' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Photographer', 'Captures still photography for publicity, behind-the-scenes, and documentation purposes.', '• Capture production stills
• Shoot BTS photos
• Photograph cast portraits
• Deliver images for publicity
• Archive all photos', true, 'open'
FROM departments d WHERE d.slug = 'marketing-social' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Photographer' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'BTS Videographer', 'Creates behind-the-scenes video content for marketing and documentary purposes.', '• Capture BTS footage
• Create promo videos
• Document production process
• Edit BTS content
• Deliver marketing assets', true, 'open'
FROM departments d WHERE d.slug = 'marketing-social' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'BTS Videographer' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Publicist', 'Manages media relations, press coverage, and public image of the production.', '• Coordinate press coverage
• Write press releases
• Arrange interviews
• Manage media relationships
• Handle crisis communications', true, 'open'
FROM departments d WHERE d.slug = 'marketing-social' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Publicist' AND is_template = true AND department_id = d.id);