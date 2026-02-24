import type { EventWithCount } from "@stage/shared";

/** Search events by name, location, or organizer (user-scoped) */
export async function searchEvents(
  db: D1Database,
  userId: number,
  query: string,
  limit = 10
): Promise<EventWithCount[]> {
  const pattern = `%${query}%`;

  const result = await db
    .prepare(
      `SELECT e.*, COUNT(p.id) AS participant_count
       FROM events e
       INNER JOIN event_permissions ep ON ep.event_id = e.id AND ep.user_id = ?
       LEFT JOIN participants p ON p.event_id = e.id
       WHERE e.deleted_at IS NULL
         AND (e.name LIKE ? OR e.location LIKE ? OR e.organizer LIKE ?)
       GROUP BY e.id
       ORDER BY e.date ASC
       LIMIT ?`
    )
    .bind(userId, pattern, pattern, pattern, limit)
    .all<EventWithCount>();

  return result.results;
}
