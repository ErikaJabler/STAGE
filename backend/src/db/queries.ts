import type { Event, EventWithCount, Participant, Mailing } from "@stage/shared";

/** Fields accepted when creating an event */
export interface CreateEventInput {
  name: string;
  slug: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  organizer_email: string;
  created_by: string;
  emoji?: string | null;
  end_date?: string | null;
  end_time?: string | null;
  description?: string | null;
  status?: string;
  type?: string;
  max_participants?: number | null;
  overbooking_limit?: number;
  visibility?: string;
  sender_mailbox?: string | null;
  gdpr_consent_text?: string | null;
  image_url?: string | null;
}

/** Fields accepted when updating an event */
export interface UpdateEventInput {
  name?: string;
  slug?: string;
  date?: string;
  time?: string;
  location?: string;
  organizer?: string;
  organizer_email?: string;
  emoji?: string | null;
  end_date?: string | null;
  end_time?: string | null;
  description?: string | null;
  status?: string;
  type?: string;
  max_participants?: number | null;
  overbooking_limit?: number;
  visibility?: string;
  sender_mailbox?: string | null;
  gdpr_consent_text?: string | null;
  image_url?: string | null;
}

/** List all non-deleted events with participant count */
export async function listEvents(db: D1Database): Promise<EventWithCount[]> {
  const result = await db
    .prepare(
      `SELECT e.*, COUNT(p.id) AS participant_count
       FROM events e
       LEFT JOIN participants p ON p.event_id = e.id
       WHERE e.deleted_at IS NULL
       GROUP BY e.id
       ORDER BY e.date ASC`
    )
    .all<EventWithCount>();

  return result.results;
}

/** Get a single event by ID (non-deleted) */
export async function getEventById(
  db: D1Database,
  id: number
): Promise<EventWithCount | null> {
  const result = await db
    .prepare(
      `SELECT e.*, COUNT(p.id) AS participant_count
       FROM events e
       LEFT JOIN participants p ON p.event_id = e.id
       WHERE e.id = ? AND e.deleted_at IS NULL
       GROUP BY e.id`
    )
    .bind(id)
    .first<EventWithCount>();

  return result ?? null;
}

/** Create a new event */
export async function createEvent(
  db: D1Database,
  input: CreateEventInput
): Promise<Event> {
  const now = new Date().toISOString();

  const result = await db
    .prepare(
      `INSERT INTO events (
        name, emoji, slug, date, time, end_date, end_time,
        location, description, organizer, organizer_email,
        status, type, max_participants, overbooking_limit,
        visibility, sender_mailbox, gdpr_consent_text, image_url,
        created_by, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?
      )`
    )
    .bind(
      input.name,
      input.emoji ?? null,
      input.slug,
      input.date,
      input.time,
      input.end_date ?? null,
      input.end_time ?? null,
      input.location,
      input.description ?? null,
      input.organizer,
      input.organizer_email,
      input.status ?? "planning",
      input.type ?? "other",
      input.max_participants ?? null,
      input.overbooking_limit ?? 0,
      input.visibility ?? "private",
      input.sender_mailbox ?? null,
      input.gdpr_consent_text ?? null,
      input.image_url ?? null,
      input.created_by,
      now,
      now
    )
    .run();

  const id = result.meta.last_row_id;
  const event = await db
    .prepare("SELECT * FROM events WHERE id = ?")
    .bind(id)
    .first<Event>();

  return event!;
}

/** Update an existing event (partial update) */
export async function updateEvent(
  db: D1Database,
  id: number,
  input: UpdateEventInput
): Promise<Event | null> {
  // Build SET clause dynamically from provided fields
  const fields: string[] = [];
  const values: unknown[] = [];

  const updatable: (keyof UpdateEventInput)[] = [
    "name",
    "slug",
    "date",
    "time",
    "location",
    "organizer",
    "organizer_email",
    "emoji",
    "end_date",
    "end_time",
    "description",
    "status",
    "type",
    "max_participants",
    "overbooking_limit",
    "visibility",
    "sender_mailbox",
    "gdpr_consent_text",
    "image_url",
  ];

  for (const key of updatable) {
    if (key in input) {
      fields.push(`${key} = ?`);
      values.push(input[key] ?? null);
    }
  }

  if (fields.length === 0) {
    return getEventById(db, id);
  }

  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  await db
    .prepare(
      `UPDATE events SET ${fields.join(", ")} WHERE id = ? AND deleted_at IS NULL`
    )
    .bind(...values)
    .run();

  return getEventById(db, id);
}

/** Soft-delete an event */
export async function softDeleteEvent(
  db: D1Database,
  id: number
): Promise<boolean> {
  const result = await db
    .prepare(
      "UPDATE events SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL"
    )
    .bind(new Date().toISOString(), new Date().toISOString(), id)
    .run();

  return result.meta.changes > 0;
}

/* ==========================================================================
   Waitlist helpers
   ========================================================================== */

/** Count participants with status "attending" for an event */
export async function getAttendingCount(
  db: D1Database,
  eventId: number
): Promise<number> {
  const result = await db
    .prepare(
      "SELECT COUNT(*) as cnt FROM participants WHERE event_id = ? AND status = 'attending'"
    )
    .bind(eventId)
    .first<{ cnt: number }>();

  return result?.cnt ?? 0;
}

/** Get next waitlisted participant (lowest queue_position) */
export async function getNextWaitlisted(
  db: D1Database,
  eventId: number
): Promise<Participant | null> {
  const result = await db
    .prepare(
      "SELECT * FROM participants WHERE event_id = ? AND status = 'waitlisted' ORDER BY queue_position ASC LIMIT 1"
    )
    .bind(eventId)
    .first<Participant>();

  return result ?? null;
}

/** Get max queue_position for an event */
export async function getMaxQueuePosition(
  db: D1Database,
  eventId: number
): Promise<number> {
  const result = await db
    .prepare(
      "SELECT MAX(queue_position) as max_pos FROM participants WHERE event_id = ?"
    )
    .bind(eventId)
    .first<{ max_pos: number | null }>();

  return result?.max_pos ?? 0;
}

/** Promote next waitlisted participant to attending */
export async function promoteFromWaitlist(
  db: D1Database,
  eventId: number
): Promise<Participant | null> {
  const next = await getNextWaitlisted(db, eventId);
  if (!next) return null;

  const now = new Date().toISOString();
  await db
    .prepare(
      "UPDATE participants SET status = 'attending', queue_position = NULL, updated_at = ? WHERE id = ?"
    )
    .bind(now, next.id)
    .run();

  return getParticipantById(db, next.id);
}

/** Check if event is at capacity (attending >= max_participants + overbooking_limit) */
export async function shouldWaitlist(
  db: D1Database,
  eventId: number
): Promise<boolean> {
  const event = await db
    .prepare("SELECT max_participants, overbooking_limit FROM events WHERE id = ? AND deleted_at IS NULL")
    .bind(eventId)
    .first<{ max_participants: number | null; overbooking_limit: number }>();

  if (!event || event.max_participants === null) return false;

  const attendingCount = await getAttendingCount(db, eventId);
  return attendingCount >= event.max_participants + (event.overbooking_limit ?? 0);
}

/* ==========================================================================
   Participant queries
   ========================================================================== */

/** Fields accepted when creating a participant */
export interface CreateParticipantInput {
  name: string;
  email: string;
  company?: string | null;
  category?: string;
  status?: string;
  response_deadline?: string | null;
}

/** Fields accepted when updating a participant */
export interface UpdateParticipantInput {
  name?: string;
  email?: string;
  company?: string | null;
  category?: string;
  status?: string;
  queue_position?: number | null;
  response_deadline?: string | null;
}

/** List all participants for an event */
export async function listParticipants(
  db: D1Database,
  eventId: number
): Promise<Participant[]> {
  const result = await db
    .prepare(
      "SELECT * FROM participants WHERE event_id = ? ORDER BY created_at ASC"
    )
    .bind(eventId)
    .all<Participant>();

  return result.results;
}

/** Get a single participant by ID */
export async function getParticipantById(
  db: D1Database,
  id: number
): Promise<Participant | null> {
  const result = await db
    .prepare("SELECT * FROM participants WHERE id = ?")
    .bind(id)
    .first<Participant>();

  return result ?? null;
}

/** Create a new participant */
export async function createParticipant(
  db: D1Database,
  eventId: number,
  input: CreateParticipantInput
): Promise<Participant> {
  const now = new Date().toISOString();
  const cancellationToken = crypto.randomUUID();

  const result = await db
    .prepare(
      `INSERT INTO participants (
        event_id, name, email, company, category, status,
        response_deadline, cancellation_token, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      eventId,
      input.name,
      input.email,
      input.company ?? null,
      input.category ?? "other",
      input.status ?? "invited",
      input.response_deadline ?? null,
      cancellationToken,
      now,
      now
    )
    .run();

  const id = result.meta.last_row_id;
  const participant = await db
    .prepare("SELECT * FROM participants WHERE id = ?")
    .bind(id)
    .first<Participant>();

  return participant!;
}

/** Bulk create participants (for CSV import) */
export async function bulkCreateParticipants(
  db: D1Database,
  eventId: number,
  inputs: CreateParticipantInput[]
): Promise<number> {
  const now = new Date().toISOString();
  let created = 0;

  // D1 doesn't support batch inserts with variable bindings well,
  // so we insert one-by-one within a reasonable limit
  for (const input of inputs) {
    const cancellationToken = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO participants (
          event_id, name, email, company, category, status,
          response_deadline, cancellation_token, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        eventId,
        input.name,
        input.email,
        input.company ?? null,
        input.category ?? "other",
        input.status ?? "invited",
        input.response_deadline ?? null,
        cancellationToken,
        now,
        now
      )
      .run();
    created++;
  }

  return created;
}

/** Update an existing participant (partial update) */
export async function updateParticipant(
  db: D1Database,
  id: number,
  input: UpdateParticipantInput
): Promise<Participant | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  const updatable: (keyof UpdateParticipantInput)[] = [
    "name",
    "email",
    "company",
    "category",
    "status",
    "queue_position",
    "response_deadline",
  ];

  for (const key of updatable) {
    if (key in input) {
      fields.push(`${key} = ?`);
      values.push(input[key] ?? null);
    }
  }

  if (fields.length === 0) {
    return getParticipantById(db, id);
  }

  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  await db
    .prepare(
      `UPDATE participants SET ${fields.join(", ")} WHERE id = ?`
    )
    .bind(...values)
    .run();

  return getParticipantById(db, id);
}

/** Delete a participant (hard delete) */
export async function deleteParticipant(
  db: D1Database,
  id: number
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM participants WHERE id = ?")
    .bind(id)
    .run();

  return result.meta.changes > 0;
}

/* ==========================================================================
   Mailing queries
   ========================================================================== */

/** Fields accepted when creating a mailing */
export interface CreateMailingInput {
  subject: string;
  body: string;
  recipient_filter?: string;
}

/** List all mailings for an event */
export async function listMailings(
  db: D1Database,
  eventId: number
): Promise<Mailing[]> {
  const result = await db
    .prepare(
      "SELECT * FROM mailings WHERE event_id = ? ORDER BY created_at DESC"
    )
    .bind(eventId)
    .all<Mailing>();

  return result.results;
}

/** Get a single mailing by ID */
export async function getMailingById(
  db: D1Database,
  id: number
): Promise<Mailing | null> {
  const result = await db
    .prepare("SELECT * FROM mailings WHERE id = ?")
    .bind(id)
    .first<Mailing>();

  return result ?? null;
}

/** Create a new mailing */
export async function createMailing(
  db: D1Database,
  eventId: number,
  input: CreateMailingInput
): Promise<Mailing> {
  const now = new Date().toISOString();

  const result = await db
    .prepare(
      `INSERT INTO mailings (event_id, subject, body, recipient_filter, status, created_at)
       VALUES (?, ?, ?, ?, 'draft', ?)`
    )
    .bind(
      eventId,
      input.subject,
      input.body,
      input.recipient_filter ?? "all",
      now
    )
    .run();

  const id = result.meta.last_row_id;
  const mailing = await db
    .prepare("SELECT * FROM mailings WHERE id = ?")
    .bind(id)
    .first<Mailing>();

  return mailing!;
}

/** Mark a mailing as sent */
export async function markMailingSent(
  db: D1Database,
  id: number
): Promise<Mailing | null> {
  const now = new Date().toISOString();

  await db
    .prepare("UPDATE mailings SET status = 'sent', sent_at = ? WHERE id = ?")
    .bind(now, id)
    .run();

  return getMailingById(db, id);
}

/* ==========================================================================
   RSVP queries (token-based participant lookup)
   ========================================================================== */

/** Get participant + event info by cancellation token */
export async function getParticipantByToken(
  db: D1Database,
  token: string
): Promise<{ participant: Participant; event: Event } | null> {
  const participant = await db
    .prepare("SELECT * FROM participants WHERE cancellation_token = ?")
    .bind(token)
    .first<Participant>();

  if (!participant) return null;

  const event = await db
    .prepare("SELECT * FROM events WHERE id = ? AND deleted_at IS NULL")
    .bind(participant.event_id)
    .first<Event>();

  if (!event) return null;

  return { participant, event };
}

/** Update participant status via RSVP token */
export async function updateParticipantStatus(
  db: D1Database,
  token: string,
  status: string
): Promise<Participant | null> {
  const now = new Date().toISOString();

  const result = await db
    .prepare(
      "UPDATE participants SET status = ?, updated_at = ? WHERE cancellation_token = ?"
    )
    .bind(status, now, token)
    .run();

  if (result.meta.changes === 0) return null;

  const participant = await db
    .prepare("SELECT * FROM participants WHERE cancellation_token = ?")
    .bind(token)
    .first<Participant>();

  return participant ?? null;
}

/** Get recipients for a mailing based on filter */
export async function getMailingRecipients(
  db: D1Database,
  eventId: number,
  filter: string
): Promise<Participant[]> {
  let sql = "SELECT * FROM participants WHERE event_id = ?";
  const binds: unknown[] = [eventId];

  if (filter !== "all") {
    // filter can be a status (invited, attending, etc.) or category (internal, partner, etc.)
    const statuses = ["invited", "attending", "declined", "waitlisted", "cancelled"];
    const categories = ["internal", "public_sector", "private_sector", "partner", "other"];

    if (statuses.includes(filter)) {
      sql += " AND status = ?";
      binds.push(filter);
    } else if (categories.includes(filter)) {
      sql += " AND category = ?";
      binds.push(filter);
    }
  }

  sql += " ORDER BY name ASC";

  const result = await db
    .prepare(sql)
    .bind(...binds)
    .all<Participant>();

  return result.results;
}
