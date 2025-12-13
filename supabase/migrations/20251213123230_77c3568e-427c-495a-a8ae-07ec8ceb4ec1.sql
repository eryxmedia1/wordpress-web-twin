-- Create template positions for Production department
INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Executive Producer', 
  'Oversees the entire production from development through distribution, securing financing and making key creative decisions.',
  '• Secure project financing and manage overall budget
• Hire key creative personnel
• Approve major creative and business decisions
• Oversee distribution and marketing strategy
• Represent the project to stakeholders and investors',
  true, 'open'
FROM departments d WHERE d.slug = 'production' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Executive Producer' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Producer', 
  'Manages the day-to-day operations of the production, coordinating between departments and ensuring the project stays on schedule and budget.',
  '• Develop project from concept to completion
• Manage production budget and schedule
• Coordinate between all departments
• Hire crew and negotiate contracts
• Handle logistics and problem-solving',
  true, 'open'
FROM departments d WHERE d.slug = 'production' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Producer' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Co-Producer', 
  'Assists the producer with specific aspects of the production, often focusing on particular areas like post-production or location management.',
  '• Support producer in daily operations
• Manage specific production areas
• Coordinate with vendors and contractors
• Assist with budget management
• Handle special projects as assigned',
  true, 'open'
FROM departments d WHERE d.slug = 'production' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Co-Producer' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Line Producer', 
  'Manages the physical production budget and logistics, ensuring efficient use of resources throughout the shoot.',
  '• Create and manage production budget
• Oversee daily production operations
• Negotiate vendor contracts
• Manage production accounting
• Coordinate with UPM on logistics',
  true, 'open'
FROM departments d WHERE d.slug = 'production' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Line Producer' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Unit Production Manager (UPM)', 
  'Oversees the administrative and logistical aspects of production, managing crew, equipment, and facilities.',
  '• Manage production office operations
• Coordinate crew hiring and payroll
• Oversee equipment rentals
• Handle permits and legal requirements
• Manage daily production logistics',
  true, 'open'
FROM departments d WHERE d.slug = 'production' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Unit Production Manager (UPM)' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Production Supervisor', 
  'Supervises daily production activities, ensuring all departments have what they need to operate efficiently.',
  '• Supervise daily production operations
• Coordinate between departments
• Ensure equipment availability
• Manage production supplies
• Report to UPM on daily progress',
  true, 'open'
FROM departments d WHERE d.slug = 'production' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Production Supervisor' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Production Manager', 
  'Manages production office staff and coordinates logistics between production and post-production.',
  '• Manage production office team
• Coordinate production logistics
• Oversee vendor relationships
• Track production expenses
• Ensure smooth operations',
  true, 'open'
FROM departments d WHERE d.slug = 'production' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Production Manager' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Production Coordinator', 
  'Handles administrative tasks and communication for the production office, keeping all departments informed and organized.',
  '• Coordinate communication between departments
• Manage call sheets and schedules
• Handle travel and accommodations
• Maintain production documents
• Support production office operations',
  true, 'open'
FROM departments d WHERE d.slug = 'production' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Production Coordinator' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Production Secretary', 
  'Provides administrative support to the production team, managing paperwork, filing, and office communications.',
  '• Handle production paperwork
• Answer phones and manage communications
• File and organize documents
• Support production coordinator
• Manage office supplies',
  true, 'open'
FROM departments d WHERE d.slug = 'production' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Production Secretary' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Script Supervisor', 
  'Ensures continuity throughout the production, tracking dialogue, props, wardrobe, and blocking across scenes.',
  '• Track continuity across all scenes
• Note script changes and dialogue
• Log camera setups and takes
• Liaise with editor on coverage
• Maintain detailed production notes',
  true, 'open'
FROM departments d WHERE d.slug = 'production' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Script Supervisor' AND is_template = true AND department_id = d.id);

INSERT INTO crew_positions (department_id, title, description, responsibilities, is_template, status)
SELECT d.id, 'Production Assistant (PA)', 
  'Provides general support across all departments, handling tasks as needed to keep production running smoothly.',
  '• Support all departments as needed
• Handle errands and deliveries
• Set up and break down equipment
• Assist with crowd control
• Perform various production tasks',
  true, 'open'
FROM departments d WHERE d.slug = 'production' AND NOT EXISTS (SELECT 1 FROM crew_positions WHERE title = 'Production Assistant (PA)' AND is_template = true AND department_id = d.id);