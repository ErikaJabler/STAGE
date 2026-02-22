import { Hono } from "hono";
import type { Env } from "../bindings";
import { createEventSchema, updateEventSchema } from "@stage/shared";
import { parseBody } from "../utils/validation";
import { EventService, generateICS } from "../services/event.service";

const events = new Hono<{ Bindings: Env }>();

/** GET /api/events — List all events */
events.get("/", async (c) => {
  const results = await EventService.list(c.env.DB);
  return c.json(results);
});

/** GET /api/events/:id — Get single event */
events.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: "Ogiltigt event-ID" }, 400);
  }

  const event = await EventService.getById(c.env.DB, id);
  if (!event) {
    return c.json({ error: "Event hittades inte" }, 404);
  }

  return c.json(event);
});

/** POST /api/events — Create event */
events.post("/", async (c) => {
  const body = await c.req.json();
  const input = parseBody(createEventSchema, body);

  const event = await EventService.create(c.env.DB, input);
  return c.json(event, 201);
});

/** PUT /api/events/:id — Update event */
events.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: "Ogiltigt event-ID" }, 400);
  }

  const body = await c.req.json();
  const input = parseBody(updateEventSchema, body);

  const event = await EventService.update(c.env.DB, id, input);
  if (!event) {
    return c.json({ error: "Event hittades inte" }, 404);
  }

  return c.json(event);
});

/** GET /api/events/:id/calendar.ics — Generate ICS calendar file */
events.get("/:id/calendar.ics", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: "Ogiltigt event-ID" }, 400);
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

/** DELETE /api/events/:id — Soft-delete event */
events.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: "Ogiltigt event-ID" }, 400);
  }

  const deleted = await EventService.softDelete(c.env.DB, id);
  if (!deleted) {
    return c.json({ error: "Event hittades inte" }, 404);
  }

  return c.json({ ok: true });
});

export default events;
