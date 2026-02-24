import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vitest';
import app from '../index';

const RATE_LIMITS_SQL = `CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, window_start INTEGER NOT NULL, count INTEGER NOT NULL DEFAULT 1);`;

const EVENTS_SQL = `CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, emoji TEXT, slug TEXT NOT NULL UNIQUE, date TEXT NOT NULL, time TEXT NOT NULL, end_date TEXT, end_time TEXT, location TEXT NOT NULL, description TEXT, organizer TEXT NOT NULL, organizer_email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'planning', type TEXT NOT NULL DEFAULT 'other', max_participants INTEGER, overbooking_limit INTEGER NOT NULL DEFAULT 0, visibility TEXT NOT NULL DEFAULT 'private', sender_mailbox TEXT, gdpr_consent_text TEXT, image_url TEXT, website_template TEXT, website_data TEXT, website_published INTEGER NOT NULL DEFAULT 0, created_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), deleted_at TEXT);`;

const USERS_SQL = `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, token TEXT NOT NULL UNIQUE, is_admin INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')));`;

const PARTICIPANTS_SQL = `CREATE TABLE IF NOT EXISTS participants (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, company TEXT, category TEXT NOT NULL DEFAULT 'other', status TEXT NOT NULL DEFAULT 'invited', queue_position INTEGER, response_deadline TEXT, dietary_notes TEXT, plus_one_name TEXT, plus_one_email TEXT, cancellation_token TEXT NOT NULL UNIQUE, email_status TEXT, gdpr_consent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE);`;

beforeAll(async () => {
  await env.DB.exec(EVENTS_SQL);
  await env.DB.exec(USERS_SQL);
  await env.DB.exec(PARTICIPANTS_SQL);
  await env.DB.exec(RATE_LIMITS_SQL);
});

async function fetchApp(path: string, init?: RequestInit) {
  const req = new Request(`http://localhost${path}`, init);
  const ctx = createExecutionContext();
  const res = await app.fetch(req, env, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

describe('Security: R2 path traversal', () => {
  it('rejects path traversal in prefix (../../etc)', async () => {
    const res = await fetchApp('/stage/api/images/../../etc/passwd');
    // Hono may match or not match the route — either 400 or 404 is acceptable
    expect([400, 404]).toContain(res.status);
  });

  it('rejects invalid prefix', async () => {
    const res = await fetchApp('/stage/api/images/secret/abc.png');
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Ogiltigt prefix');
  });

  it('rejects non-UUID filename', async () => {
    const res = await fetchApp('/stage/api/images/events/malicious-file.png');
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Ogiltigt filnamn');
  });

  it('rejects filename without extension', async () => {
    const res = await fetchApp('/stage/api/images/events/12345678-1234-1234-1234-123456789abc');
    expect(res.status).toBe(400);
  });

  it('accepts valid prefix and UUID filename', async () => {
    // This will return 404 or 503 (no R2 in test) but NOT 400
    const res = await fetchApp('/stage/api/images/events/12345678-1234-1234-1234-123456789abc.png');
    expect(res.status).not.toBe(400);
  });
});

describe('Security: Rate limiting on auth/login', () => {
  it('allows requests within limit', async () => {
    // Clean up any existing rate limits
    await env.DB.prepare("DELETE FROM rate_limits WHERE key LIKE 'auth_login%'").run();

    const res = await fetchApp('/stage/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ratelimit-test@example.com', name: 'Test' }),
    });
    // Should not be rate limited (first request)
    expect(res.status).not.toBe(429);
  });

  it('blocks request #11 with 429', async () => {
    // Clean and seed rate_limits with count=10 (at limit)
    const key = 'auth_login:unknown';
    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare(
      'INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 10) ON CONFLICT(key) DO UPDATE SET window_start = ?, count = 10',
    )
      .bind(key, now, now)
      .run();

    const res = await fetchApp('/stage/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'blocked@example.com', name: 'Blocked' }),
    });

    expect(res.status).toBe(429);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain('För många förfrågningar');
    expect(res.headers.get('Retry-After')).toBeDefined();
  });
});

describe('Security: Rate limiting on RSVP respond', () => {
  it('blocks after 5 requests per token', async () => {
    const token = 'rsvp-rate-test-token';
    const key = `rsvp_respond:${token}`;
    const now = Math.floor(Date.now() / 1000);

    // Seed rate_limits at limit
    await env.DB.prepare(
      'INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 5) ON CONFLICT(key) DO UPDATE SET window_start = ?, count = 5',
    )
      .bind(key, now, now)
      .run();

    const res = await fetchApp(`/stage/api/rsvp/${token}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'attending' }),
    });

    expect(res.status).toBe(429);
  });
});
