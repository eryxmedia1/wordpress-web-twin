-- Assistant Directing positions
INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, '1st Assistant Director (1st AD)', 
  'The primary liaison between the director and the rest of the crew, managing the shooting schedule and on-set operations.',
  '• Create and manage the shooting schedule
• Run the set and call "action" and "cut"
• Coordinate background and stunts
• Ensure production stays on schedule
• Communicate director''s vision to crew',
  true, 'open'
FROM departments d WHERE d.slug = 'assistant-directing' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = '1st Assistant Director (1st AD)' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, '2nd Assistant Director (2nd AD)', 
  'Supports the 1st AD by managing call sheets, coordinating cast, and overseeing background actors.',
  '• Prepare and distribute call sheets
• Coordinate cast arrivals and departures
• Manage background/extras
• Handle production reports
• Support 1st AD on set',
  true, 'open'
FROM departments d WHERE d.slug = 'assistant-directing' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = '2nd Assistant Director (2nd AD)' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, '2nd 2nd Assistant Director', 
  'Assists the 2nd AD with logistics, often stationed at base camp or managing specific groups of background.',
  '• Manage base camp operations
• Coordinate talent movements
• Assist with background wrangling
• Support 2nd AD duties
• Handle special logistics',
  true, 'open'
FROM departments d WHERE d.slug = 'assistant-directing' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = '2nd 2nd Assistant Director' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'AD Production Assistant', 
  'Provides direct support to the AD department, handling walkies, paperwork, and on-set coordination.',
  '• Distribute walkies and equipment
• Handle AD department paperwork
• Assist with set lockups
• Support background management
• Run errands for AD team',
  true, 'open'
FROM departments d WHERE d.slug = 'assistant-directing' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'AD Production Assistant' AND is_template = true AND department_id = d.id);

-- Casting positions
INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Casting Director', 
  'Leads the casting process, working with the director to find the perfect actors for each role.',
  '• Develop casting strategy with director
• Conduct auditions and callbacks
• Negotiate talent deals
• Manage casting team
• Present final casting recommendations',
  true, 'open'
FROM departments d WHERE d.slug = 'casting' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Casting Director' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Casting Associate', 
  'Supports the Casting Director by coordinating auditions, managing submissions, and communicating with agents.',
  '• Coordinate audition schedules
• Review actor submissions
• Communicate with agents/managers
• Manage casting database
• Assist with callbacks',
  true, 'open'
FROM departments d WHERE d.slug = 'casting' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Casting Associate' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Casting Assistant', 
  'Provides administrative support to the casting team, handling paperwork, scheduling, and office management.',
  '• Schedule auditions
• Handle casting paperwork
• Manage actor check-ins
• Support audition sessions
• Maintain casting records',
  true, 'open'
FROM departments d WHERE d.slug = 'casting' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Casting Assistant' AND is_template = true AND department_id = d.id);

-- Directing positions
INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Director', 
  'The creative leader of the production, responsible for translating the script into a visual story.',
  '• Guide the creative vision of the project
• Direct actor performances
• Collaborate with DP on visual style
• Work with editor on final cut
• Make all key creative decisions',
  true, 'open'
FROM departments d WHERE d.slug = 'directing' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Director' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Assistant to Director', 
  'Provides personal and professional support to the director, handling scheduling, communications, and logistics.',
  '• Manage director''s schedule
• Handle director''s communications
• Coordinate with other departments
• Prepare materials for director
• Anticipate director''s needs',
  true, 'open'
FROM departments d WHERE d.slug = 'directing' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Assistant to Director' AND is_template = true AND department_id = d.id);

-- Camera positions
INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Director of Photography (DP)', 
  'The head of the camera and lighting departments, responsible for the visual look of the film.',
  '• Design the visual style with director
• Select camera and lighting equipment
• Supervise camera and grip/electric crews
• Operate camera when needed
• Ensure visual consistency',
  true, 'open'
FROM departments d WHERE d.slug = 'camera' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Director of Photography (DP)' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Camera Operator', 
  'Operates the camera under the direction of the DP, executing shots and camera movements.',
  '• Operate camera during takes
• Execute camera movements
• Collaborate with DP on framing
• Maintain camera equipment
• Work with focus puller',
  true, 'open'
FROM departments d WHERE d.slug = 'camera' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Camera Operator' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, '1st Assistant Camera (Focus Puller)', 
  'Responsible for maintaining sharp focus during shots, often under challenging conditions.',
  '• Pull focus during takes
• Measure and mark distances
• Build and maintain camera
• Manage lens inventory
• Work with DIT on camera settings',
  true, 'open'
FROM departments d WHERE d.slug = 'camera' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = '1st Assistant Camera (Focus Puller)' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, '2nd Assistant Camera (Clapper/Loader)', 
  'Manages camera equipment, slates takes, and handles media management.',
  '• Slate all takes
• Manage camera reports
• Handle media/film loading
• Organize camera equipment
• Support 1st AC duties',
  true, 'open'
FROM departments d WHERE d.slug = 'camera' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = '2nd Assistant Camera (Clapper/Loader)' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Digital Imaging Technician (DIT)', 
  'Manages digital camera workflow, color correction on set, and data management.',
  '• Manage digital camera settings
• Apply on-set color correction
• Back up and verify footage
• Create dailies
• Work with post on workflow',
  true, 'open'
FROM departments d WHERE d.slug = 'camera' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Digital Imaging Technician (DIT)' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Steadicam Operator', 
  'Operates specialized stabilizing equipment for smooth moving shots.',
  '• Operate Steadicam rig
• Collaborate on shot design
• Maintain Steadicam equipment
• Execute complex moving shots
• Ensure smooth footage',
  true, 'open'
FROM departments d WHERE d.slug = 'camera' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Steadicam Operator' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Drone Operator', 
  'Operates drone cameras for aerial shots, ensuring safety and legal compliance.',
  '• Operate drone for aerial shots
• Ensure FAA compliance
• Maintain drone equipment
• Coordinate with 1st AD on safety
• Execute aerial cinematography',
  true, 'open'
FROM departments d WHERE d.slug = 'camera' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Drone Operator' AND is_template = true AND department_id = d.id);