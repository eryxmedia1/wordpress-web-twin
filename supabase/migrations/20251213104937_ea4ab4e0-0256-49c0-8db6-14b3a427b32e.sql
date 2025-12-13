-- DEPARTMENTS TABLE
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_hiring BOOLEAN DEFAULT false,
  contact_email TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Admins can manage departments" ON public.departments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- DEPARTMENT STAFF TABLE
CREATE TABLE public.department_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  permissions JSONB DEFAULT '{"can_assign_tasks": false, "can_add_events": false, "can_message": true}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.department_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view staff" ON public.department_staff FOR SELECT USING (true);
CREATE POLICY "Admins can manage staff" ON public.department_staff FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- CREW POSITIONS TABLE
CREATE TABLE public.crew_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  show_id UUID REFERENCES public.casting_shows(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  responsibilities TEXT,
  required_experience TEXT,
  gear_required TEXT,
  rate_type TEXT CHECK (rate_type IN ('hourly', 'daily', 'weekly', 'flat', 'negotiable')),
  pay_amount TEXT,
  schedule_expectations TEXT,
  location TEXT,
  is_remote BOOLEAN DEFAULT false,
  terms_conditions TEXT,
  deadline DATE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'hold', 'closed', 'filled')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.crew_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view open positions" ON public.crew_positions FOR SELECT USING (true);
CREATE POLICY "Admins can manage positions" ON public.crew_positions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- CREW APPLICATIONS TABLE
CREATE TABLE public.crew_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position_id UUID NOT NULL REFERENCES public.crew_positions(id) ON DELETE CASCADE,
  talent_id UUID NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  show_id UUID REFERENCES public.casting_shows(id),
  cover_letter TEXT,
  profile_snapshot JSONB,
  answers JSONB,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'shortlisted', 'interview', 'hold', 'hired', 'not_selected')),
  admin_notes TEXT,
  admin_rating INTEGER CHECK (admin_rating >= 1 AND admin_rating <= 5),
  terms_acceptance_timestamp TIMESTAMP WITH TIME ZONE,
  pay_acceptance_timestamp TIMESTAMP WITH TIME ZONE,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.crew_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications" ON public.crew_applications FOR SELECT USING (EXISTS (SELECT 1 FROM talents WHERE talents.id = crew_applications.talent_id AND talents.user_id = auth.uid()));
CREATE POLICY "Users can create applications" ON public.crew_applications FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM talents WHERE talents.id = crew_applications.talent_id AND talents.user_id = auth.uid()));
CREATE POLICY "Admins can manage applications" ON public.crew_applications FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- USER TASKS TABLE
CREATE TABLE public.user_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  talent_id UUID REFERENCES public.talents(id) ON DELETE CASCADE,
  show_id UUID REFERENCES public.casting_shows(id),
  department_id UUID REFERENCES public.departments(id),
  assigned_by UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completion_note TEXT,
  completion_file_url TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON public.user_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.user_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Staff and admins can manage tasks" ON public.user_tasks FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR EXISTS (SELECT 1 FROM department_staff WHERE department_staff.user_id = auth.uid()));

-- USER CALENDAR EVENTS TABLE
CREATE TABLE public.user_calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  talent_id UUID REFERENCES public.talents(id),
  show_id UUID REFERENCES public.casting_shows(id),
  department_id UUID REFERENCES public.departments(id),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN ('audition', 'interview', 'call_time', 'shoot_day', 'fitting', 'wardrobe', 'table_read', 'rehearsal', 'paperwork', 'travel', 'meeting', 'onboarding', 'other')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  location TEXT,
  is_all_day BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events" ON public.user_calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff and admins can manage events" ON public.user_calendar_events FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR EXISTS (SELECT 1 FROM department_staff WHERE department_staff.user_id = auth.uid()));

-- DEPARTMENT MESSAGES TABLE (Real-time chat)
CREATE TABLE public.department_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('talent', 'crew', 'staff', 'admin')),
  department_id UUID NOT NULL REFERENCES public.departments(id),
  show_id UUID REFERENCES public.casting_shows(id),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.department_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations" ON public.department_messages FOR SELECT USING (auth.uid() = sender_id OR EXISTS (SELECT 1 FROM department_staff WHERE department_staff.department_id = department_messages.department_id AND department_staff.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can send messages" ON public.department_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Admins can manage messages" ON public.department_messages FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- CONVERSATIONS TABLE (for tracking message threads)
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  talent_id UUID REFERENCES public.talents(id),
  department_id UUID NOT NULL REFERENCES public.departments(id),
  show_id UUID REFERENCES public.casting_shows(id),
  subject TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM department_staff WHERE department_staff.department_id = conversations.department_id AND department_staff.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage conversations" ON public.conversations FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- USER DOCUMENTS TABLE
CREATE TABLE public.user_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  talent_id UUID REFERENCES public.talents(id),
  show_id UUID REFERENCES public.casting_shows(id),
  document_type TEXT CHECK (document_type IN ('script', 'sides', 'call_sheet', 'release', 'contract', 'other')),
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents" ON public.user_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff and admins can manage documents" ON public.user_documents FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR EXISTS (SELECT 1 FROM department_staff WHERE department_staff.user_id = auth.uid()));

-- USER BOOKINGS TABLE (shows they're hired for)
CREATE TABLE public.user_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  talent_id UUID REFERENCES public.talents(id),
  show_id UUID NOT NULL REFERENCES public.casting_shows(id),
  role_id UUID REFERENCES public.casting_roles(id),
  position_id UUID REFERENCES public.crew_positions(id),
  booking_type TEXT NOT NULL CHECK (booking_type IN ('talent', 'crew')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  hired_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings" ON public.user_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage bookings" ON public.user_bookings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- EMAIL ROUTING SETTINGS TABLE
CREATE TABLE public.email_routing_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_type TEXT NOT NULL CHECK (setting_type IN ('global_casting', 'global_crew', 'show_casting', 'show_crew', 'department')),
  show_id UUID REFERENCES public.casting_shows(id),
  department_id UUID REFERENCES public.departments(id),
  emails TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.email_routing_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email settings" ON public.email_routing_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- EMAIL NOTIFICATION TRIGGERS TABLE
CREATE TABLE public.email_notification_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_type TEXT NOT NULL UNIQUE CHECK (trigger_type IN ('new_application', 'status_changed', 'audition_requested', 'hired', 'task_assigned', 'task_completed', 'event_added', 'event_updated', 'message_received')),
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.email_notification_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage triggers" ON public.email_notification_triggers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view triggers" ON public.email_notification_triggers FOR SELECT USING (true);

-- Insert default email triggers
INSERT INTO public.email_notification_triggers (trigger_type, is_enabled) VALUES
('new_application', true),
('status_changed', true),
('audition_requested', true),
('hired', true),
('task_assigned', true),
('task_completed', true),
('event_added', true),
('event_updated', false),
('message_received', true);

-- USER NOTIFICATIONS TABLE
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.user_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.user_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.user_notifications FOR INSERT WITH CHECK (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.department_messages;
ALTER TABLE public.department_messages REPLICA IDENTITY FULL;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
ALTER TABLE public.user_notifications REPLICA IDENTITY FULL;

-- Insert default departments (industry standard)
INSERT INTO public.departments (name, slug, description, sort_order) VALUES
('Production', 'production', 'Executive producers, line producers, production managers, coordinators, PAs, script supervisors', 1),
('Assistant Directing', 'assistant-directing', '1st AD, 2nd AD, 2nd 2nd AD, AD PAs', 2),
('Casting', 'casting', 'Casting directors, associates, and assistants', 3),
('Directing / Creative', 'directing', 'Director and assistant to director', 4),
('Camera', 'camera', 'DP, camera operators, ACs, DIT, steadicam, drone operators', 5),
('Sound', 'sound', 'Production sound mixer, boom operators, utility sound tech', 6),
('Lighting / Grip', 'lighting-grip', 'Gaffer, best boy electric, key grip, grips, electrics', 7),
('Art Department', 'art', 'Production designer, art director, set decorator, prop master, set dresser', 8),
('Wardrobe / Costume', 'wardrobe', 'Costume designer, wardrobe stylist, set costumer', 9),
('Hair & Makeup', 'hair-makeup', 'Key makeup artist, key hair stylist, HMU assistants', 10),
('Locations', 'locations', 'Location manager, scouts, and assistants', 11),
('Transportation', 'transportation', 'Transportation captain, drivers', 12),
('Catering / Craft', 'catering', 'Catering and craft services', 13),
('Post-Production', 'post', 'Editors, colorists, sound designers, VFX, composers', 14),
('Marketing / Social', 'marketing', 'Social media, photographers, BTS videographers, publicists', 15);

-- Add triggers for updated_at
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crew_positions_updated_at BEFORE UPDATE ON public.crew_positions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();