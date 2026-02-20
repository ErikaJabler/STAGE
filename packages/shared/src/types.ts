import type { EventStatus, EventType, ParticipantStatus, ParticipantCategory, Visibility, MailingStatus } from "./constants";

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
  email_status: string | null;
  gdpr_consent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventWithCount extends Event {
  participant_count: number;
}

export interface Mailing {
  id: number;
  event_id: number;
  subject: string;
  body: string;
  recipient_filter: string;
  status: MailingStatus;
  sent_at: string | null;
  created_at: string;
}
