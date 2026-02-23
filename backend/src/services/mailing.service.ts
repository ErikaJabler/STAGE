import type { Mailing, Event, UpdateMailingInput } from "@stage/shared";
import {
  listMailings,
  getMailingById,
  createMailing,
  updateMailing,
  markMailingSent,
  getMailingRecipients,
  getNewMailingRecipients,
  getEventById,
  type CreateMailingInput,
} from "../db/queries";
import { buildMergeContext, renderEmail, renderText, renderHtml, createEmailProvider } from "./email";
import { enqueueEmails, recordSentEmails, getQueueStats } from "./email/send-queue";

export const MailingService = {
  list(db: D1Database, eventId: number): Promise<Mailing[]> {
    return listMailings(db, eventId);
  },

  create(db: D1Database, eventId: number, input: CreateMailingInput): Promise<Mailing> {
    return createMailing(db, eventId, input);
  },

  /** Update a draft mailing */
  async update(
    db: D1Database,
    eventId: number,
    mailingId: number,
    input: UpdateMailingInput
  ): Promise<Mailing | null> {
    const mailing = await getMailingById(db, mailingId);
    if (!mailing || mailing.event_id !== eventId) {
      return null;
    }
    if (mailing.status !== "draft") {
      throw new Error("Bara utkast kan redigeras");
    }
    return updateMailing(db, mailingId, input);
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

    // Build queue items — use custom html_body if present, otherwise template renderer
    const queueItems = recipients.map((recipient) => {
      const context = buildMergeContext(event, recipient, baseUrl);
      if (mailing.html_body) {
        // GrapeJS-generated HTML: merge fields in html_body, HTML-escaped to prevent XSS
        const renderedSubject = renderText(mailing.subject, context);
        const mergedHtml = renderHtml(mailing.html_body, context);
        return {
          mailing_id: mailingId,
          event_id: eventId,
          to_email: recipient.email,
          to_name: recipient.name,
          subject: renderedSubject,
          html: mergedHtml,
          plain_text: renderText(mailing.body, context),
        };
      }
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
    const sentItems: typeof items = [];

    for (const item of items) {
      const result = await provider.send({
        to: item.to_email,
        subject: item.subject,
        body: item.plain_text,
        html: item.html,
      });

      if (result.success) {
        sent++;
        sentItems.push(item);
      } else {
        failed++;
        if (result.error) {
          errors.push(`${item.to_email}: ${result.error}`);
        }
      }
    }

    // Record successfully sent emails in queue for audit trail
    if (sentItems.length > 0) {
      await recordSentEmails(db, sentItems);
    }

    const updated = await markMailingSent(db, mailing.id);
    return { mailing: updated, sent, failed, total: items.length, errors };
  },

  /** Send a mailing to NEW participants only (not already sent) */
  async sendToNew(
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

    if (mailing.status !== "sent") {
      return { mailing, sent: 0, failed: 0, total: 0, errors: ["Utskicket måste vara skickat först"] };
    }

    const recipients = await getNewMailingRecipients(db, eventId, mailingId, mailing.recipient_filter);
    if (recipients.length === 0) {
      return { mailing, sent: 0, failed: 0, total: 0, errors: [] };
    }

    const event = (await getEventById(db, eventId))!;

    const queueItems = recipients.map((recipient) => {
      const context = buildMergeContext(event, recipient, baseUrl);
      if (mailing.html_body) {
        const renderedSubject = renderText(mailing.subject, context);
        const mergedHtml = renderHtml(mailing.html_body, context);
        return {
          mailing_id: mailingId,
          event_id: eventId,
          to_email: recipient.email,
          to_name: recipient.name,
          subject: renderedSubject,
          html: mergedHtml,
          plain_text: renderText(mailing.body, context),
        };
      }
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

    if (recipients.length <= 5) {
      // Direct send — but don't re-mark as sent (already sent)
      const provider = createEmailProvider(apiKey);
      let sent = 0;
      let failed = 0;
      const errors: string[] = [];
      const sentItems: typeof queueItems = [];

      for (const item of queueItems) {
        const result = await provider.send({
          to: item.to_email,
          subject: item.subject,
          body: item.plain_text,
          html: item.html,
        });

        if (result.success) {
          sent++;
          sentItems.push(item);
        } else {
          failed++;
          if (result.error) {
            errors.push(`${item.to_email}: ${result.error}`);
          }
        }
      }

      if (sentItems.length > 0) {
        await recordSentEmails(db, sentItems);
      }

      return { mailing, sent, failed, total: queueItems.length, errors };
    }

    // Enqueue for Cron processing
    const enqueued = await enqueueEmails(db, queueItems);
    return { mailing, sent: 0, failed: 0, total: enqueued, errors: [] };
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

    let emailSubject: string;
    let emailHtml: string;
    let emailText: string;

    if (mailing.html_body) {
      emailSubject = renderText(`[TEST] ${mailing.subject}`, fakeContext);
      emailHtml = renderHtml(mailing.html_body, fakeContext);
      emailText = renderText(mailing.body, fakeContext);
    } else {
      const rendered = renderEmail(mailing.body, `[TEST] ${mailing.subject}`, fakeContext, event);
      emailSubject = rendered.subject;
      emailHtml = rendered.html;
      emailText = rendered.text;
    }

    const provider = createEmailProvider(apiKey);

    const result = await provider.send({
      to: testEmail,
      subject: emailSubject,
      body: emailText,
      html: emailHtml,
    });

    return { success: result.success, error: result.error };
  },

  /** Get queue stats for a mailing */
  getQueueStats(db: D1Database, mailingId: number) {
    return getQueueStats(db, mailingId);
  },
};
