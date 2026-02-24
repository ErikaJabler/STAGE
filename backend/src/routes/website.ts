import { Hono } from "hono";
import type { Env, AuthVariables } from "../bindings";
import { WebsiteService } from "../services/website.service";
import { parseBody } from "../utils/validation";
import { updateWebsiteSchema, publicRegisterSchema } from "@stage/shared";
import { parseIdParam } from "../utils/route-helpers";
import { PermissionService } from "../services/permission.service";

const website = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

/** GET /api/events/:id/website — get website config (auth, editor+) */
website.get("/:id/website", async (c) => {
  const id = parseIdParam(c.req.param("id"), "event-ID");

  const user = c.var.user;
  const canView = await PermissionService.canView(c.env.DB, user.id, id);
  if (!canView) return c.json({ error: "Åtkomst nekad" }, 403);

  const result = await WebsiteService.getWebsite(c.env.DB, id);
  if (!result) return c.json({ error: "Event hittades inte" }, 404);

  return c.json(result);
});

/** PUT /api/events/:id/website — save website config (auth, editor+) */
website.put("/:id/website", async (c) => {
  const id = parseIdParam(c.req.param("id"), "event-ID");

  const user = c.var.user;
  const canEdit = await PermissionService.canEdit(c.env.DB, user.id, id);
  if (!canEdit) return c.json({ error: "Åtkomst nekad" }, 403);

  const body = await c.req.json();
  const input = parseBody(updateWebsiteSchema, body);

  const result = await WebsiteService.saveWebsite(c.env.DB, id, input);
  return c.json(result);
});

/** POST /api/events/:slug/register — public registration (no auth via middleware exception) */
website.post("/:slug/register", async (c) => {
  const slug = c.req.param("slug");
  const body = await c.req.json();
  const input = parseBody(publicRegisterSchema, body);

  const result = await WebsiteService.register(c.env.DB, slug, {
    name: input.name,
    email: input.email,
    company: input.company,
    category: input.category,
    dietary_notes: input.dietary_notes,
    plus_one_name: input.plus_one_name,
    plus_one_email: input.plus_one_email,
  });

  if (!result.ok) {
    return c.json({ error: result.error }, 400);
  }
  return c.json(result, 201);
});

export default website;
