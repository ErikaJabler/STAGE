import { Hono } from "hono";
import type { Env, AuthVariables } from "../bindings";
import type { EventWithCount } from "@stage/shared";

const search = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

/** GET / — search events by name, location, organizer */
search.get("/", async (c) => {
  const q = c.req.query("q")?.trim();
  if (!q || q.length < 2) {
    return c.json([]);
  }

  const user = c.get("user");
  const pattern = `%${q}%`;

  const result = await c.env.DB
    .prepare(
      `SELECT e.*, COUNT(p.id) AS participant_count
       FROM events e
       INNER JOIN event_permissions ep ON ep.event_id = e.id AND ep.user_id = ?
       LEFT JOIN participants p ON p.event_id = e.id
       WHERE e.deleted_at IS NULL
         AND (e.name LIKE ? OR e.location LIKE ? OR e.organizer LIKE ?)
       GROUP BY e.id
       ORDER BY e.date ASC
       LIMIT 10`
    )
    .bind(user.id, pattern, pattern, pattern)
    .all<EventWithCount>();

  return c.json(result.results);
});

export default search;
