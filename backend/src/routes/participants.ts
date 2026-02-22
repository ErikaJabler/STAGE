import { Hono } from "hono";
import type { Env } from "../bindings";
import { getEventById, type CreateParticipantInput, type UpdateParticipantInput } from "../db/queries";
import {
  ParticipantService,
  validateCreateParticipant,
  validateUpdateParticipant,
} from "../services/participant.service";
import { WaitlistService } from "../services/waitlist.service";

const participants = new Hono<{ Bindings: Env }>();

/** Validate eventId param and check event exists */
async function validateEvent(db: D1Database, eventIdStr: string) {
  const eventId = Number(eventIdStr);
  if (!Number.isFinite(eventId) || eventId < 1) {
    return { error: "Ogiltigt event-ID", status: 400 as const, eventId: 0 };
  }
  const event = await getEventById(db, eventId);
  if (!event) {
    return { error: "Event hittades inte", status: 404 as const, eventId: 0 };
  }
  return { error: null, status: 200 as const, eventId };
}

/** GET /api/events/:eventId/participants — List all participants */
participants.get("/", async (c) => {
  const { error, status, eventId } = await validateEvent(c.env.DB, c.req.param("eventId") as string);
  if (error) return c.json({ error }, status);

  const results = await ParticipantService.list(c.env.DB, eventId);
  return c.json(results);
});

/** POST /api/events/:eventId/participants — Add a participant */
participants.post("/", async (c) => {
  const { error, status, eventId } = await validateEvent(c.env.DB, c.req.param("eventId") as string);
  if (error) return c.json({ error }, status);

  const body = await c.req.json<CreateParticipantInput>();
  const errors = validateCreateParticipant(body);
  if (errors.length > 0) {
    return c.json({ error: "Valideringsfel", details: errors }, 400);
  }

  const participant = await ParticipantService.create(c.env.DB, eventId, body);
  return c.json(participant, 201);
});

/** POST /api/events/:eventId/participants/import — Bulk import from CSV */
participants.post("/import", async (c) => {
  const { error, status, eventId } = await validateEvent(c.env.DB, c.req.param("eventId") as string);
  if (error) return c.json({ error }, status);

  const body = await c.req.parseBody();
  const file = body["file"];

  if (!file || !(file instanceof File)) {
    return c.json({ error: "CSV-fil krävs (form field 'file')" }, 400);
  }

  const csvText = await file.text();

  try {
    const result = await ParticipantService.importCSV(c.env.DB, eventId, csvText);
    return c.json(result);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 400);
  }
});

/** PUT /api/events/:eventId/participants/:id — Update a participant */
participants.put("/:id", async (c) => {
  const { error, status, eventId } = await validateEvent(c.env.DB, c.req.param("eventId") as string);
  if (error) return c.json({ error }, status);

  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: "Ogiltigt deltagare-ID" }, 400);
  }

  const body = await c.req.json<UpdateParticipantInput>();
  const errors = validateUpdateParticipant(body);
  if (errors.length > 0) {
    return c.json({ error: "Valideringsfel", details: errors }, 400);
  }

  const participant = await ParticipantService.update(c.env.DB, eventId, id, body);
  if (!participant) {
    return c.json({ error: "Deltagare hittades inte" }, 404);
  }

  return c.json(participant);
});

/** PUT /api/events/:eventId/participants/:id/reorder — Update queue position */
participants.put("/:id/reorder", async (c) => {
  const { error, status, eventId } = await validateEvent(c.env.DB, c.req.param("eventId") as string);
  if (error) return c.json({ error }, status);

  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: "Ogiltigt deltagare-ID" }, 400);
  }

  const body = await c.req.json<{ queue_position: number }>();
  if (!Number.isFinite(body.queue_position) || body.queue_position < 1) {
    return c.json({ error: "queue_position måste vara ett positivt heltal" }, 400);
  }

  const result = await WaitlistService.reorder(c.env.DB, eventId, id, body.queue_position);
  if (!result) {
    return c.json({ error: "Deltagare hittades inte eller är inte väntlistad" }, 404);
  }

  return c.json(result);
});

/** DELETE /api/events/:eventId/participants/:id — Remove a participant */
participants.delete("/:id", async (c) => {
  const { error, status, eventId } = await validateEvent(c.env.DB, c.req.param("eventId") as string);
  if (error) return c.json({ error }, status);

  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: "Ogiltigt deltagare-ID" }, 400);
  }

  const deleted = await ParticipantService.delete(c.env.DB, eventId, id);
  if (!deleted) {
    return c.json({ error: "Deltagare hittades inte" }, 404);
  }

  return c.json({ ok: true });
});

export default participants;
