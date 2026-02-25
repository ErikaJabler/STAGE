import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vitest';
import app from '../index';

const EVENTS_SQL = `CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, emoji TEXT, slug TEXT NOT NULL UNIQUE, date TEXT NOT NULL, time TEXT NOT NULL, end_date TEXT, end_time TEXT, location TEXT NOT NULL, description TEXT, organizer TEXT NOT NULL, organizer_email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'planning', type TEXT NOT NULL DEFAULT 'other', max_participants INTEGER, overbooking_limit INTEGER NOT NULL DEFAULT 0, visibility TEXT NOT NULL DEFAULT 'private', sender_mailbox TEXT, gdpr_consent_text TEXT, image_url TEXT, website_template TEXT, website_data TEXT, website_published INTEGER NOT NULL DEFAULT 0, created_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), deleted_at TEXT);`;

const PARTICIPANTS_SQL = `CREATE TABLE IF NOT EXISTS participants (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, company TEXT, category TEXT NOT NULL DEFAULT 'other', status TEXT NOT NULL DEFAULT 'invited', queue_position INTEGER, response_deadline TEXT, dietary_notes TEXT, plus_one_name TEXT, plus_one_email TEXT, plus_one_dietary_notes TEXT, cancellation_token TEXT NOT NULL UNIQUE, email_status TEXT, gdpr_consent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE);`;

const MAILINGS_SQL = `CREATE TABLE IF NOT EXISTS mailings (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, html_body TEXT, editor_data TEXT, recipient_filter TEXT NOT NULL DEFAULT 'all', status TEXT NOT NULL DEFAULT 'draft', sent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE);`;

const USERS_SQL = `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, token TEXT NOT NULL UNIQUE, is_admin INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')));`;

const PERMISSIONS_SQL = `CREATE TABLE IF NOT EXISTS event_permissions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, event_id INTEGER NOT NULL, role TEXT NOT NULL DEFAULT 'viewer', created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE, UNIQUE(user_id, event_id));`;

const ACTIVITIES_SQL = `CREATE TABLE IF NOT EXISTS activities (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL REFERENCES events(id), participant_id INTEGER REFERENCES participants(id) ON DELETE SET NULL, type TEXT NOT NULL, description TEXT NOT NULL, metadata TEXT, created_by TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));`;

const EMAIL_QUEUE_SQL = `CREATE TABLE IF NOT EXISTS email_queue (id INTEGER PRIMARY KEY AUTOINCREMENT, mailing_id INTEGER NOT NULL REFERENCES mailings(id), event_id INTEGER NOT NULL REFERENCES events(id), to_email TEXT NOT NULL, to_name TEXT NOT NULL, subject TEXT NOT NULL, html TEXT NOT NULL, plain_text TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', error TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), sent_at TEXT);`;

const TEST_TOKEN = 'test-auth-token-mailings';

beforeAll(async () => {
  await env.DB.exec(EVENTS_SQL);
  await env.DB.exec(PARTICIPANTS_SQL);
  await env.DB.exec(MAILINGS_SQL);
  await env.DB.exec(USERS_SQL);
  await env.DB.exec(PERMISSIONS_SQL);
  await env.DB.exec(ACTIVITIES_SQL);
  await env.DB.exec(EMAIL_QUEUE_SQL);
  await env.DB.exec(
    `INSERT OR IGNORE INTO users (email, name, token) VALUES ('test@consid.se', 'Test User', '${TEST_TOKEN}')`,
  );
});

async function request(method: string, path: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = { 'X-Auth-Token': TEST_TOKEN };
  if (body) headers['Content-Type'] = 'application/json';
  const req = new Request(`http://localhost/stage${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const ctx = createExecutionContext();
  const res = await app.fetch(req, env, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

async function createTestEvent(): Promise<number> {
  const res = await request('POST', '/api/events', {
    name: `Mailing Test ${Date.now()}`,
    date: '2026-09-01',
    time: '14:00',
    location: 'Malmö',
    organizer: 'Test',
    organizer_email: 'test@consid.se',
    slug: `mailing-test-${Date.now()}`,
  });
  const event = (await res.json()) as { id: number };
  return event.id;
}

describe('Mailings CRUD API', () => {
  it('POST /api/events/:id/mailings creates a mailing and returns 201', async () => {
    const eventId = await createTestEvent();

    const res = await request('POST', `/api/events/${eventId}/mailings`, {
      subject: 'Välkommen!',
      body: 'Hej, välkommen till eventet.',
      recipient_filter: 'all',
    });
    expect(res.status).toBe(201);

    const mailing = (await res.json()) as {
      id: number;
      subject: string;
      body: string;
      status: string;
      recipient_filter: string;
    };
    expect(mailing.id).toBeGreaterThan(0);
    expect(mailing.subject).toBe('Välkommen!');
    expect(mailing.body).toBe('Hej, välkommen till eventet.');
    expect(mailing.status).toBe('draft');
    expect(mailing.recipient_filter).toBe('all');
  });

  it('GET /api/events/:id/mailings lists mailings for an event', async () => {
    const eventId = await createTestEvent();

    // Create two mailings
    await request('POST', `/api/events/${eventId}/mailings`, {
      subject: 'Utskick A',
      body: 'Brödtext A',
    });
    await request('POST', `/api/events/${eventId}/mailings`, {
      subject: 'Utskick B',
      body: 'Brödtext B',
    });

    const res = await request('GET', `/api/events/${eventId}/mailings`);
    expect(res.status).toBe(200);

    const mailings = (await res.json()) as { subject: string }[];
    expect(mailings.length).toBe(2);
  });

  it('POST /api/events/:id/mailings returns 400 for missing subject', async () => {
    const eventId = await createTestEvent();

    const res = await request('POST', `/api/events/${eventId}/mailings`, {
      subject: '',
      body: 'Lite text',
    });
    expect(res.status).toBe(400);

    const body = (await res.json()) as { error: string; details: string[] };
    expect(body.error).toBe('Valideringsfel');
    expect(body.details).toContain('subject krävs');
  });
});

describe('Template preview API', () => {
  it('GET /api/templates/:type/preview returns rendered HTML for save-the-date', async () => {
    const req = new Request(`http://localhost/stage/api/templates/save-the-date/preview`, {
      method: 'GET',
      headers: { 'X-Auth-Token': TEST_TOKEN },
    });
    const ctx = createExecutionContext();
    const res = await app.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain('Anna Andersson');
    expect(html).toContain('Consid Sommarmingel 2026');
    expect(html).toContain('Stage');
  });

  it('GET /api/templates/nonexistent/preview returns 404', async () => {
    const req = new Request(`http://localhost/stage/api/templates/nonexistent/preview`, {
      method: 'GET',
      headers: { 'X-Auth-Token': TEST_TOKEN },
    });
    const ctx = createExecutionContext();
    const res = await app.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(404);
  });
});

describe('Send test email API', () => {
  it('POST /api/events/:id/mailings/:mid/test sends test email', async () => {
    const eventId = await createTestEvent();

    // Create a mailing
    const createRes = await request('POST', `/api/events/${eventId}/mailings`, {
      subject: 'Test utskick',
      body: 'Hej {{name}}, välkommen!',
    });
    const mailing = (await createRes.json()) as { id: number };

    // Send test email
    const res = await request('POST', `/api/events/${eventId}/mailings/${mailing.id}/test`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { ok: boolean; sentTo: string };
    expect(body.ok).toBe(true);
    expect(body.sentTo).toBe('test@consid.se');
  });
});

describe('RSVP API', () => {
  it('POST /api/rsvp/:token/respond updates participant status to attending', async () => {
    const eventId = await createTestEvent();

    // Create a participant
    const createRes = await request('POST', `/api/events/${eventId}/participants`, {
      name: 'RSVP Test',
      email: 'rsvp@consid.se',
    });
    const participant = (await createRes.json()) as {
      cancellation_token: string;
      status: string;
    };
    expect(participant.status).toBe('invited');

    // Respond attending (RSVP is public, no auth needed)
    const rsvpReq = new Request(
      `http://localhost/stage/api/rsvp/${participant.cancellation_token}/respond`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'attending' }),
      },
    );
    const ctx = createExecutionContext();
    const res = await app.fetch(rsvpReq, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { ok: boolean; status: string; name: string };
    expect(body.ok).toBe(true);
    expect(body.status).toBe('attending');
    expect(body.name).toBe('RSVP Test');
  });

  it('POST /api/rsvp/:token/cancel cancels participant attendance', async () => {
    const eventId = await createTestEvent();

    // Create a participant with attending status
    const createRes = await request('POST', `/api/events/${eventId}/participants`, {
      name: 'Cancel Test',
      email: 'cancel@consid.se',
      status: 'attending',
    });
    const participant = (await createRes.json()) as {
      cancellation_token: string;
    };

    // Cancel (RSVP is public)
    const cancelReq = new Request(
      `http://localhost/stage/api/rsvp/${participant.cancellation_token}/cancel`,
      {
        method: 'POST',
      },
    );
    const ctx = createExecutionContext();
    const res = await app.fetch(cancelReq, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { ok: boolean; status: string; name: string };
    expect(body.ok).toBe(true);
    expect(body.status).toBe('cancelled');
    expect(body.name).toBe('Cancel Test');
  });

  it('GET /api/rsvp/:token returns participant and event info', async () => {
    const eventId = await createTestEvent();

    const createRes = await request('POST', `/api/events/${eventId}/participants`, {
      name: 'Info Test',
      email: 'info@consid.se',
    });
    const participant = (await createRes.json()) as {
      cancellation_token: string;
    };

    // RSVP GET is public
    const rsvpReq = new Request(
      `http://localhost/stage/api/rsvp/${participant.cancellation_token}`,
      {
        method: 'GET',
      },
    );
    const ctx = createExecutionContext();
    const res = await app.fetch(rsvpReq, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      participant: { name: string; email: string; status: string };
      event: { name: string; location: string };
    };
    expect(body.participant.name).toBe('Info Test');
    expect(body.participant.email).toBe('info@consid.se');
    expect(body.event.location).toBe('Malmö');
  });

  it('GET /api/rsvp/invalid-token returns 404', async () => {
    const rsvpReq = new Request(`http://localhost/stage/api/rsvp/invalid-token-xxx`, {
      method: 'GET',
    });
    const ctx = createExecutionContext();
    const res = await app.fetch(rsvpReq, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(404);
  });
});
