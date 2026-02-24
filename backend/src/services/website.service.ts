import type { Event, WebsiteData } from '@stage/shared';
import { WaitlistService } from './waitlist.service';
import { createParticipant } from '../db/queries';
import type { CreateParticipantInput } from '@stage/shared';

export const WebsiteService = {
  /** Get website data for an event */
  async getWebsite(
    db: D1Database,
    eventId: number,
  ): Promise<{
    template: string | null;
    data: WebsiteData | null;
    published: boolean;
  } | null> {
    const event = await db
      .prepare(
        'SELECT website_template, website_data, website_published FROM events WHERE id = ? AND deleted_at IS NULL',
      )
      .bind(eventId)
      .first<{
        website_template: string | null;
        website_data: string | null;
        website_published: number;
      }>();

    if (!event) return null;

    let data: WebsiteData | null = null;
    if (event.website_data) {
      try {
        data = JSON.parse(event.website_data);
      } catch {
        console.warn(`[WebsiteService] Invalid JSON in website_data for event ${eventId}`);
      }
    }

    return {
      template: event.website_template,
      data,
      published: event.website_published === 1,
    };
  },

  /** Save website data for an event */
  async saveWebsite(
    db: D1Database,
    eventId: number,
    input: { template?: string; data?: WebsiteData; published?: boolean },
  ): Promise<{
    template: string | null;
    data: WebsiteData | null;
    published: boolean;
  }> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (input.template !== undefined) {
      fields.push('website_template = ?');
      values.push(input.template);
    }
    if (input.data !== undefined) {
      fields.push('website_data = ?');
      values.push(JSON.stringify(input.data));
    }
    if (input.published !== undefined) {
      fields.push('website_published = ?');
      values.push(input.published ? 1 : 0);
    }

    if (fields.length > 0) {
      fields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(eventId);

      await db
        .prepare(`UPDATE events SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`)
        .bind(...values)
        .run();
    }

    return (await this.getWebsite(db, eventId))!;
  },

  /** Get event by slug for public rendering */
  async getPublicEvent(
    db: D1Database,
    slug: string,
  ): Promise<(Event & { website_data_parsed: WebsiteData | null }) | null> {
    const event = await db
      .prepare('SELECT * FROM events WHERE slug = ? AND deleted_at IS NULL')
      .bind(slug)
      .first<Event & { website_published: number }>();

    if (!event) return null;
    if (!event.website_published) return null;

    let websiteDataParsed: WebsiteData | null = null;
    if (event.website_data) {
      try {
        websiteDataParsed = JSON.parse(event.website_data as string);
      } catch {
        console.warn(`[WebsiteService] Invalid JSON in website_data for slug ${slug}`);
      }
    }

    return {
      ...event,
      website_data_parsed: websiteDataParsed,
    };
  },

  /** Register a participant via public website form */
  async register(
    db: D1Database,
    slug: string,
    input: {
      name: string;
      email: string;
      company?: string | null;
      category?: string;
      dietary_notes?: string | null;
      plus_one_name?: string | null;
      plus_one_email?: string | null;
    },
  ): Promise<{
    ok: boolean;
    status: string;
    waitlisted?: boolean;
    error?: string;
  }> {
    // Find event by slug
    const event = await db
      .prepare('SELECT * FROM events WHERE slug = ? AND deleted_at IS NULL')
      .bind(slug)
      .first<Event & { website_published: number }>();

    if (!event) {
      return { ok: false, status: '', error: 'Event hittades inte' };
    }

    if (!event.website_published) {
      return { ok: false, status: '', error: 'Anmälan är inte öppen' };
    }

    // Check for duplicate email
    const existing = await db
      .prepare('SELECT id FROM participants WHERE event_id = ? AND email = ?')
      .bind(event.id, input.email)
      .first();

    if (existing) {
      return { ok: false, status: '', error: 'Du är redan anmäld till detta event' };
    }

    // Check capacity — auto-waitlist if full
    const shouldWait = await WaitlistService.shouldWaitlist(db, event.id);

    const participantInput: CreateParticipantInput = {
      name: input.name,
      email: input.email,
      company: input.company,
      category:
        (input.category as 'internal' | 'public_sector' | 'private_sector' | 'partner' | 'other') ??
        'other',
      status: shouldWait ? 'waitlisted' : 'attending',
      dietary_notes: input.dietary_notes,
      plus_one_name: input.plus_one_name,
      plus_one_email: input.plus_one_email,
    };

    const participant = await createParticipant(db, event.id, participantInput);

    if (shouldWait) {
      // Set queue position
      const maxPos = await WaitlistService.getMaxQueuePosition(db, event.id);
      await db
        .prepare('UPDATE participants SET queue_position = ?, gdpr_consent_at = ? WHERE id = ?')
        .bind(maxPos, new Date().toISOString(), participant.id)
        .run();

      return { ok: true, status: 'waitlisted', waitlisted: true };
    }

    // Set gdpr_consent_at
    await db
      .prepare('UPDATE participants SET gdpr_consent_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), participant.id)
      .run();

    return { ok: true, status: 'attending' };
  },
};
