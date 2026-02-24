import type { Event, EventWithCount, CreateEventInput, UpdateEventInput } from '@stage/shared';

export type { CreateEventInput, UpdateEventInput };

/** List all non-deleted events with participant count */
export async function listEvents(db: D1Database): Promise<EventWithCount[]> {
  const result = await db
    .prepare(
      `SELECT e.*, COUNT(p.id) AS participant_count
       FROM events e
       LEFT JOIN participants p ON p.event_id = e.id
       WHERE e.deleted_at IS NULL
       GROUP BY e.id
       ORDER BY e.date ASC`,
    )
    .all<EventWithCount>();

  return result.results;
}

/** List events where the user has a permission */
export async function listEventsForUser(db: D1Database, userId: number): Promise<EventWithCount[]> {
  const result = await db
    .prepare(
      `SELECT e.*, COUNT(p.id) AS participant_count
       FROM events e
       INNER JOIN event_permissions ep ON ep.event_id = e.id AND ep.user_id = ?
       LEFT JOIN participants p ON p.event_id = e.id
       WHERE e.deleted_at IS NULL
       GROUP BY e.id
       ORDER BY e.date ASC`,
    )
    .bind(userId)
    .all<EventWithCount>();

  return result.results;
}

/** Get a single event by ID (non-deleted) */
export async function getEventById(db: D1Database, id: number): Promise<EventWithCount | null> {
  const result = await db
    .prepare(
      `SELECT e.*, COUNT(p.id) AS participant_count
       FROM events e
       LEFT JOIN participants p ON p.event_id = e.id
       WHERE e.id = ? AND e.deleted_at IS NULL
       GROUP BY e.id`,
    )
    .bind(id)
    .first<EventWithCount>();

  return result ?? null;
}

/** Create a new event */
export async function createEvent(db: D1Database, input: CreateEventInput): Promise<Event> {
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
      )`,
    )
    .bind(
      input.name,
      input.emoji ?? null,
      input.slug ?? '',
      input.date,
      input.time,
      input.end_date ?? null,
      input.end_time ?? null,
      input.location,
      input.description ?? null,
      input.organizer,
      input.organizer_email,
      input.status ?? 'planning',
      input.type ?? 'other',
      input.max_participants ?? null,
      input.overbooking_limit ?? 0,
      input.visibility ?? 'private',
      input.sender_mailbox ?? null,
      input.gdpr_consent_text ?? null,
      input.image_url ?? null,
      input.created_by,
      now,
      now,
    )
    .run();

  const id = result.meta.last_row_id;
  const event = await db.prepare('SELECT * FROM events WHERE id = ?').bind(id).first<Event>();

  return event!;
}

/** Update an existing event (partial update) */
export async function updateEvent(
  db: D1Database,
  id: number,
  input: UpdateEventInput,
): Promise<Event | null> {
  // Build SET clause dynamically from provided fields
  const fields: string[] = [];
  const values: unknown[] = [];

  const updatable: (keyof UpdateEventInput)[] = [
    'name',
    'slug',
    'date',
    'time',
    'location',
    'organizer',
    'organizer_email',
    'emoji',
    'end_date',
    'end_time',
    'description',
    'status',
    'type',
    'max_participants',
    'overbooking_limit',
    'visibility',
    'sender_mailbox',
    'gdpr_consent_text',
    'image_url',
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

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  await db
    .prepare(`UPDATE events SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`)
    .bind(...values)
    .run();

  return getEventById(db, id);
}

/** Soft-delete an event */
export async function softDeleteEvent(db: D1Database, id: number): Promise<boolean> {
  const result = await db
    .prepare('UPDATE events SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL')
    .bind(new Date().toISOString(), new Date().toISOString(), id)
    .run();

  return result.meta.changes > 0;
}
