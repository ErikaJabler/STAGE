import { Hono } from "hono";
import type { Env } from "../bindings";
import { getEventById, type CreateMailingInput } from "../db/queries";
import { MailingService, validateCreateMailing } from "../services/mailing.service";

const mailings = new Hono<{ Bindings: Env }>();

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

/** GET /api/events/:eventId/mailings — List all mailings */
mailings.get("/", async (c) => {
  const { error, status, eventId } = await validateEvent(c.env.DB, c.req.param("eventId") as string);
  if (error) return c.json({ error }, status);

  const results = await MailingService.list(c.env.DB, eventId);
  return c.json(results);
});

/** POST /api/events/:eventId/mailings — Create a new mailing */
mailings.post("/", async (c) => {
  const { error, status, eventId } = await validateEvent(c.env.DB, c.req.param("eventId") as string);
  if (error) return c.json({ error }, status);

  const body = await c.req.json<CreateMailingInput>();
  const errors = validateCreateMailing(body);
  if (errors.length > 0) {
    return c.json({ error: "Valideringsfel", details: errors }, 400);
  }

  const mailing = await MailingService.create(c.env.DB, eventId, body);
  return c.json(mailing, 201);
});

/** POST /api/events/:eventId/mailings/:mid/send — Send a mailing */
mailings.post("/:mid/send", async (c) => {
  const { error, status, eventId } = await validateEvent(c.env.DB, c.req.param("eventId") as string);
  if (error) return c.json({ error }, status);

  const mid = Number(c.req.param("mid"));
  if (!Number.isFinite(mid) || mid < 1) {
    return c.json({ error: "Ogiltigt utskicks-ID" }, 400);
  }

  const result = await MailingService.send(c.env.DB, eventId, mid, c.env.RESEND_API_KEY);

  if (!result.mailing) {
    return c.json({ error: result.errors[0] || "Utskick hittades inte" }, 404);
  }

  if (result.errors.length > 0 && result.sent === 0) {
    return c.json({ error: result.errors[0] }, 400);
  }

  return c.json({
    mailing: result.mailing,
    sent: result.sent,
    failed: result.failed,
    total: result.total,
    ...(result.errors.length > 0 ? { errors: result.errors } : {}),
  });
});

export default mailings;
