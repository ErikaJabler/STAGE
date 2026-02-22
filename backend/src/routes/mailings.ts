import { Hono } from "hono";
import type { Env } from "../bindings";
import {
  listMailings,
  getMailingById,
  createMailing,
  markMailingSent,
  getMailingRecipients,
  getEventById,
  type CreateMailingInput,
} from "../db/queries";
import { createEmailProvider, buildEmailHtml } from "../services/email";

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

/** GET /api/events/:eventId/mailings — List all mailings for an event */
mailings.get("/", async (c) => {
  const { error, status, eventId } = await validateEvent(
    c.env.DB,
    c.req.param("eventId") as string
  );
  if (error) return c.json({ error }, status);

  const results = await listMailings(c.env.DB, eventId);
  return c.json(results);
});

/** POST /api/events/:eventId/mailings — Create a new mailing */
mailings.post("/", async (c) => {
  const { error, status, eventId } = await validateEvent(
    c.env.DB,
    c.req.param("eventId") as string
  );
  if (error) return c.json({ error }, status);

  const body = await c.req.json<CreateMailingInput>();
  const errors = validateCreateMailing(body);

  if (errors.length > 0) {
    return c.json({ error: "Valideringsfel", details: errors }, 400);
  }

  const mailing = await createMailing(c.env.DB, eventId, body);
  return c.json(mailing, 201);
});

/** POST /api/events/:eventId/mailings/:mid/send — Send a mailing */
mailings.post("/:mid/send", async (c) => {
  const { error, status, eventId } = await validateEvent(
    c.env.DB,
    c.req.param("eventId") as string
  );
  if (error) return c.json({ error }, status);

  const mid = Number(c.req.param("mid"));
  if (!Number.isFinite(mid) || mid < 1) {
    return c.json({ error: "Ogiltigt utskicks-ID" }, 400);
  }

  const mailing = await getMailingById(c.env.DB, mid);
  if (!mailing || mailing.event_id !== eventId) {
    return c.json({ error: "Utskick hittades inte" }, 404);
  }

  if (mailing.status === "sent") {
    return c.json({ error: "Utskicket har redan skickats" }, 400);
  }

  // Get recipients
  const recipients = await getMailingRecipients(
    c.env.DB,
    eventId,
    mailing.recipient_filter
  );

  if (recipients.length === 0) {
    return c.json({ error: "Inga mottagare matchar filtret" }, 400);
  }

  // Get event details for email template
  const event = (await getEventById(c.env.DB, eventId))!;

  // Send emails with per-recipient RSVP link
  const emailProvider = createEmailProvider(c.env.RESEND_API_KEY);
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    const rsvpUrl = `https://mikwik.se/stage/rsvp/${recipient.cancellation_token}`;

    // Replace {{rsvp_link}} placeholder in body, or auto-append
    let personalizedBody = mailing.body;
    if (personalizedBody.includes("{{rsvp_link}}")) {
      personalizedBody = personalizedBody.replace(
        /\{\{rsvp_link\}\}/g,
        rsvpUrl
      );
    } else {
      personalizedBody += `\n\nSvara på inbjudan: ${rsvpUrl}`;
    }

    // Replace {{name}} placeholder
    personalizedBody = personalizedBody.replace(
      /\{\{name\}\}/g,
      recipient.name
    );

    // Build HTML version
    const html = buildEmailHtml({
      body: personalizedBody,
      recipientName: recipient.name,
      eventName: event.name,
      eventDate: event.date,
      eventTime: event.time,
      eventLocation: event.location,
      rsvpUrl,
    });

    const result = await emailProvider.send({
      to: recipient.email,
      subject: mailing.subject,
      body: personalizedBody,
      html,
    });
    if (result.success) {
      sent++;
    } else {
      failed++;
      if (result.error) {
        errors.push(`${recipient.email}: ${result.error}`);
      }
    }
  }

  // Mark as sent
  const updated = await markMailingSent(c.env.DB, mid);

  return c.json({
    mailing: updated,
    sent,
    failed,
    total: recipients.length,
    ...(errors.length > 0 ? { errors } : {}),
  });
});

/* ---- Validation ---- */

function validateCreateMailing(body: CreateMailingInput): string[] {
  const errors: string[] = [];

  if (!body.subject?.trim()) errors.push("subject krävs");
  if (!body.body?.trim()) errors.push("body krävs");

  const validFilters = [
    "all",
    "invited",
    "attending",
    "declined",
    "waitlisted",
    "cancelled",
    "internal",
    "public_sector",
    "private_sector",
    "partner",
    "other",
  ];
  if (
    body.recipient_filter &&
    !validFilters.includes(body.recipient_filter)
  ) {
    errors.push(
      `recipient_filter måste vara en av: ${validFilters.join(", ")}`
    );
  }

  return errors;
}

export default mailings;
