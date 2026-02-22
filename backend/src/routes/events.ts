import { Hono } from "hono";
import type { Env } from "../bindings";
import type { CreateEventInput, UpdateEventInput } from "../db/queries";
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
  const body = await c.req.json<CreateEventInput>();
  const errors = validateCreateEvent(body);

  if (errors.length > 0) {
    return c.json({ error: "Valideringsfel", details: errors }, 400);
  }

  const event = await EventService.create(c.env.DB, body);
  return c.json(event, 201);
});

/** PUT /api/events/:id — Update event */
events.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: "Ogiltigt event-ID" }, 400);
  }

  const body = await c.req.json<UpdateEventInput>();
  const errors = validateUpdateEvent(body);

  if (errors.length > 0) {
    return c.json({ error: "Valideringsfel", details: errors }, 400);
  }

  const event = await EventService.update(c.env.DB, id, body);
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

/* ---- Validation (will move to Zod in session 8b) ---- */

function validateCreateEvent(body: CreateEventInput): string[] {
  const errors: string[] = [];

  if (!body.name?.trim()) errors.push("name krävs");
  if (!body.date?.trim()) errors.push("date krävs");
  if (!body.time?.trim()) errors.push("time krävs");
  if (!body.location?.trim()) errors.push("location krävs");
  if (!body.organizer?.trim()) errors.push("organizer krävs");
  if (!body.organizer_email?.trim()) errors.push("organizer_email krävs");

  if (body.date && !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    errors.push("date måste vara YYYY-MM-DD");
  }
  if (body.time && !/^\d{2}:\d{2}$/.test(body.time)) {
    errors.push("time måste vara HH:MM");
  }
  if (body.end_date && !/^\d{4}-\d{2}-\d{2}$/.test(body.end_date)) {
    errors.push("end_date måste vara YYYY-MM-DD");
  }
  if (body.end_time && !/^\d{2}:\d{2}$/.test(body.end_time)) {
    errors.push("end_time måste vara HH:MM");
  }
  if (body.organizer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.organizer_email)) {
    errors.push("organizer_email måste vara en giltig emailadress");
  }
  if (body.max_participants !== undefined && body.max_participants !== null && body.max_participants < 1) {
    errors.push("max_participants måste vara minst 1");
  }

  const validStatuses = ["planning", "upcoming", "ongoing", "completed", "cancelled"];
  if (body.status && !validStatuses.includes(body.status)) {
    errors.push(`status måste vara en av: ${validStatuses.join(", ")}`);
  }

  const validTypes = ["conference", "workshop", "seminar", "networking", "internal", "other"];
  if (body.type && !validTypes.includes(body.type)) {
    errors.push(`type måste vara en av: ${validTypes.join(", ")}`);
  }

  const validVisibility = ["public", "private"];
  if (body.visibility && !validVisibility.includes(body.visibility)) {
    errors.push(`visibility måste vara en av: ${validVisibility.join(", ")}`);
  }

  return errors;
}

function validateUpdateEvent(body: UpdateEventInput): string[] {
  const errors: string[] = [];

  if ("name" in body && !body.name?.trim()) errors.push("name kan inte vara tomt");
  if ("date" in body && !body.date?.trim()) errors.push("date kan inte vara tomt");
  if ("time" in body && !body.time?.trim()) errors.push("time kan inte vara tomt");
  if ("location" in body && !body.location?.trim()) errors.push("location kan inte vara tomt");
  if ("organizer" in body && !body.organizer?.trim()) errors.push("organizer kan inte vara tomt");
  if ("organizer_email" in body && !body.organizer_email?.trim()) errors.push("organizer_email kan inte vara tomt");

  if (body.date && !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    errors.push("date måste vara YYYY-MM-DD");
  }
  if (body.time && !/^\d{2}:\d{2}$/.test(body.time)) {
    errors.push("time måste vara HH:MM");
  }

  return errors;
}

export default events;
