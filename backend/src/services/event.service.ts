import type { Event, EventWithCount } from '@stage/shared';
import {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  softDeleteEvent,
  type CreateEventInput,
  type UpdateEventInput,
} from '../db/queries';

/** Generate URL-slug from event name (handles Swedish chars) */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Generate ICS calendar file for an event */
export function generateICS(event: Event): string {
  const uid = `event-${event.id}@stage.mikwik.se`;
  const dtstamp = formatICSDate(new Date());

  const startDate = event.date;
  const startTime = event.time;
  const dtstart = `${startDate.replace(/-/g, '')}T${startTime.replace(':', '')}00`;

  let dtend: string;
  if (event.end_date && event.end_time) {
    dtend = `${event.end_date.replace(/-/g, '')}T${event.end_time.replace(':', '')}00`;
  } else if (event.end_time) {
    dtend = `${startDate.replace(/-/g, '')}T${event.end_time.replace(':', '')}00`;
  } else {
    const [h, m] = startTime.split(':').map(Number);
    const endH = String(h + 2).padStart(2, '0');
    dtend = `${startDate.replace(/-/g, '')}T${endH}${String(m).padStart(2, '0')}00`;
  }

  const summary = escapeICSText(event.name);
  const location = escapeICSText(event.location);
  const description = event.description ? escapeICSText(event.description) : '';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Stage//Consid Eventplattform//SV',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Stockholm',
    'BEGIN:STANDARD',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'END:STANDARD',
    'BEGIN:DAYLIGHT',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'END:DAYLIGHT',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;TZID=Europe/Stockholm:${dtstart}`,
    `DTEND;TZID=Europe/Stockholm:${dtend}`,
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    ...(description ? [`DESCRIPTION:${description}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function formatICSDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/* ---- Service functions (delegate to queries) ---- */

export const EventService = {
  list(db: D1Database): Promise<EventWithCount[]> {
    return listEvents(db);
  },

  getById(db: D1Database, id: number): Promise<EventWithCount | null> {
    return getEventById(db, id);
  },

  async create(db: D1Database, input: CreateEventInput): Promise<Event> {
    if (!input.slug) {
      input.slug = generateSlug(input.name);
    }
    if (!input.created_by) {
      input.created_by = input.organizer_email;
    }
    return createEvent(db, input);
  },

  update(db: D1Database, id: number, input: UpdateEventInput): Promise<Event | null> {
    return updateEvent(db, id, input);
  },

  softDelete(db: D1Database, id: number): Promise<boolean> {
    return softDeleteEvent(db, id);
  },

  /** Clone an event — copies all fields except date/time/slug */
  async clone(db: D1Database, sourceId: number, createdBy: string): Promise<Event | null> {
    const source = await getEventById(db, sourceId);
    if (!source) return null;

    const input: CreateEventInput = {
      name: `${source.name} (kopia)`,
      date: source.date,
      time: source.time,
      location: source.location,
      organizer: source.organizer,
      organizer_email: source.organizer_email,
      slug: generateSlug(`${source.name} kopia`),
      emoji: source.emoji,
      end_date: source.end_date,
      end_time: source.end_time,
      description: source.description,
      status: 'planning',
      type: source.type as
        | 'conference'
        | 'workshop'
        | 'seminar'
        | 'networking'
        | 'internal'
        | 'other',
      max_participants: source.max_participants,
      overbooking_limit: source.overbooking_limit ?? 0,
      visibility: source.visibility as 'public' | 'private' | undefined,
      sender_mailbox: source.sender_mailbox,
      gdpr_consent_text: source.gdpr_consent_text,
      image_url: source.image_url,
      created_by: createdBy,
    };

    return createEvent(db, input);
  },
};
