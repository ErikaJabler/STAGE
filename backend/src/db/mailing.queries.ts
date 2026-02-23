import type { Event, Participant, Mailing, CreateMailingInput } from "@stage/shared";

export type { CreateMailingInput };

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
      `INSERT INTO mailings (event_id, subject, body, html_body, editor_data, recipient_filter, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'draft', ?)`
    )
    .bind(
      eventId,
      input.subject,
      input.body,
      input.html_body ?? null,
      input.editor_data ?? null,
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

/** Get NEW recipients for a mailing (not already in email_queue) */
export async function getNewMailingRecipients(
  db: D1Database,
  eventId: number,
  mailingId: number,
  filter: string
): Promise<Participant[]> {
  let sql =
    "SELECT * FROM participants WHERE event_id = ? AND email NOT IN (SELECT to_email FROM email_queue WHERE mailing_id = ?)";
  const binds: unknown[] = [eventId, mailingId];

  if (filter !== "all") {
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
