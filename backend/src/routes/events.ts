import { Hono } from "hono";
import type { Env, AuthVariables } from "../bindings";
import { createEventSchema, updateEventSchema } from "@stage/shared";
import { parseBody } from "../utils/validation";
import { EventService, generateICS } from "../services/event.service";
import { PermissionService } from "../services/permission.service";
import { listEventsForUser } from "../db/event.queries";

const events = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

/** GET /api/events — List events user has access to */
events.get("/", async (c) => {
  const user = c.var.user;
  const results = await listEventsForUser(c.env.DB, user.id);
  return c.json(results);
});

/** GET /api/events/:id — Get single event (requires viewer+) */
events.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: "Ogiltigt event-ID" }, 400);
  }

  const user = c.var.user;
  const canView = await PermissionService.canView(c.env.DB, user.id, id);
  if (!canView) {
    return c.json({ error: "Åtkomst nekad" }, 403);
  }

  const event = await EventService.getById(c.env.DB, id);
  if (!event) {
    return c.json({ error: "Event hittades inte" }, 404);
  }

  return c.json(event);
});

/** POST /api/events — Create event (any authenticated user, becomes owner) */
events.post("/", async (c) => {
  const body = await c.req.json();
  const input = parseBody(createEventSchema, body);

  const event = await EventService.create(c.env.DB, input);

  // Auto-assign creator as owner
  const user = c.var.user;
  await PermissionService.setOwner(c.env.DB, user.id, event.id);

  return c.json(event, 201);
});

/** PUT /api/events/:id — Update event (requires editor+) */
events.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: "Ogiltigt event-ID" }, 400);
  }

  const user = c.var.user;
  const canEdit = await PermissionService.canEdit(c.env.DB, user.id, id);
  if (!canEdit) {
    return c.json({ error: "Åtkomst nekad" }, 403);
  }

  const body = await c.req.json();
  const input = parseBody(updateEventSchema, body);

  const event = await EventService.update(c.env.DB, id, input);
  if (!event) {
    return c.json({ error: "Event hittades inte" }, 404);
  }

  return c.json(event);
});

/** GET /api/events/:id/calendar.ics — Generate ICS (requires viewer+) */
events.get("/:id/calendar.ics", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: "Ogiltigt event-ID" }, 400);
  }

  const user = c.var.user;
  const canView = await PermissionService.canView(c.env.DB, user.id, id);
  if (!canView) {
    return c.json({ error: "Åtkomst nekad" }, 403);
  }

  const event = await EventService.getById(c.env.DB, id);
  if (!event) {
    return c.json({ error: "Event hittades inte" }, 404);
  }

  const ics = generateICS(event);

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug || "event"}.ics"`,
    },
  });
});

/** DELETE /api/events/:id — Soft-delete event (requires owner) */
events.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: "Ogiltigt event-ID" }, 400);
  }

  const user = c.var.user;
  const isOwner = await PermissionService.isOwner(c.env.DB, user.id, id);
  if (!isOwner) {
    return c.json({ error: "Bara ägaren kan radera event" }, 403);
  }

  const deleted = await EventService.softDelete(c.env.DB, id);
  if (!deleted) {
    return c.json({ error: "Event hittades inte" }, 404);
  }

  return c.json({ ok: true });
});

export default events;
