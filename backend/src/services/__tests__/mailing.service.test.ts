import { env } from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vitest';
import { MailingService } from '../mailing.service';
import { EventService } from '../event.service';
import { ParticipantService } from '../participant.service';

const EVENTS_SQL = `CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, emoji TEXT, slug TEXT NOT NULL UNIQUE, date TEXT NOT NULL, time TEXT NOT NULL, end_date TEXT, end_time TEXT, location TEXT NOT NULL, description TEXT, organizer TEXT NOT NULL, organizer_email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'planning', type TEXT NOT NULL DEFAULT 'other', max_participants INTEGER, overbooking_limit INTEGER NOT NULL DEFAULT 0, visibility TEXT NOT NULL DEFAULT 'private', sender_mailbox TEXT, gdpr_consent_text TEXT, image_url TEXT, website_template TEXT, website_data TEXT, website_published INTEGER NOT NULL DEFAULT 0, created_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), deleted_at TEXT);`;

const PARTICIPANTS_SQL = `CREATE TABLE IF NOT EXISTS participants (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, company TEXT, category TEXT NOT NULL DEFAULT 'other', status TEXT NOT NULL DEFAULT 'invited', queue_position INTEGER, response_deadline TEXT, dietary_notes TEXT, plus_one_name TEXT, plus_one_email TEXT, plus_one_dietary_notes TEXT, cancellation_token TEXT NOT NULL UNIQUE, email_status TEXT, gdpr_consent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE);`;

const MAILINGS_SQL = `CREATE TABLE IF NOT EXISTS mailings (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, html_body TEXT, editor_data TEXT, recipient_filter TEXT NOT NULL DEFAULT 'all', status TEXT NOT NULL DEFAULT 'draft', sent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE);`;

const EMAIL_QUEUE_SQL = `CREATE TABLE IF NOT EXISTS email_queue (id INTEGER PRIMARY KEY AUTOINCREMENT, mailing_id INTEGER NOT NULL, event_id INTEGER NOT NULL, to_email TEXT NOT NULL, to_name TEXT NOT NULL, subject TEXT NOT NULL, html TEXT NOT NULL, plain_text TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', error TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), sent_at TEXT);`;

beforeAll(async () => {
  await env.DB.exec(EVENTS_SQL);
  await env.DB.exec(PARTICIPANTS_SQL);
  await env.DB.exec(MAILINGS_SQL);
  await env.DB.exec(EMAIL_QUEUE_SQL);
});

const ts = () => Date.now() + Math.random().toString(36).slice(2, 6);

async function createTestEvent(): Promise<number> {
  const event = await EventService.create(env.DB, {
    name: `Mailing Test ${ts()}`,
    slug: `mt-${ts()}`,
    date: '2026-09-01',
    time: '14:00',
    location: 'Malmö',
    organizer: 'Test Organizer',
    organizer_email: 'org@consid.se',
    created_by: 'org@consid.se',
  });
  return event.id;
}

async function addParticipants(eventId: number, count: number): Promise<void> {
  const t = ts();
  for (let i = 0; i < count; i++) {
    await ParticipantService.create(env.DB, eventId, {
      name: `Person ${i + 1}`,
      email: `person${i}-${t}@test.se`,
      status: 'invited',
    });
  }
}

describe('MailingService', () => {
  describe('create + list', () => {
    it('creates a draft mailing and lists it', async () => {
      const eventId = await createTestEvent();
      const mailing = await MailingService.create(env.DB, eventId, {
        subject: 'Välkommen',
        body: 'Hej {{name}}!',
        recipient_filter: 'all',
      });

      expect(mailing.id).toBeGreaterThan(0);
      expect(mailing.status).toBe('draft');
      expect(mailing.subject).toBe('Välkommen');

      const list = await MailingService.list(env.DB, eventId);
      expect(list.length).toBeGreaterThan(0);
      expect(list.some((m) => m.id === mailing.id)).toBe(true);
    });
  });

  describe('update', () => {
    it('updates a draft mailing', async () => {
      const eventId = await createTestEvent();
      const mailing = await MailingService.create(env.DB, eventId, {
        subject: 'Ämne',
        body: 'Kropp',
      });

      const updated = await MailingService.update(env.DB, eventId, mailing.id, {
        subject: 'Nytt ämne',
      });

      expect(updated?.subject).toBe('Nytt ämne');
      expect(updated?.body).toBe('Kropp');
    });

    it('rejects update of a sent mailing', async () => {
      const eventId = await createTestEvent();
      await addParticipants(eventId, 1);
      const mailing = await MailingService.create(env.DB, eventId, {
        subject: 'Skicka',
        body: 'Hej',
      });

      // Send it first
      await MailingService.send(env.DB, eventId, mailing.id);

      // Try to update — should throw
      await expect(
        MailingService.update(env.DB, eventId, mailing.id, { subject: 'Ändra' }),
      ).rejects.toThrow('Bara utkast kan redigeras');
    });

    it('returns null for non-existent mailing', async () => {
      const eventId = await createTestEvent();
      const result = await MailingService.update(env.DB, eventId, 99999, {
        subject: 'X',
      });
      expect(result).toBeNull();
    });
  });

  describe('send', () => {
    it('sends directly when recipients <= 5', async () => {
      const eventId = await createTestEvent();
      await addParticipants(eventId, 3);
      const mailing = await MailingService.create(env.DB, eventId, {
        subject: 'Direkt',
        body: 'Hej {{name}}',
      });

      const result = await MailingService.send(env.DB, eventId, mailing.id);

      expect(result.total).toBe(3);
      expect(result.sent).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.mailing?.status).toBe('sent');
    });

    it('enqueues when recipients > 5', async () => {
      const eventId = await createTestEvent();
      await addParticipants(eventId, 7);
      const mailing = await MailingService.create(env.DB, eventId, {
        subject: 'Kö',
        body: 'Hej {{name}}',
      });

      const result = await MailingService.send(env.DB, eventId, mailing.id);

      // Enqueued = no direct sends, total = 7
      expect(result.total).toBe(7);
      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.mailing?.status).toBe('sent');

      // Verify items in queue
      const stats = await MailingService.getQueueStats(env.DB, mailing.id);
      expect(stats.pending).toBe(7);
    });

    it('rejects already sent mailing', async () => {
      const eventId = await createTestEvent();
      await addParticipants(eventId, 1);
      const mailing = await MailingService.create(env.DB, eventId, {
        subject: 'Redan skickad',
        body: 'Hej',
      });

      await MailingService.send(env.DB, eventId, mailing.id);
      const result = await MailingService.send(env.DB, eventId, mailing.id);

      expect(result.errors).toContain('Utskicket har redan skickats');
      expect(result.sent).toBe(0);
    });

    it('returns error when no recipients match filter', async () => {
      const eventId = await createTestEvent();
      // No participants added
      const mailing = await MailingService.create(env.DB, eventId, {
        subject: 'Tom',
        body: 'Hej',
      });

      const result = await MailingService.send(env.DB, eventId, mailing.id);

      expect(result.errors).toContain('Inga mottagare matchar filtret');
      expect(result.total).toBe(0);
    });

    it('returns error for non-existent mailing', async () => {
      const eventId = await createTestEvent();
      const result = await MailingService.send(env.DB, eventId, 99999);

      expect(result.mailing).toBeNull();
      expect(result.errors).toContain('Utskick hittades inte');
    });
  });

  describe('sendToNew', () => {
    it('sends only to new recipients not in queue', async () => {
      const eventId = await createTestEvent();
      await addParticipants(eventId, 3);
      const mailing = await MailingService.create(env.DB, eventId, {
        subject: 'Nya',
        body: 'Hej {{name}}',
      });

      // First send
      await MailingService.send(env.DB, eventId, mailing.id);

      // Add 2 more participants
      const t = ts();
      await ParticipantService.create(env.DB, eventId, {
        name: 'Ny Person 1',
        email: `new1-${t}@test.se`,
      });
      await ParticipantService.create(env.DB, eventId, {
        name: 'Ny Person 2',
        email: `new2-${t}@test.se`,
      });

      // Send to new
      const result = await MailingService.sendToNew(env.DB, eventId, mailing.id);

      expect(result.total).toBe(2);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('rejects if mailing status is not sent', async () => {
      const eventId = await createTestEvent();
      const mailing = await MailingService.create(env.DB, eventId, {
        subject: 'Draft',
        body: 'Hej',
      });

      const result = await MailingService.sendToNew(env.DB, eventId, mailing.id);

      expect(result.errors).toContain('Utskicket måste vara skickat först');
    });

    it('returns empty when no new recipients', async () => {
      const eventId = await createTestEvent();
      await addParticipants(eventId, 2);
      const mailing = await MailingService.create(env.DB, eventId, {
        subject: 'Alla skickade',
        body: 'Hej',
      });

      await MailingService.send(env.DB, eventId, mailing.id);

      const result = await MailingService.sendToNew(env.DB, eventId, mailing.id);

      expect(result.total).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('sendTest', () => {
    it('sends a test email with [TEST] prefix', async () => {
      const eventId = await createTestEvent();
      const mailing = await MailingService.create(env.DB, eventId, {
        subject: 'Inbjudan till {{event}}',
        body: 'Hej {{name}}, välkommen!',
      });

      const result = await MailingService.sendTest(
        env.DB,
        eventId,
        mailing.id,
        'test@consid.se',
        'Test Person',
      );

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns error for non-existent mailing', async () => {
      const eventId = await createTestEvent();

      const result = await MailingService.sendTest(
        env.DB,
        eventId,
        99999,
        'test@consid.se',
        'Test',
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Utskick hittades inte');
    });
  });
});
