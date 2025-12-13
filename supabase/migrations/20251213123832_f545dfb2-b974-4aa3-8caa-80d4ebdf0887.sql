-- Update all crew_positions templates with detailed descriptions

-- PRODUCTION DEPARTMENT
UPDATE crew_positions SET description = 'The Executive Producer oversees the project at the highest level, providing financial backing, strategic direction, and overall authority. They ensure the production aligns with business goals, branding, and distribution plans, and may be involved in high-level creative and staffing decisions.' WHERE title = 'Executive Producer' AND is_template = true;

UPDATE crew_positions SET description = 'The Producer manages the project from development through delivery, coordinating creative, financial, and logistical elements. They supervise department heads, manage budgets, oversee schedules, and ensure the production is completed on time and within scope.' WHERE title = 'Producer' AND is_template = true;

UPDATE crew_positions SET description = 'The Co-Producer supports the Producer by managing specific aspects of production such as logistics, scheduling, or post-production coordination. Responsibilities vary based on the needs of the project.' WHERE title = 'Co-Producer' AND is_template = true;

UPDATE crew_positions SET description = 'The Line Producer is responsible for the physical production of the project. They create and manage the budget, oversee daily operations, supervise crew logistics, and ensure resources are allocated efficiently during filming.' WHERE title = 'Line Producer' AND is_template = true;

UPDATE crew_positions SET description = 'The UPM handles the day-to-day management of production logistics, contracts, payroll, and compliance. They work closely with the Line Producer to keep production running smoothly.' WHERE title = 'Unit Production Manager (UPM)' AND is_template = true;

UPDATE crew_positions SET description = 'The Production Supervisor oversees production operations across multiple units or locations, ensuring consistency, workflow efficiency, and adherence to schedules and budgets.' WHERE title = 'Production Supervisor' AND is_template = true;

UPDATE crew_positions SET description = 'The Production Manager coordinates crew, equipment, locations, and scheduling needs, acting as a central point of communication between departments.' WHERE title = 'Production Manager' AND is_template = true;

UPDATE crew_positions SET description = 'The Production Coordinator manages paperwork, call sheets, schedules, travel arrangements, and communication across departments. This role is essential for organizational flow.' WHERE title = 'Production Coordinator' AND is_template = true;

UPDATE crew_positions SET description = 'The Production Secretary supports administrative operations by managing documents, emails, phone communications, and production records.' WHERE title = 'Production Secretary' AND is_template = true;

UPDATE crew_positions SET description = 'The Script Supervisor ensures continuity throughout filming, tracking dialogue, actions, camera angles, and script changes to maintain consistency in the final edit.' WHERE title = 'Script Supervisor' AND is_template = true;

UPDATE crew_positions SET description = 'Production Assistants provide general support across departments, handling on-set tasks, coordination, errands, and assisting department heads as needed.' WHERE title = 'Production Assistant (PA)' AND is_template = true;

-- ASSISTANT DIRECTING DEPARTMENT
UPDATE crew_positions SET description = 'The 1st AD manages the shooting schedule and on-set operations. They coordinate between the director, crew, and talent to ensure scenes are completed efficiently and safely.' WHERE title = '1st Assistant Director (1st AD)' AND is_template = true;

UPDATE crew_positions SET description = 'The 2nd AD prepares call sheets, manages talent logistics, and assists with scheduling. They act as a communication bridge between cast and production.' WHERE title = '2nd Assistant Director (2nd AD)' AND is_template = true;

UPDATE crew_positions SET description = 'The 2nd 2nd AD handles background actors, coordinates movement on set, and supports the 2nd AD with logistics and communication.' WHERE title = '2nd 2nd Assistant Director' AND is_template = true;

UPDATE crew_positions SET description = 'Supports the Assistant Directors by assisting with crowd control, paperwork, on-set coordination, and communication.' WHERE title = 'AD Production Assistant' AND is_template = true;

-- CASTING DEPARTMENT
UPDATE crew_positions SET description = 'The Casting Director leads the talent selection process, organizing auditions, evaluating performances, and recommending actors who best fit each role.' WHERE title = 'Casting Director' AND is_template = true;

UPDATE crew_positions SET description = 'Assists the Casting Director by coordinating auditions, reviewing submissions, and communicating with agents and talent.' WHERE title = 'Casting Associate' AND is_template = true;

UPDATE crew_positions SET description = 'Provides administrative and logistical support, scheduling auditions, managing databases, and assisting during casting sessions.' WHERE title = 'Casting Assistant' AND is_template = true;

-- DIRECTING / CREATIVE DEPARTMENT
UPDATE crew_positions SET description = 'The Director is responsible for the creative vision of the project, guiding performances, visual storytelling, pacing, and overall tone.' WHERE title = 'Director' AND is_template = true;

UPDATE crew_positions SET description = 'Supports the Director with scheduling, communication, creative notes, and coordination across departments.' WHERE title = 'Assistant to Director' AND is_template = true;

-- CAMERA DEPARTMENT
UPDATE crew_positions SET description = 'The DP designs the visual look of the project, selecting camera setups, lighting styles, and shot composition to support the director''s vision.' WHERE title = 'Director of Photography (DP)' AND is_template = true;

UPDATE crew_positions SET description = 'Operates the camera during filming, executing shots as directed by the DP and Director.' WHERE title = 'Camera Operator' AND is_template = true;

UPDATE crew_positions SET description = 'Maintains focus during shots, prepares camera equipment, and ensures image clarity.' WHERE title = '1st Assistant Camera (Focus Puller)' AND is_template = true;

UPDATE crew_positions SET description = 'Manages slating, camera logs, and assists with lens changes and equipment prep.' WHERE title = '2nd Assistant Camera (Clapper/Loader)' AND is_template = true;

UPDATE crew_positions SET description = 'Manages digital footage on set, ensuring color accuracy, data integrity, and proper backups.' WHERE title = 'Digital Imaging Technician (DIT)' AND is_template = true;

UPDATE crew_positions SET description = 'Operates stabilizing camera systems to capture smooth, dynamic movement shots.' WHERE title = 'Steadicam Operator' AND is_template = true;

UPDATE crew_positions SET description = 'Captures aerial footage while complying with safety and legal regulations.' WHERE title = 'Drone Operator' AND is_template = true;

-- SOUND DEPARTMENT
UPDATE crew_positions SET description = 'Captures all on-set audio, managing microphones, sound levels, and recording equipment.' WHERE title = 'Production Sound Mixer' AND is_template = true;

UPDATE crew_positions SET description = 'Positions microphones to capture dialogue clearly while staying out of frame.' WHERE title = 'Boom Operator' AND is_template = true;

UPDATE crew_positions SET description = 'Supports sound operations by handling equipment setup, cable management, and troubleshooting.' WHERE title = 'Utility Sound Technician' AND is_template = true;

-- LIGHTING / GRIP DEPARTMENT
UPDATE crew_positions SET description = 'Designs and executes lighting plans to support the DP''s visual style.' WHERE title = 'Gaffer' AND is_template = true;

UPDATE crew_positions SET description = 'Manages the electrical crew and equipment logistics under the Gaffer.' WHERE title = 'Best Boy Electric' AND is_template = true;

UPDATE crew_positions SET description = 'Installs and maintains lighting equipment on set.' WHERE title = 'Electrician' AND is_template = true;

UPDATE crew_positions SET description = 'Oversees grip operations, including rigging and camera support systems.' WHERE title = 'Key Grip' AND is_template = true;

UPDATE crew_positions SET description = 'Assists the Key Grip with crew management and equipment coordination.' WHERE title = 'Best Boy Grip' AND is_template = true;

UPDATE crew_positions SET description = 'Handles physical equipment such as rigs, flags, and camera supports.' WHERE title = 'Grip' AND is_template = true;

-- ART DEPARTMENT
UPDATE crew_positions SET description = 'Designs the overall visual environment, including sets, props, and locations.' WHERE title = 'Production Designer' AND is_template = true;

UPDATE crew_positions SET description = 'Implements the Production Designer''s vision by managing the art team.' WHERE title = 'Art Director' AND is_template = true;

UPDATE crew_positions SET description = 'Selects and arranges set furnishings and decorations.' WHERE title = 'Set Decorator' AND is_template = true;

UPDATE crew_positions SET description = 'Sources, manages, and maintains props used on screen.' WHERE title = 'Prop Master' AND is_template = true;

UPDATE crew_positions SET description = 'Arranges and maintains set details to ensure visual consistency.' WHERE title = 'Set Dresser' AND is_template = true;

-- WARDROBE / COSTUME DEPARTMENT
UPDATE crew_positions SET description = 'Designs costumes that reflect character development and story requirements.' WHERE title = 'Costume Designer' AND is_template = true;

UPDATE crew_positions SET description = 'Selects, fits, and maintains costumes during production.' WHERE title = 'Wardrobe Stylist' AND is_template = true;

UPDATE crew_positions SET description = 'Ensures costumes are ready and consistent on set.' WHERE title = 'Set Costumer' AND is_template = true;

-- HAIR & MAKEUP DEPARTMENT
UPDATE crew_positions SET description = 'Designs and applies makeup looks for talent, maintaining continuity.' WHERE title = 'Key Makeup Artist' AND is_template = true;

UPDATE crew_positions SET description = 'Designs and styles hair according to character needs.' WHERE title = 'Key Hair Stylist' AND is_template = true;

UPDATE crew_positions SET description = 'Supports hair and makeup operations on set.' WHERE title = 'Hair & Makeup Assistant' AND is_template = true;

-- LOCATIONS DEPARTMENT
UPDATE crew_positions SET description = 'Secures and manages filming locations, permits, and logistics.' WHERE title = 'Location Manager' AND is_template = true;

UPDATE crew_positions SET description = 'Finds and evaluates potential filming locations.' WHERE title = 'Location Scout' AND is_template = true;

UPDATE crew_positions SET description = 'Supports location logistics and coordination.' WHERE title = 'Location Assistant' AND is_template = true;

-- TRANSPORTATION DEPARTMENT
UPDATE crew_positions SET description = 'Manages vehicles, drivers, and transportation logistics.' WHERE title = 'Transportation Captain' AND is_template = true;

UPDATE crew_positions SET description = 'Transports cast, crew, and equipment safely and on schedule.' WHERE title = 'Driver' AND is_template = true;

-- CATERING / CRAFT DEPARTMENT
UPDATE crew_positions SET description = 'Provides full meals for cast and crew.' WHERE title = 'Catering Lead' AND is_template = true;

UPDATE crew_positions SET description = 'Supplies snacks, drinks, and light refreshments throughout the day.' WHERE title = 'Craft Services' AND is_template = true;

-- POST-PRODUCTION DEPARTMENT
UPDATE crew_positions SET description = 'Oversees post-production workflow, schedules, and budgets.' WHERE title = 'Post Producer' AND is_template = true;

UPDATE crew_positions SET description = 'Assembles footage into the final narrative.' WHERE title = 'Editor' AND is_template = true;

UPDATE crew_positions SET description = 'Supports the Editor with organization and technical tasks.' WHERE title = 'Assistant Editor' AND is_template = true;

UPDATE crew_positions SET description = 'Adjusts color and lighting to achieve visual consistency.' WHERE title = 'Colorist' AND is_template = true;

UPDATE crew_positions SET description = 'Creates and enhances audio elements for the final mix.' WHERE title = 'Sound Designer' AND is_template = true;

UPDATE crew_positions SET description = 'Creates original music for the project.' WHERE title = 'Composer' AND is_template = true;

UPDATE crew_positions SET description = 'Designs and integrates visual effects.' WHERE title = 'VFX Artist' AND is_template = true;

UPDATE crew_positions SET description = 'Creates animated titles, graphics, and visual elements.' WHERE title = 'Motion Graphics Artist' AND is_template = true;

-- MARKETING / SOCIAL DEPARTMENT
UPDATE crew_positions SET description = 'Manages social platforms, content strategy, and audience engagement.' WHERE title = 'Social Media Manager' AND is_template = true;

UPDATE crew_positions SET description = 'Captures promotional and behind-the-scenes stills.' WHERE title = 'Photographer' AND is_template = true;

UPDATE crew_positions SET description = 'Documents behind-the-scenes footage for marketing.' WHERE title = 'BTS Videographer' AND is_template = true;

UPDATE crew_positions SET description = 'Manages press relations, interviews, and media exposure.' WHERE title = 'Publicist' AND is_template = true;