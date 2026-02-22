import type { Mailing, Event } from "@stage/shared";
import {
  listMailings,
  getMailingById,
  createMailing,
  markMailingSent,
  getMailingRecipients,
  getEventById,
  type CreateMailingInput,
} from "../db/queries";
import { buildMergeContext, renderEmail, createEmailProvider } from "./email";
import { enqueueEmails, getQueueStats } from "./email/send-queue";

export const MailingService = {
  list(db: D1Database, eventId: number): Promise<Mailing[]> {
    return listMailings(db, eventId);
  },

  create(db: D1Database, eventId: number, input: CreateMailingInput): Promise<Mailing> {
    return createMailing(db, eventId, input);
  },

  /** Enqueue all emails for a mailing (processed by Cron Trigger) */
  async send(
    db: D1Database,
    eventId: number,
    mailingId: number,
    apiKey?: string,
    baseUrl = "https://mikwik.se"
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

    // Build queue items using template renderer
    const queueItems = recipients.map((recipient) => {
      const context = buildMergeContext(event, recipient, baseUrl);
      const rendered = renderEmail(mailing.body, mailing.subject, context, event);
      return {
        mailing_id: mailingId,
        event_id: eventId,
        to_email: recipient.email,
        to_name: recipient.name,
        subject: rendered.subject,
        html: rendered.html,
        plain_text: rendered.text,
      };
    });

    // Try direct send for small batches, queue for larger ones
    if (recipients.length <= 5) {
      return this.sendDirect(db, event, mailing, queueItems, apiKey);
    }

    // Enqueue for Cron processing
    const enqueued = await enqueueEmails(db, queueItems);
    const updated = await markMailingSent(db, mailingId);

    return {
      mailing: updated,
      sent: 0,
      failed: 0,
      total: enqueued,
      errors: [],
    };
  },

  /** Send emails directly (for small batches) */
  async sendDirect(
    db: D1Database,
    _event: Event,
    mailing: Mailing,
    items: Array<{ mailing_id: number; event_id: number; to_email: string; to_name: string; subject: string; html: string; plain_text: string }>,
    apiKey?: string
  ): Promise<{
    mailing: Mailing | null;
    sent: number;
    failed: number;
    total: number;
    errors: string[];
  }> {
    const provider = createEmailProvider(apiKey);
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const item of items) {
      const result = await provider.send({
        to: item.to_email,
        subject: item.subject,
        body: item.plain_text,
        html: item.html,
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
        if (result.error) {
          errors.push(`${item.to_email}: ${result.error}`);
        }
      }
    }

    const updated = await markMailingSent(db, mailing.id);
    return { mailing: updated, sent, failed, total: items.length, errors };
  },

  /** Send a test email to a specific recipient (the logged-in user) */
  async sendTest(
    db: D1Database,
    eventId: number,
    mailingId: number,
    testEmail: string,
    testName: string,
    apiKey?: string,
    baseUrl = "https://mikwik.se"
  ): Promise<{ success: boolean; error?: string }> {
    const mailing = await getMailingById(db, mailingId);
    if (!mailing || mailing.event_id !== eventId) {
      return { success: false, error: "Utskick hittades inte" };
    }

    const event = (await getEventById(db, eventId))!;

    // Build a fake participant context for the test email
    const fakeContext = {
      name: testName,
      event: event.name,
      datum: event.date,
      tid: event.time,
      plats: event.location,
      organizer: `${event.organizer} (${event.organizer_email})`,
      rsvp_link: `${baseUrl}/stage/rsvp/test-preview`,
      calendar_link: `${baseUrl}/stage/api/events/${event.id}/calendar.ics`,
    };

    const rendered = renderEmail(mailing.body, `[TEST] ${mailing.subject}`, fakeContext, event);
    const provider = createEmailProvider(apiKey);

    const result = await provider.send({
      to: testEmail,
      subject: rendered.subject,
      body: rendered.text,
      html: rendered.html,
    });

    return { success: result.success, error: result.error };
  },

  /** Get queue stats for a mailing */
  getQueueStats(db: D1Database, mailingId: number) {
    return getQueueStats(db, mailingId);
  },
};
