import type { Participant } from '@stage/shared';
import { getParticipantById } from './participant.queries';

/** Count participants with status "attending" for an event */
export async function getAttendingCount(db: D1Database, eventId: number): Promise<number> {
  const result = await db
    .prepare("SELECT COUNT(*) as cnt FROM participants WHERE event_id = ? AND status = 'attending'")
    .bind(eventId)
    .first<{ cnt: number }>();

  return result?.cnt ?? 0;
}

/** Get next waitlisted participant (lowest queue_position) */
export async function getNextWaitlisted(
  db: D1Database,
  eventId: number,
): Promise<Participant | null> {
  const result = await db
    .prepare(
      "SELECT * FROM participants WHERE event_id = ? AND status = 'waitlisted' ORDER BY queue_position ASC LIMIT 1",
    )
    .bind(eventId)
    .first<Participant>();

  return result ?? null;
}

/** Get max queue_position for an event */
export async function getMaxQueuePosition(db: D1Database, eventId: number): Promise<number> {
  const result = await db
    .prepare('SELECT MAX(queue_position) as max_pos FROM participants WHERE event_id = ?')
    .bind(eventId)
    .first<{ max_pos: number | null }>();

  return result?.max_pos ?? 0;
}

/** Promote next waitlisted participant to attending */
export async function promoteFromWaitlist(
  db: D1Database,
  eventId: number,
): Promise<Participant | null> {
  const next = await getNextWaitlisted(db, eventId);
  if (!next) return null;

  const now = new Date().toISOString();
  await db
    .prepare(
      "UPDATE participants SET status = 'attending', queue_position = NULL, updated_at = ? WHERE id = ?",
    )
    .bind(now, next.id)
    .run();

  return getParticipantById(db, next.id);
}

/** Check if event is at capacity (attending >= max_participants + overbooking_limit) */
export async function shouldWaitlist(db: D1Database, eventId: number): Promise<boolean> {
  const event = await db
    .prepare(
      'SELECT max_participants, overbooking_limit FROM events WHERE id = ? AND deleted_at IS NULL',
    )
    .bind(eventId)
    .first<{ max_participants: number | null; overbooking_limit: number }>();

  if (!event || event.max_participants === null) return false;

  const attendingCount = await getAttendingCount(db, eventId);
  return attendingCount >= event.max_participants + (event.overbooking_limit ?? 0);
}
