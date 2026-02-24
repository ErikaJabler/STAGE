import { Hono } from "hono";
import type { Env, AuthVariables } from "../bindings";
import { SearchService } from "../services/search.service";

const search = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

/** GET / — search events by name, location, organizer */
search.get("/", async (c) => {
  const q = c.req.query("q")?.trim();
  if (!q || q.length < 2) {
    return c.json([]);
  }

  const user = c.get("user");
  const results = await SearchService.search(c.env.DB, user.id, q);
  return c.json(results);
});

export default search;
