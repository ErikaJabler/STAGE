import { Hono } from "hono";
import type { Env, AuthVariables } from "../bindings";
import { createMailingSchema } from "@stage/shared";
import { parseBody } from "../utils/validation";
import { getEventById } from "../db/queries";
import { MailingService } from "../services/mailing.service";
import { PermissionService } from "../services/permission.service";
import { ActivityService } from "../services/activity.service";

const mailings = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

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

/** GET /api/events/:eventId/mailings — List all mailings (viewer+) */
mailings.get("/", async (c) => {
  const { error, status, eventId } = await validateEvent(c.env.DB, c.req.param("eventId") as string);
  if (error) return c.json({ error }, status);

  const user = c.var.user;
  if (!(await PermissionService.canView(c.env.DB, user.id, eventId))) {
    return c.json({ error: "Åtkomst nekad" }, 403);
  }

  const results = await MailingService.list(c.env.DB, eventId);
  return c.json(results);
});

/** POST /api/events/:eventId/mailings — Create a new mailing (editor+) */
mailings.post("/", async (c) => {
  const { error, status, eventId } = await validateEvent(c.env.DB, c.req.param("eventId") as string);
  if (error) return c.json({ error }, status);

  const user = c.var.user;
  if (!(await PermissionService.canEdit(c.env.DB, user.id, eventId))) {
    return c.json({ error: "Åtkomst nekad" }, 403);
  }

  const body = await c.req.json();
  const input = parseBody(createMailingSchema, body);

  const mailing = await MailingService.create(c.env.DB, eventId, input);
  await ActivityService.logMailingCreated(c.env.DB, eventId, input.subject, user.email);
  return c.json(mailing, 201);
});

/** POST /api/events/:eventId/mailings/:mid/send — Send a mailing (editor+) */
mailings.post("/:mid/send", async (c) => {
  const { error, status, eventId } = await validateEvent(c.env.DB, c.req.param("eventId") as string);
  if (error) return c.json({ error }, status);

  const user = c.var.user;
  if (!(await PermissionService.canEdit(c.env.DB, user.id, eventId))) {
    return c.json({ error: "Åtkomst nekad" }, 403);
  }

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

  await ActivityService.logMailingSent(c.env.DB, eventId, result.mailing.subject, result.total, user.email);

  return c.json({
    mailing: result.mailing,
    sent: result.sent,
    failed: result.failed,
    total: result.total,
    ...(result.errors.length > 0 ? { errors: result.errors } : {}),
  });
});

/** POST /api/events/:eventId/mailings/:mid/send-to-new — Send to new participants (editor+) */
mailings.post("/:mid/send-to-new", async (c) => {
  const { error, status, eventId } = await validateEvent(c.env.DB, c.req.param("eventId") as string);
  if (error) return c.json({ error }, status);

  const user = c.var.user;
  if (!(await PermissionService.canEdit(c.env.DB, user.id, eventId))) {
    return c.json({ error: "Åtkomst nekad" }, 403);
  }

  const mid = Number(c.req.param("mid"));
  if (!Number.isFinite(mid) || mid < 1) {
    return c.json({ error: "Ogiltigt utskicks-ID" }, 400);
  }

  const result = await MailingService.sendToNew(c.env.DB, eventId, mid, c.env.RESEND_API_KEY);

  if (!result.mailing) {
    return c.json({ error: result.errors[0] || "Utskick hittades inte" }, 404);
  }

  if (result.errors.length > 0 && result.sent === 0 && result.total === 0) {
    return c.json({ error: result.errors[0] }, 400);
  }

  if (result.total > 0) {
    await ActivityService.logMailingSent(c.env.DB, eventId, `${result.mailing.subject} (nya mottagare)`, result.total, user.email);
  }

  return c.json({
    mailing: result.mailing,
    sent: result.sent,
    failed: result.failed,
    total: result.total,
    ...(result.errors.length > 0 ? { errors: result.errors } : {}),
  });
});

/** POST /api/events/:eventId/mailings/:mid/test — Send test email to logged-in user (editor+) */
mailings.post("/:mid/test", async (c) => {
  const { error, status, eventId } = await validateEvent(c.env.DB, c.req.param("eventId") as string);
  if (error) return c.json({ error }, status);

  const user = c.var.user;
  if (!(await PermissionService.canEdit(c.env.DB, user.id, eventId))) {
    return c.json({ error: "Åtkomst nekad" }, 403);
  }

  const mid = Number(c.req.param("mid"));
  if (!Number.isFinite(mid) || mid < 1) {
    return c.json({ error: "Ogiltigt utskicks-ID" }, 400);
  }

  const result = await MailingService.sendTest(c.env.DB, eventId, mid, user.email, user.name, c.env.RESEND_API_KEY);

  if (!result.success) {
    return c.json({ error: result.error || "Kunde inte skicka testmail" }, 400);
  }

  return c.json({ ok: true, sentTo: user.email });
});

export default mailings;
