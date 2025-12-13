-- Sound positions
INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Production Sound Mixer', 'Leads the sound department, recording clean dialogue and ambient audio during production.', '• Record production dialogue
• Mix audio on set
• Select and manage sound equipment
• Supervise boom operator
• Deliver sound reports to post', true, 'open'
FROM departments d WHERE d.slug = 'sound' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Production Sound Mixer' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Boom Operator', 'Operates the boom microphone to capture the best possible dialogue audio.', '• Operate boom microphone
• Position lavalieres
• Monitor audio quality
• Work with mixer on placement
• Handle sound equipment', true, 'open'
FROM departments d WHERE d.slug = 'sound' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Boom Operator' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Utility Sound Technician', 'Provides support to the sound department, managing cables, equipment, and additional microphones.', '• Manage sound cables and equipment
• Set up playback systems
• Handle additional microphones
• Support boom operator
• Maintain sound gear', true, 'open'
FROM departments d WHERE d.slug = 'sound' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Utility Sound Technician' AND is_template = true AND department_id = d.id);

-- Lighting / Grip positions
INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Gaffer', 'Head of the electrical department, designing and implementing the lighting plan with the DP.', '• Design lighting with DP
• Manage electric crew
• Select lighting equipment
• Ensure electrical safety
• Execute lighting setups', true, 'open'
FROM departments d WHERE d.slug = 'lighting-grip' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Gaffer' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Best Boy Electric', 'Second in command of the electric department, managing crew and equipment logistics.', '• Manage electric crew
• Coordinate equipment rentals
• Track electrical inventory
• Support gaffer
• Handle department logistics', true, 'open'
FROM departments d WHERE d.slug = 'lighting-grip' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Best Boy Electric' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Electrician', 'Sets up and operates lighting equipment under the direction of the gaffer.', '• Set up lighting equipment
• Run power cables
• Operate lights during takes
• Maintain lighting gear
• Support gaffer and best boy', true, 'open'
FROM departments d WHERE d.slug = 'lighting-grip' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Electrician' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Key Grip', 'Head of the grip department, responsible for camera support and light shaping.', '• Manage grip crew
• Design camera support rigs
• Handle light modifiers
• Ensure rigging safety
• Coordinate with gaffer on setups', true, 'open'
FROM departments d WHERE d.slug = 'lighting-grip' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Key Grip' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Best Boy Grip', 'Second in command of the grip department, managing crew and equipment.', '• Manage grip crew
• Track grip equipment
• Coordinate equipment rentals
• Support key grip
• Handle department logistics', true, 'open'
FROM departments d WHERE d.slug = 'lighting-grip' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Best Boy Grip' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Grip', 'Sets up camera support, flags, and diffusion under the direction of the key grip.', '• Build camera rigs and dollies
• Set up flags and diffusion
• Operate grip equipment
• Maintain grip gear
• Support key grip on setups', true, 'open'
FROM departments d WHERE d.slug = 'lighting-grip' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Grip' AND is_template = true AND department_id = d.id);

-- Art Department positions
INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Production Designer', 'The head of the art department, responsible for the overall visual design of the production.', '• Design overall visual look
• Create concept art and mood boards
• Supervise art department
• Collaborate with director on vision
• Manage art budget', true, 'open'
FROM departments d WHERE d.slug = 'art-department' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Production Designer' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Art Director', 'Executes the production designer''s vision, overseeing set construction and dressing.', '• Oversee set construction
• Manage art department staff
• Coordinate with construction
• Create technical drawings
• Execute design vision', true, 'open'
FROM departments d WHERE d.slug = 'art-department' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Art Director' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Set Decorator', 'Responsible for furnishing and decorating sets to create the desired look and atmosphere.', '• Source and place set furnishings
• Coordinate with production designer
• Manage set dressing budget
• Dress sets before filming
• Strike sets after filming', true, 'open'
FROM departments d WHERE d.slug = 'art-department' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Set Decorator' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Prop Master', 'Manages all hand props used by actors, ensuring continuity and availability.', '• Source and create props
• Manage prop inventory
• Ensure prop continuity
• Work with actors on props
• Maintain and repair props', true, 'open'
FROM departments d WHERE d.slug = 'art-department' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Prop Master' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Set Dresser', 'Places and arranges set dressing under the direction of the set decorator.', '• Place and arrange set dressing
• Maintain set during filming
• Handle set changes between scenes
• Support set decorator
• Organize dressing storage', true, 'open'
FROM departments d WHERE d.slug = 'art-department' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Set Dresser' AND is_template = true AND department_id = d.id);

-- Wardrobe positions
INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Costume Designer', 'Designs and creates all costumes, working with director to define character looks.', '• Design all costumes
• Create costume sketches
• Supervise costume team
• Collaborate with director
• Manage costume budget', true, 'open'
FROM departments d WHERE d.slug = 'wardrobe-costume' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Costume Designer' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Wardrobe Stylist', 'Sources, fits, and maintains costumes throughout production.', '• Source and purchase costumes
• Fit actors in costumes
• Maintain costume continuity
• Organize wardrobe inventory
• Prepare daily wardrobe', true, 'open'
FROM departments d WHERE d.slug = 'wardrobe-costume' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Wardrobe Stylist' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Set Costumer', 'Works on set to dress actors and maintain costumes during filming.', '• Dress actors on set
• Maintain costume continuity
• Handle quick changes
• Make on-set repairs
• Track costume changes', true, 'open'
FROM departments d WHERE d.slug = 'wardrobe-costume' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Set Costumer' AND is_template = true AND department_id = d.id);

-- Hair & Makeup positions
INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Key Makeup Artist', 'Leads the makeup department, designing and applying makeup for all characters.', '• Design character makeup looks
• Apply principal makeup
• Supervise makeup team
• Maintain continuity
• Coordinate with hair and costume', true, 'open'
FROM departments d WHERE d.slug = 'hair-makeup' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Key Makeup Artist' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Key Hair Stylist', 'Leads the hair department, designing and styling hair for all characters.', '• Design character hairstyles
• Style principal hair
• Supervise hair team
• Maintain continuity
• Handle wigs and hairpieces', true, 'open'
FROM departments d WHERE d.slug = 'hair-makeup' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Key Hair Stylist' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Hair & Makeup Assistant', 'Supports the key artists with application, touch-ups, and equipment management.', '• Assist with applications
• Perform touch-ups on set
• Organize supplies
• Support key artists
• Handle background actors', true, 'open'
FROM departments d WHERE d.slug = 'hair-makeup' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Hair & Makeup Assistant' AND is_template = true AND department_id = d.id);