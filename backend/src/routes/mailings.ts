import { Hono } from "hono";
import type { Env, AuthVariables } from "../bindings";
import { createMailingSchema, updateMailingSchema } from "@stage/shared";
import { parseBody } from "../utils/validation";
import { parseIdParam, requireEvent } from "../utils/route-helpers";
import { MailingService } from "../services/mailing.service";
import { PermissionService } from "../services/permission.service";
import { ActivityService } from "../services/activity.service";

const mailings = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

/** GET /api/events/:eventId/mailings — List all mailings (viewer+) */
mailings.get("/", async (c) => {
  const { eventId } = await requireEvent(c.env.DB, c.req.param("eventId") as string);

  const user = c.var.user;
  if (!(await PermissionService.canView(c.env.DB, user.id, eventId))) {
    return c.json({ error: "Åtkomst nekad" }, 403);
  }

  const results = await MailingService.list(c.env.DB, eventId);
  return c.json(results);
});

/** POST /api/events/:eventId/mailings — Create a new mailing (editor+) */
mailings.post("/", async (c) => {
  const { eventId } = await requireEvent(c.env.DB, c.req.param("eventId") as string);

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

/** PUT /api/events/:eventId/mailings/:mid — Update a draft mailing (editor+) */
mailings.put("/:mid", async (c) => {
  const { eventId } = await requireEvent(c.env.DB, c.req.param("eventId") as string);

  const user = c.var.user;
  if (!(await PermissionService.canEdit(c.env.DB, user.id, eventId))) {
    return c.json({ error: "Åtkomst nekad" }, 403);
  }

  const mid = parseIdParam(c.req.param("mid"), "utskicks-ID");

  const body = await c.req.json();
  const input = parseBody(updateMailingSchema, body);

  try {
    const mailing = await MailingService.update(c.env.DB, eventId, mid, input);
    if (!mailing) {
      return c.json({ error: "Utskick hittades inte" }, 404);
    }

    await ActivityService.log(c.env.DB, eventId, "mailing_updated", `Utskick redigerat: "${mailing.subject}"`, user.email);
    return c.json(mailing);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Kunde inte uppdatera utskicket";
    return c.json({ error: message }, 400);
  }
});

/** POST /api/events/:eventId/mailings/:mid/send — Send a mailing (editor+) */
mailings.post("/:mid/send", async (c) => {
  const { eventId } = await requireEvent(c.env.DB, c.req.param("eventId") as string);

  const user = c.var.user;
  if (!(await PermissionService.canEdit(c.env.DB, user.id, eventId))) {
    return c.json({ error: "Åtkomst nekad" }, 403);
  }

  const mid = parseIdParam(c.req.param("mid"), "utskicks-ID");

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
  const { eventId } = await requireEvent(c.env.DB, c.req.param("eventId") as string);

  const user = c.var.user;
  if (!(await PermissionService.canEdit(c.env.DB, user.id, eventId))) {
    return c.json({ error: "Åtkomst nekad" }, 403);
  }

  const mid = parseIdParam(c.req.param("mid"), "utskicks-ID");

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
  const { eventId } = await requireEvent(c.env.DB, c.req.param("eventId") as string);

  const user = c.var.user;
  if (!(await PermissionService.canEdit(c.env.DB, user.id, eventId))) {
    return c.json({ error: "Åtkomst nekad" }, 403);
  }

  const mid = parseIdParam(c.req.param("mid"), "utskicks-ID");

  const result = await MailingService.sendTest(c.env.DB, eventId, mid, user.email, user.name, c.env.RESEND_API_KEY);

  if (!result.success) {
    return c.json({ error: result.error || "Kunde inte skicka testmail" }, 400);
  }

  return c.json({ ok: true, sentTo: user.email });
});

export default mailings;
