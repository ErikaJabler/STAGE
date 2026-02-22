import type { Mailing } from "@stage/shared";
import {
  listMailings,
  getMailingById,
  createMailing,
  markMailingSent,
  getMailingRecipients,
  getEventById,
  type CreateMailingInput,
} from "../db/queries";
import { createEmailProvider, buildEmailHtml } from "./email";

export const MailingService = {
  list(db: D1Database, eventId: number): Promise<Mailing[]> {
    return listMailings(db, eventId);
  },

  create(db: D1Database, eventId: number, input: CreateMailingInput): Promise<Mailing> {
    return createMailing(db, eventId, input);
  },

  async send(
    db: D1Database,
    eventId: number,
    mailingId: number,
    apiKey?: string
  ): Promise<{
    mailing: Mailing | null;
    sent: number;
    failed: number;
    total: number;
    errors: string[];
  }> {
    const mailing = await getMailingById(db, mailingId);
    if (!mailing || mailing.event_id !== eventId) {
      return { mailing: null, sent: 0, failed: 0, total: 0, errors: ["Utskick hittades inte"] };
    }

    if (mailing.status === "sent") {
      return { mailing, sent: 0, failed: 0, total: 0, errors: ["Utskicket har redan skickats"] };
    }

    const recipients = await getMailingRecipients(db, eventId, mailing.recipient_filter);
    if (recipients.length === 0) {
      return { mailing, sent: 0, failed: 0, total: 0, errors: ["Inga mottagare matchar filtret"] };
    }

    const event = (await getEventById(db, eventId))!;
    const emailProvider = createEmailProvider(apiKey);
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const recipient of recipients) {
      const rsvpUrl = `https://mikwik.se/stage/rsvp/${recipient.cancellation_token}`;

      let personalizedBody = mailing.body;
      if (personalizedBody.includes("{{rsvp_link}}")) {
        personalizedBody = personalizedBody.replace(/\{\{rsvp_link\}\}/g, rsvpUrl);
      } else {
        personalizedBody += `\n\nSvara på inbjudan: ${rsvpUrl}`;
      }

      personalizedBody = personalizedBody.replace(/\{\{name\}\}/g, recipient.name);

      const calendarUrl = `https://mikwik.se/stage/api/events/${eventId}/calendar.ics`;
      const html = buildEmailHtml({
        body: personalizedBody,
        recipientName: recipient.name,
        eventName: event.name,
        eventDate: event.date,
        eventTime: event.time,
        eventLocation: event.location,
        rsvpUrl,
        calendarUrl,
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

    const updated = await markMailingSent(db, mailingId);

    return { mailing: updated, sent, failed, total: recipients.length, errors };
  },
};
