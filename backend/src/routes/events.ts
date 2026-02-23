import { Hono } from "hono";
import type { Env, AuthVariables } from "../bindings";
import { createEventSchema, updateEventSchema } from "@stage/shared";
import { parseBody } from "../utils/validation";
import { EventService, generateICS } from "../services/event.service";
import { PermissionService } from "../services/permission.service";
import { ActivityService } from "../services/activity.service";
import { AdminService } from "../services/admin.service";
import { listEventsForUser } from "../db/event.queries";

const events = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

/** GET /api/events/conflicts — Check for overlapping events (same date + location) */
events.get("/conflicts", async (c) => {
  const date = c.req.query("date");
  const location = c.req.query("location");
  const excludeId = c.req.query("excludeId");

  if (!date || !location) {
    return c.json({ error: "date och location krävs" }, 400);
  }

  const conflicts = await AdminService.checkConflicts(
    c.env.DB,
    date,
    location,
    excludeId ? Number(excludeId) : undefined
  );
  return c.json({ conflicts });
});

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
  await ActivityService.log(c.env.DB, event.id, "event_created", `Event skapat: "${event.name}"`, user.email);

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

  const updatedFields = Object.keys(input);
  await ActivityService.logEventUpdated(c.env.DB, id, updatedFields, user.email);

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

/** POST /api/events/:id/clone — Clone event (requires editor+) */
events.post("/:id/clone", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: "Ogiltigt event-ID" }, 400);
  }

  const user = c.var.user;
  const canEdit = await PermissionService.canEdit(c.env.DB, user.id, id);
  if (!canEdit) {
    return c.json({ error: "Åtkomst nekad" }, 403);
  }

  const cloned = await EventService.clone(c.env.DB, id, user.email);
  if (!cloned) {
    return c.json({ error: "Event hittades inte" }, 404);
  }

  // Auto-assign creator as owner of the clone
  await PermissionService.setOwner(c.env.DB, user.id, cloned.id);
  await ActivityService.log(c.env.DB, cloned.id, "event_created", `Event klonat från #${id}: "${cloned.name}"`, user.email);

  return c.json(cloned, 201);
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
