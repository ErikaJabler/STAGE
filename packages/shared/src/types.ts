import type {
  EventStatus,
  EventType,
  ParticipantStatus,
  ParticipantCategory,
  Visibility,
  MailingStatus,
  Role,
  ActivityType,
  EmailQueueStatus,
} from './constants';

export interface Event {
  id: number;
  name: string;
  emoji: string | null;
  slug: string;
  date: string;
  time: string;
  end_date: string | null;
  end_time: string | null;
  location: string;
  description: string | null;
  organizer: string;
  organizer_email: string;
  status: EventStatus;
  type: EventType;
  max_participants: number | null;
  overbooking_limit: number;
  visibility: Visibility;
  sender_mailbox: string | null;
  gdpr_consent_text: string | null;
  image_url: string | null;
  website_template: string | null;
  website_data: string | null;
  website_published: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Participant {
  id: number;
  event_id: number;
  name: string;
  email: string;
  company: string | null;
  category: ParticipantCategory;
  status: ParticipantStatus;
  queue_position: number | null;
  response_deadline: string | null;
  cancellation_token: string;
  dietary_notes: string | null;
  plus_one_name: string | null;
  plus_one_email: string | null;
  email_status: string | null;
  gdpr_consent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventWithCount extends Event {
  participant_count: number;
}

export interface WebsiteData {
  hero_title?: string;
  hero_subtitle?: string;
  program_items?: { time: string; title: string; description?: string }[];
  venue_description?: string;
  venue_address?: string;
  custom_fields?: { label: string; required: boolean }[];
  /** Full HTML from GrapeJS page editor */
  page_html?: string;
  /** GrapeJS project JSON for re-editing */
  page_editor_data?: string;
}

export interface Mailing {
  id: number;
  event_id: number;
  subject: string;
  body: string;
  html_body: string | null;
  editor_data: string | null;
  recipient_filter: string;
  status: MailingStatus;
  sent_at: string | null;
  created_at: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  token: string;
  is_admin: number;
  created_at: string;
  updated_at: string;
}

export interface AdminDashboardData {
  total_events: number;
  active_events: number;
  historical_events: number;
  total_participants: number;
  participants_by_category: Record<string, number>;
  upcoming_events: Array<EventWithCount & { days_until: number }>;
  recent_mailings: Array<{
    id: number;
    event_id: number;
    event_name: string;
    subject: string;
    status: string;
    sent_at: string | null;
    created_at: string;
  }>;
}

export interface EventConflict {
  id: number;
  name: string;
  date: string;
  time: string;
  location: string;
}

export interface EventPermission {
  id: number;
  user_id: number;
  event_id: number;
  role: Role;
  created_at: string;
}

export interface EventPermissionWithUser extends EventPermission {
  user_email: string;
  user_name: string;
}

export interface Activity {
  id: number;
  event_id: number;
  type: ActivityType;
  description: string;
  metadata: string | null;
  created_by: string | null;
  created_at: string;
}

export interface EmailQueueItem {
  id: number;
  mailing_id: number;
  event_id: number;
  to_email: string;
  to_name: string;
  subject: string;
  html: string;
  plain_text: string;
  status: EmailQueueStatus;
  error: string | null;
  created_at: string;
  sent_at: string | null;
}

export interface ParticipantEmailHistory {
  id: number;
  mailing_id: number;
  subject: string;
  status: EmailQueueStatus;
  error: string | null;
  created_at: string;
  sent_at: string | null;
}
