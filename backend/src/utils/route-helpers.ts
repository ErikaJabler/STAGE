import { HTTPException } from 'hono/http-exception';
import { getEventById } from '../db/queries';

/** Throw a JSON-formatted HTTPException (caught by Hono automatically) */
function httpError(status: number, error: string): never {
  const res = new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
  throw new HTTPException(status as 400 | 404, { res });
}

/** Parse a route param as a positive integer, or throw 400 */
export function parseIdParam(value: string, fieldName = 'ID'): number {
  const id = Number(value);
  if (!Number.isFinite(id) || id < 1) {
    httpError(400, `Ogiltigt ${fieldName}`);
  }
  return id;
}

/** Parse eventId param + verify event exists, or throw 400/404 */
export async function requireEvent(db: D1Database, eventIdStr: string) {
  const eventId = parseIdParam(eventIdStr, 'event-ID');
  const event = await getEventById(db, eventId);
  if (!event) {
    httpError(404, 'Event hittades inte');
  }
  return { eventId, event };
}
