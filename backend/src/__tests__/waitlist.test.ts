import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vitest';
import app from '../index';

const EVENTS_SQL = `CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, emoji TEXT, slug TEXT NOT NULL UNIQUE, date TEXT NOT NULL, time TEXT NOT NULL, end_date TEXT, end_time TEXT, location TEXT NOT NULL, description TEXT, organizer TEXT NOT NULL, organizer_email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'planning', type TEXT NOT NULL DEFAULT 'other', max_participants INTEGER, overbooking_limit INTEGER NOT NULL DEFAULT 0, visibility TEXT NOT NULL DEFAULT 'private', sender_mailbox TEXT, gdpr_consent_text TEXT, image_url TEXT, website_template TEXT, website_data TEXT, website_published INTEGER NOT NULL DEFAULT 0, created_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), deleted_at TEXT);`;

const PARTICIPANTS_SQL = `CREATE TABLE IF NOT EXISTS participants (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, company TEXT, category TEXT NOT NULL DEFAULT 'other', status TEXT NOT NULL DEFAULT 'invited', queue_position INTEGER, response_deadline TEXT, dietary_notes TEXT, plus_one_name TEXT, plus_one_email TEXT, cancellation_token TEXT NOT NULL UNIQUE, email_status TEXT, gdpr_consent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE);`;

const USERS_SQL = `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, token TEXT NOT NULL UNIQUE, is_admin INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')));`;

const PERMISSIONS_SQL = `CREATE TABLE IF NOT EXISTS event_permissions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, event_id INTEGER NOT NULL, role TEXT NOT NULL DEFAULT 'viewer', created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE, UNIQUE(user_id, event_id));`;

const ACTIVITIES_SQL = `CREATE TABLE IF NOT EXISTS activities (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL REFERENCES events(id), type TEXT NOT NULL, description TEXT NOT NULL, metadata TEXT, created_by TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));`;

const TEST_TOKEN = 'test-auth-token-waitlist';

beforeAll(async () => {
  await env.DB.exec(EVENTS_SQL);
  await env.DB.exec(PARTICIPANTS_SQL);
  await env.DB.exec(USERS_SQL);
  await env.DB.exec(PERMISSIONS_SQL);
  await env.DB.exec(ACTIVITIES_SQL);
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

async function createTestEvent(maxParticipants: number): Promise<number> {
  const res = await request('POST', '/api/events', {
    name: `Waitlist Test ${Date.now()}`,
    date: '2026-09-01',
    time: '14:00',
    location: 'Göteborg',
    organizer: 'Test',
    organizer_email: 'test@consid.se',
    slug: `waitlist-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    max_participants: maxParticipants,
    overbooking_limit: 0,
  });
  const event = (await res.json()) as { id: number };
  return event.id;
}

describe('Waitlist logic', () => {
  it('auto-waitlists when event is at capacity via POST create with status attending', async () => {
    const eventId = await createTestEvent(2);

    // Add 2 attending participants (fills capacity)
    await request('POST', `/api/events/${eventId}/participants`, {
      name: 'P1',
      email: `p1-${Date.now()}@test.se`,
      status: 'attending',
    });
    await request('POST', `/api/events/${eventId}/participants`, {
      name: 'P2',
      email: `p2-${Date.now()}@test.se`,
      status: 'attending',
    });

    // Third should be auto-waitlisted
    const res = await request('POST', `/api/events/${eventId}/participants`, {
      name: 'P3 Waitlisted',
      email: `p3-${Date.now()}@test.se`,
      status: 'attending',
    });
    expect(res.status).toBe(201);

    const p3 = (await res.json()) as { status: string; queue_position: number | null };
    expect(p3.status).toBe('waitlisted');
    expect(p3.queue_position).toBe(1);
  });

  it('auto-promotes from waitlist when attending participant is deleted', async () => {
    const eventId = await createTestEvent(1);
    const ts = Date.now();

    // Add 1 attending
    const res1 = await request('POST', `/api/events/${eventId}/participants`, {
      name: 'Attending',
      email: `attending-${ts}@test.se`,
      status: 'attending',
    });
    const attending = (await res1.json()) as { id: number };

    // Add 1 that should be waitlisted
    const res2 = await request('POST', `/api/events/${eventId}/participants`, {
      name: 'Waitlisted',
      email: `waitlisted-${ts}@test.se`,
      status: 'attending',
    });
    const waitlisted = (await res2.json()) as { id: number; status: string };
    expect(waitlisted.status).toBe('waitlisted');

    // Delete attending → waitlisted should be promoted
    await request('DELETE', `/api/events/${eventId}/participants/${attending.id}`);

    // Check the waitlisted participant is now attending
    const listRes = await request('GET', `/api/events/${eventId}/participants`);
    const list = (await listRes.json()) as {
      id: number;
      status: string;
      queue_position: number | null;
    }[];
    const promoted = list.find((p) => p.id === waitlisted.id);
    expect(promoted?.status).toBe('attending');
    expect(promoted?.queue_position).toBeNull();
  });

  it('auto-promotes from waitlist when attending status changes to declined', async () => {
    const eventId = await createTestEvent(1);
    const ts = Date.now();

    // Add 1 attending
    const res1 = await request('POST', `/api/events/${eventId}/participants`, {
      name: 'Attending',
      email: `att-${ts}@test.se`,
      status: 'attending',
    });
    const attending = (await res1.json()) as { id: number };

    // Add 1 that should be waitlisted
    const res2 = await request('POST', `/api/events/${eventId}/participants`, {
      name: 'Waitlisted',
      email: `wl-${ts}@test.se`,
      status: 'attending',
    });
    const waitlisted = (await res2.json()) as { id: number; status: string };
    expect(waitlisted.status).toBe('waitlisted');

    // Change attending → declined
    await request('PUT', `/api/events/${eventId}/participants/${attending.id}`, {
      status: 'declined',
    });

    // Check the waitlisted participant is now attending
    const listRes = await request('GET', `/api/events/${eventId}/participants`);
    const list = (await listRes.json()) as { id: number; status: string }[];
    const promoted = list.find((p) => p.id === waitlisted.id);
    expect(promoted?.status).toBe('attending');
  });

  it('ICS calendar endpoint returns valid .ics file', async () => {
    const eventId = await createTestEvent(10);

    const res = await request('GET', `/api/events/${eventId}/calendar.ics`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/calendar');

    const text = await res.text();
    expect(text).toContain('BEGIN:VCALENDAR');
    expect(text).toContain('BEGIN:VEVENT');
    expect(text).toContain('DTSTART;TZID=Europe/Stockholm:');
    expect(text).toContain('END:VCALENDAR');
  });
});
