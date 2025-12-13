// Casting Portal Types

export interface Department {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_hiring: boolean;
  contact_email: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DepartmentStaff {
  id: string;
  department_id: string;
  user_id: string | null;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  permissions: any;
  is_active: boolean;
  created_at: string;
  department?: Department;
}

export interface CrewPosition {
  id: string;
  department_id: string;
  show_id: string | null;
  title: string;
  description: string | null;
  responsibilities: string | null;
  required_experience: string | null;
  gear_required: string | null;
  rate_type: string | null;
  pay_amount: string | null;
  schedule_expectations: string | null;
  location: string | null;
  is_remote: boolean;
  terms_conditions: string | null;
  deadline: string | null;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  departments?: { name: string; slug: string };
  casting_shows?: { title: string; slug: string };
}

export interface CrewApplication {
  id: string;
  position_id: string;
  talent_id: string;
  show_id: string | null;
  cover_letter: string | null;
  profile_snapshot: any;
  answers: any;
  status: 'new' | 'reviewed' | 'shortlisted' | 'interview' | 'hold' | 'hired' | 'not_selected';
  admin_notes: string | null;
  admin_rating: number | null;
  terms_acceptance_timestamp: string | null;
  pay_acceptance_timestamp: string | null;
  applied_at: string;
  crew_positions?: CrewPosition;
  talents?: {
    id: string;
    name: string;
    email: string | null;
    primary_photo_url: string | null;
    city: string | null;
    state: string | null;
  };
}

export interface UserTask {
  id: string;
  user_id: string;
  talent_id: string | null;
  show_id: string | null;
  department_id: string | null;
  assigned_by: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'not_started' | 'in_progress' | 'completed';
  completion_note: string | null;
  completion_file_url: string | null;
  completed_at: string | null;
  created_at: string;
  casting_shows?: { title: string };
  departments?: Department;
}

export interface UserCalendarEvent {
  id: string;
  user_id: string;
  talent_id: string | null;
  show_id: string | null;
  department_id: string | null;
  title: string;
  description: string | null;
  event_type: 'audition' | 'interview' | 'call_time' | 'shoot_day' | 'fitting' | 'wardrobe' | 'table_read' | 'rehearsal' | 'paperwork' | 'travel' | 'meeting' | 'onboarding' | 'other';
  start_time: string;
  end_time: string | null;
  location: string | null;
  is_all_day: boolean;
  created_at: string;
  casting_shows?: { title: string };
  departments?: Department;
}

export interface Conversation {
  id: string;
  user_id: string;
  talent_id: string | null;
  department_id: string;
  show_id: string | null;
  subject: string | null;
  last_message_at: string;
  created_at: string;
  departments?: Department;
  casting_shows?: { title: string };
}

export interface DepartmentMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'talent' | 'crew' | 'staff' | 'admin';
  department_id: string;
  show_id: string | null;
  content: string;
  attachments: any[];
  is_read: boolean;
  created_at: string;
}

export interface UserDocument {
  id: string;
  user_id: string;
  talent_id: string | null;
  show_id: string | null;
  document_type: 'script' | 'sides' | 'call_sheet' | 'release' | 'contract' | 'other';
  title: string;
  file_url: string;
  uploaded_by: string | null;
  created_at: string;
  casting_shows?: { title: string };
}

export interface UserBooking {
  id: string;
  user_id: string;
  talent_id: string | null;
  show_id: string;
  role_id: string | null;
  position_id: string | null;
  booking_type: 'talent' | 'crew';
  status: 'active' | 'completed' | 'cancelled';
  hired_at: string;
  notes: string | null;
  created_at: string;
  casting_shows?: { title: string; poster_url: string | null };
  casting_roles?: { title: string };
  crew_positions?: { title: string };
}

export interface UserNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export type ApplicationStatus = 'new' | 'reviewed' | 'shortlisted' | 'interview' | 'hold' | 'hired' | 'not_selected';

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: 'New',
  reviewed: 'Reviewed',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  hold: 'Hold',
  hired: 'Hired',
  not_selected: 'Not Selected'
};

export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  new: 'bg-blue-500',
  reviewed: 'bg-yellow-500',
  shortlisted: 'bg-purple-500',
  interview: 'bg-orange-500',
  hold: 'bg-gray-500',
  hired: 'bg-green-500',
  not_selected: 'bg-red-500'
};
