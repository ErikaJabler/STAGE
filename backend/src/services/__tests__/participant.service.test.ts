import { env } from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vitest';
import { ParticipantService, parseCSV } from '../participant.service';
import { EventService } from '../event.service';
import { createParticipantSchema, updateParticipantSchema } from '@stage/shared';

const EVENTS_SQL = `CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, emoji TEXT, slug TEXT NOT NULL UNIQUE, date TEXT NOT NULL, time TEXT NOT NULL, end_date TEXT, end_time TEXT, location TEXT NOT NULL, description TEXT, organizer TEXT NOT NULL, organizer_email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'planning', type TEXT NOT NULL DEFAULT 'other', max_participants INTEGER, overbooking_limit INTEGER NOT NULL DEFAULT 0, visibility TEXT NOT NULL DEFAULT 'private', sender_mailbox TEXT, gdpr_consent_text TEXT, image_url TEXT, website_template TEXT, website_data TEXT, website_published INTEGER NOT NULL DEFAULT 0, created_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), deleted_at TEXT);`;

const PARTICIPANTS_SQL = `CREATE TABLE IF NOT EXISTS participants (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, company TEXT, category TEXT NOT NULL DEFAULT 'other', status TEXT NOT NULL DEFAULT 'invited', queue_position INTEGER, response_deadline TEXT, dietary_notes TEXT, plus_one_name TEXT, plus_one_email TEXT, cancellation_token TEXT NOT NULL UNIQUE, email_status TEXT, gdpr_consent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE);`;

const MAILINGS_SQL = `CREATE TABLE IF NOT EXISTS mailings (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, recipient_filter TEXT NOT NULL DEFAULT 'all', status TEXT NOT NULL DEFAULT 'draft', sent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE);`;

const EMAIL_QUEUE_SQL = `CREATE TABLE IF NOT EXISTS email_queue (id INTEGER PRIMARY KEY AUTOINCREMENT, mailing_id INTEGER NOT NULL REFERENCES mailings(id), event_id INTEGER NOT NULL REFERENCES events(id), to_email TEXT NOT NULL, to_name TEXT NOT NULL, subject TEXT NOT NULL, html TEXT NOT NULL, plain_text TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', error TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), sent_at TEXT);`;

beforeAll(async () => {
  await env.DB.exec(EVENTS_SQL);
  await env.DB.exec(PARTICIPANTS_SQL);
  await env.DB.exec(MAILINGS_SQL);
  await env.DB.exec(EMAIL_QUEUE_SQL);
});

async function createTestEvent(maxParticipants?: number): Promise<number> {
  const event = await EventService.create(env.DB, {
    name: `Participant Test ${Date.now()}`,
    slug: `pt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    date: '2026-09-01',
    time: '14:00',
    location: 'Göteborg',
    organizer: 'Test',
    organizer_email: 'test@consid.se',
    created_by: 'test@consid.se',
    max_participants: maxParticipants ?? null,
    overbooking_limit: 0,
  });
  return event.id;
}

describe('parseCSV', () => {
  it('parses CSV with Swedish headers', () => {
    const csv =
      'namn,email,företag,kategori\nAnna,anna@test.se,Consid,intern\nErik,erik@test.se,IKEA,partner';
    const { rows, parseErrors } = parseCSV(csv);

    expect(rows).toHaveLength(2);
    expect(rows[0].data.name).toBe('Anna');
    expect(rows[0].data.email).toBe('anna@test.se');
    expect(rows[0].data.company).toBe('Consid');
    expect(rows[0].data.category).toBe('internal');
    expect(rows[1].data.category).toBe('partner');
    expect(parseErrors).toHaveLength(0);
  });

  it('parses CSV with semicolon separator', () => {
    const csv = 'namn;email;företag\nAnna;anna@test.se;Consid';
    const { rows } = parseCSV(csv);

    expect(rows).toHaveLength(1);
    expect(rows[0].data.name).toBe('Anna');
    expect(rows[0].data.email).toBe('anna@test.se');
  });

  it('falls back to positional parsing when no headers match', () => {
    const csv = 'Anna,anna@test.se,Consid';
    const { rows } = parseCSV(csv);

    expect(rows).toHaveLength(1);
    expect(rows[0].data.name).toBe('Anna');
    expect(rows[0].data.email).toBe('anna@test.se');
    expect(rows[0].data.company).toBe('Consid');
  });

  it('handles quoted fields with commas', () => {
    const csv = 'namn,email\n"Svensson, Anna",anna@test.se';
    const { rows } = parseCSV(csv);

    expect(rows).toHaveLength(1);
    expect(rows[0].data.name).toBe('Svensson, Anna');
  });
});

describe('createParticipantSchema', () => {
  it('rejects missing required fields', () => {
    const result = createParticipantSchema.safeParse({ name: '', email: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message);
      expect(messages).toContain('name krävs');
      expect(messages).toContain('email måste vara en giltig emailadress');
    }
  });

  it('rejects invalid email format', () => {
    const result = createParticipantSchema.safeParse({ name: 'Test', email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.message.includes('email'))).toBe(true);
    }
  });

  it('rejects invalid category', () => {
    const result = createParticipantSchema.safeParse({
      name: 'Test',
      email: 't@t.se',
      category: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('passes for valid input', () => {
    const result = createParticipantSchema.safeParse({
      name: 'Anna',
      email: 'anna@test.se',
      category: 'internal',
    });
    expect(result.success).toBe(true);
  });
});

describe('updateParticipantSchema', () => {
  it('rejects empty name', () => {
    const result = updateParticipantSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.message.includes('name'))).toBe(true);
    }
  });

  it('rejects invalid email', () => {
    const result = updateParticipantSchema.safeParse({ email: 'bad' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.message.includes('email'))).toBe(true);
    }
  });
});

describe('ParticipantService', () => {
  it('creates and lists participants', async () => {
    const eventId = await createTestEvent();

    await ParticipantService.create(env.DB, eventId, {
      name: 'Test Person',
      email: `test-${Date.now()}@test.se`,
    });

    const list = await ParticipantService.list(env.DB, eventId);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].name).toBe('Test Person');
    expect(list[0].cancellation_token).toBeTruthy();
  });

  it('auto-waitlists when at capacity', async () => {
    const eventId = await createTestEvent(1);
    const ts = Date.now();

    await ParticipantService.create(env.DB, eventId, {
      name: 'First',
      email: `first-${ts}@test.se`,
      status: 'attending',
    });

    const second = await ParticipantService.create(env.DB, eventId, {
      name: 'Second',
      email: `second-${ts}@test.se`,
      status: 'attending',
    });

    expect(second.status).toBe('waitlisted');
    expect(second.queue_position).toBe(1);
  });

  it('promotes from waitlist on delete', async () => {
    const eventId = await createTestEvent(1);
    const ts = Date.now();

    const first = await ParticipantService.create(env.DB, eventId, {
      name: 'Attending',
      email: `att-del-${ts}@test.se`,
      status: 'attending',
    });

    const second = await ParticipantService.create(env.DB, eventId, {
      name: 'Waitlisted',
      email: `wl-del-${ts}@test.se`,
      status: 'attending',
    });
    expect(second.status).toBe('waitlisted');

    await ParticipantService.delete(env.DB, eventId, first.id);

    const updated = await ParticipantService.getById(env.DB, second.id);
    expect(updated?.status).toBe('attending');
    expect(updated?.queue_position).toBeNull();
  });

  it('imports CSV with duplicate detection', async () => {
    const eventId = await createTestEvent();
    const ts = Date.now();

    // Add existing participant
    await ParticipantService.create(env.DB, eventId, {
      name: 'Existing',
      email: `existing-${ts}@test.se`,
    });

    const csv = `namn,email\nNew Person,new-${ts}@test.se\nExisting,existing-${ts}@test.se`;
    const result = await ParticipantService.importCSV(env.DB, eventId, csv);

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.errors.some((e) => e.reason.includes('Finns redan'))).toBe(true);
  });
});

describe('ParticipantService.getEmailHistory', () => {
  it('returns email history for participant with sent emails', async () => {
    const eventId = await createTestEvent();
    const ts = Date.now();
    const email = `hist-${ts}@test.se`;

    const participant = await ParticipantService.create(env.DB, eventId, {
      name: 'Mail Hist',
      email,
    });

    // Create a mailing and email_queue entries
    await env.DB.prepare(`INSERT INTO mailings (event_id, subject, body) VALUES (?, ?, ?)`)
      .bind(eventId, 'Test mailing', 'Body')
      .run();
    const mailingId = (await env.DB.prepare('SELECT last_insert_rowid() as id').first<{
      id: number;
    }>())!.id;

    await env.DB.prepare(
      `INSERT INTO email_queue (mailing_id, event_id, to_email, to_name, subject, html, plain_text, status, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', datetime('now'))`,
    )
      .bind(mailingId, eventId, email, 'Mail Hist', 'Test mailing', '<p>Hi</p>', 'Hi')
      .run();

    const history = await ParticipantService.getEmailHistory(env.DB, eventId, participant.id);
    expect(history).toHaveLength(1);
    expect(history[0].subject).toBe('Test mailing');
    expect(history[0].status).toBe('sent');
    expect(history[0].mailing_id).toBe(mailingId);
  });

  it('returns empty array for participant without emails', async () => {
    const eventId = await createTestEvent();
    const ts = Date.now();

    const participant = await ParticipantService.create(env.DB, eventId, {
      name: 'No Mail',
      email: `nomail-${ts}@test.se`,
    });

    const history = await ParticipantService.getEmailHistory(env.DB, eventId, participant.id);
    expect(history).toHaveLength(0);
  });

  it('returns empty array for wrong eventId', async () => {
    const eventId = await createTestEvent();
    const otherEventId = await createTestEvent();
    const ts = Date.now();

    const participant = await ParticipantService.create(env.DB, eventId, {
      name: 'Wrong Event',
      email: `wrongev-${ts}@test.se`,
    });

    const history = await ParticipantService.getEmailHistory(env.DB, otherEventId, participant.id);
    expect(history).toHaveLength(0);
  });
});

describe('ParticipantService.exportCateringCSV', () => {
  it('includes only attending and waitlisted participants', async () => {
    const eventId = await createTestEvent();
    const ts = Date.now();

    await ParticipantService.create(env.DB, eventId, {
      name: 'Attending',
      email: `att-cat-${ts}@test.se`,
      status: 'attending',
    });
    await ParticipantService.create(env.DB, eventId, {
      name: 'Invited',
      email: `inv-cat-${ts}@test.se`,
      status: 'invited',
    });
    await ParticipantService.create(env.DB, eventId, {
      name: 'Declined',
      email: `dec-cat-${ts}@test.se`,
      status: 'declined',
    });

    const csv = await ParticipantService.exportCateringCSV(env.DB, eventId);
    const lines = csv.split('\n');

    // Header + 1 attending (invited/declined excluded)
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(
      'Namn,E-post,Företag,Status,Allergier/Kost,Plus-one namn,Plus-one e-post',
    );
    expect(lines[1]).toContain('Attending');
    expect(csv).not.toContain('Invited');
    expect(csv).not.toContain('Declined');
  });

  it('shows Väntelista for waitlisted participants', async () => {
    const eventId = await createTestEvent(1);
    const ts = Date.now();

    // First fills capacity
    await ParticipantService.create(env.DB, eventId, {
      name: 'First',
      email: `first-cat-${ts}@test.se`,
      status: 'attending',
    });
    // Second gets waitlisted
    await ParticipantService.create(env.DB, eventId, {
      name: 'Waitlisted',
      email: `wl-cat-${ts}@test.se`,
      status: 'attending',
    });

    const csv = await ParticipantService.exportCateringCSV(env.DB, eventId);
    const lines = csv.split('\n');

    expect(lines).toHaveLength(3); // header + 2 rows
    const waitlistedLine = lines.find((l) => l.includes('Waitlisted'));
    expect(waitlistedLine).toContain('Väntelista');
    const attendingLine = lines.find((l) => l.includes('First'));
    expect(attendingLine).toContain('Deltar');
  });

  it('includes dietary_notes and plus_one fields', async () => {
    const eventId = await createTestEvent();
    const ts = Date.now();

    // Create participant with dietary + plus_one via direct create then update
    await ParticipantService.create(env.DB, eventId, {
      name: 'Food Person',
      email: `food-${ts}@test.se`,
      status: 'attending',
      dietary_notes: 'Glutenfri, nötallergi',
      plus_one_name: 'Partner Person',
      plus_one_email: 'partner@test.se',
    });

    const csv = await ParticipantService.exportCateringCSV(env.DB, eventId);
    expect(csv).toContain('Glutenfri');
    expect(csv).toContain('Partner Person');
    expect(csv).toContain('partner@test.se');
  });

  it('handles CSV escaping correctly', async () => {
    const eventId = await createTestEvent();
    const ts = Date.now();

    await ParticipantService.create(env.DB, eventId, {
      name: 'Svensson, Anna',
      email: `esc-${ts}@test.se`,
      status: 'attending',
      dietary_notes: 'Laktos "fri"',
    });

    const csv = await ParticipantService.exportCateringCSV(env.DB, eventId);
    // Name with comma should be quoted
    expect(csv).toContain('"Svensson, Anna"');
    // Dietary with quotes should be double-quoted
    expect(csv).toContain('"Laktos ""fri"""');
  });
});
