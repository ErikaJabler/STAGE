import { Hono } from "hono";
import type { Env } from "../bindings";
import {
  listParticipants,
  getParticipantById,
  createParticipant,
  updateParticipant,
  deleteParticipant,
  getEventById,
  type CreateParticipantInput,
  type UpdateParticipantInput,
} from "../db/queries";

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

/** GET /api/events/:eventId/participants — List all participants for an event */
participants.get("/", async (c) => {
  const { error, status, eventId } = await validateEvent(
    c.env.DB,
    c.req.param("eventId") as string
  );
  if (error) return c.json({ error }, status);

  const results = await listParticipants(c.env.DB, eventId);
  return c.json(results);
});

/** POST /api/events/:eventId/participants — Add a participant */
participants.post("/", async (c) => {
  const { error, status, eventId } = await validateEvent(
    c.env.DB,
    c.req.param("eventId") as string
  );
  if (error) return c.json({ error }, status);

  const body = await c.req.json<CreateParticipantInput>();
  const errors = validateCreateParticipant(body);

  if (errors.length > 0) {
    return c.json({ error: "Valideringsfel", details: errors }, 400);
  }

  const participant = await createParticipant(c.env.DB, eventId, body);
  return c.json(participant, 201);
});

/** PUT /api/events/:eventId/participants/:id — Update a participant */
participants.put("/:id", async (c) => {
  const { error, status } = await validateEvent(
    c.env.DB,
    c.req.param("eventId") as string
  );
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

  const participant = await updateParticipant(c.env.DB, id, body);
  if (!participant) {
    return c.json({ error: "Deltagare hittades inte" }, 404);
  }

  return c.json(participant);
});

/** DELETE /api/events/:eventId/participants/:id — Remove a participant */
participants.delete("/:id", async (c) => {
  const { error, status } = await validateEvent(
    c.env.DB,
    c.req.param("eventId") as string
  );
  if (error) return c.json({ error }, status);

  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: "Ogiltigt deltagare-ID" }, 400);
  }

  const deleted = await deleteParticipant(c.env.DB, id);
  if (!deleted) {
    return c.json({ error: "Deltagare hittades inte" }, 404);
  }

  return c.json({ ok: true });
});

/* ---- Validation ---- */

function validateCreateParticipant(body: CreateParticipantInput): string[] {
  const errors: string[] = [];

  if (!body.name?.trim()) errors.push("name krävs");
  if (!body.email?.trim()) errors.push("email krävs");

  if (
    body.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)
  ) {
    errors.push("email måste vara en giltig emailadress");
  }

  const validCategories = [
    "internal",
    "public_sector",
    "private_sector",
    "partner",
    "other",
  ];
  if (body.category && !validCategories.includes(body.category)) {
    errors.push(`category måste vara en av: ${validCategories.join(", ")}`);
  }

  const validStatuses = [
    "invited",
    "attending",
    "declined",
    "waitlisted",
    "cancelled",
  ];
  if (body.status && !validStatuses.includes(body.status)) {
    errors.push(`status måste vara en av: ${validStatuses.join(", ")}`);
  }

  return errors;
}

function validateUpdateParticipant(body: UpdateParticipantInput): string[] {
  const errors: string[] = [];

  if ("name" in body && !body.name?.trim()) {
    errors.push("name kan inte vara tomt");
  }
  if ("email" in body && !body.email?.trim()) {
    errors.push("email kan inte vara tomt");
  }
  if (
    body.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)
  ) {
    errors.push("email måste vara en giltig emailadress");
  }

  return errors;
}

export default participants;
