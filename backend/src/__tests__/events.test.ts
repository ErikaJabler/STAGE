import {
  env,
  createExecutionContext,
  waitOnExecutionContext,
} from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import app from "../index";

const EVENTS_SQL = `CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, emoji TEXT, slug TEXT NOT NULL UNIQUE, date TEXT NOT NULL, time TEXT NOT NULL, end_date TEXT, end_time TEXT, location TEXT NOT NULL, description TEXT, organizer TEXT NOT NULL, organizer_email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'planning', type TEXT NOT NULL DEFAULT 'other', max_participants INTEGER, overbooking_limit INTEGER NOT NULL DEFAULT 0, visibility TEXT NOT NULL DEFAULT 'private', sender_mailbox TEXT, gdpr_consent_text TEXT, image_url TEXT, created_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), deleted_at TEXT);`;

const PARTICIPANTS_SQL = `CREATE TABLE IF NOT EXISTS participants (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, company TEXT, category TEXT NOT NULL DEFAULT 'other', status TEXT NOT NULL DEFAULT 'invited', queue_position INTEGER, response_deadline TEXT, dietary_notes TEXT, plus_one_name TEXT, plus_one_email TEXT, cancellation_token TEXT NOT NULL UNIQUE, email_status TEXT, gdpr_consent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE);`;

const USERS_SQL = `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, token TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')));`;

const PERMISSIONS_SQL = `CREATE TABLE IF NOT EXISTS event_permissions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, event_id INTEGER NOT NULL, role TEXT NOT NULL DEFAULT 'viewer', created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE, UNIQUE(user_id, event_id));`;

const ACTIVITIES_SQL = `CREATE TABLE IF NOT EXISTS activities (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL REFERENCES events(id), type TEXT NOT NULL, description TEXT NOT NULL, metadata TEXT, created_by TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));`;

const EMAIL_QUEUE_SQL = `CREATE TABLE IF NOT EXISTS email_queue (id INTEGER PRIMARY KEY AUTOINCREMENT, mailing_id INTEGER NOT NULL REFERENCES mailings(id), event_id INTEGER NOT NULL REFERENCES events(id), to_email TEXT NOT NULL, to_name TEXT NOT NULL, subject TEXT NOT NULL, html TEXT NOT NULL, plain_text TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', error TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), sent_at TEXT);`;

const TEST_TOKEN = "test-auth-token-events";

beforeAll(async () => {
  await env.DB.exec(EVENTS_SQL);
  await env.DB.exec(PARTICIPANTS_SQL);
  await env.DB.exec(USERS_SQL);
  await env.DB.exec(PERMISSIONS_SQL);
  await env.DB.exec(ACTIVITIES_SQL);
  await env.DB.exec(`INSERT OR IGNORE INTO users (email, name, token) VALUES ('test@consid.se', 'Test User', '${TEST_TOKEN}')`);
});

async function request(
  method: string,
  path: string,
  body?: unknown
): Promise<Response> {
  const headers: Record<string, string> = { "X-Auth-Token": TEST_TOKEN };
  if (body) headers["Content-Type"] = "application/json";
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

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    name: `Event ${Date.now()}`,
    date: "2026-06-15",
    time: "10:00",
    location: "Stockholm",
    organizer: "Test User",
    organizer_email: "test@consid.se",
    ...overrides,
  };
}

describe("Events CRUD API", () => {
  it("GET /api/events returns 200 with array", async () => {
    const res = await request("GET", "/api/events");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("POST /api/events creates an event and returns 201", async () => {
    const payload = makeEvent({ name: "Test Create Event", slug: "test-create-event" });
    const res = await request("POST", "/api/events", payload);
    expect(res.status).toBe(201);

    const event = (await res.json()) as {
      id: number;
      name: string;
      slug: string;
      status: string;
      participant_count?: number;
    };
    expect(event.id).toBeGreaterThan(0);
    expect(event.name).toBe("Test Create Event");
    expect(event.slug).toBe("test-create-event");
    expect(event.status).toBe("planning");
  });

  it("POST /api/events returns 400 when required fields are missing", async () => {
    const res = await request("POST", "/api/events", { name: "Missing fields" });
    expect(res.status).toBe(400);

    const body = (await res.json()) as { error: string; details: string[] };
    expect(body.error).toBe("Valideringsfel");
    expect(body.details.length).toBeGreaterThan(0);
  });

  it("POST /api/events returns 400 for invalid date format", async () => {
    const payload = makeEvent({ date: "15-06-2026" });
    const res = await request("POST", "/api/events", payload);
    expect(res.status).toBe(400);

    const body = (await res.json()) as { details: string[] };
    expect(body.details).toContain("date måste vara YYYY-MM-DD");
  });

  it("GET /api/events/:id returns a created event", async () => {
    // Create first
    const createRes = await request("POST", "/api/events", makeEvent({ name: "Get Single", slug: "get-single" }));
    const created = (await createRes.json()) as { id: number };

    // Then get
    const res = await request("GET", `/api/events/${created.id}`);
    expect(res.status).toBe(200);

    const event = (await res.json()) as { id: number; name: string; participant_count: number };
    expect(event.id).toBe(created.id);
    expect(event.name).toBe("Get Single");
    expect(event.participant_count).toBe(0);
  });

  it("GET /api/events/:id returns 403 for event without permission", async () => {
    // Create event with a different user
    await env.DB.exec(`INSERT OR IGNORE INTO users (email, name, token) VALUES ('other@consid.se', 'Other', 'other-token')`);
    const otherRes = await (async () => {
      const headers: Record<string, string> = { "X-Auth-Token": "other-token", "Content-Type": "application/json" };
      const req = new Request(`http://localhost/stage/api/events`, {
        method: "POST",
        headers,
        body: JSON.stringify(makeEvent({ name: "Other Event", slug: `other-event-${Date.now()}` })),
      });
      const ctx = createExecutionContext();
      const res = await app.fetch(req, env, ctx);
      await waitOnExecutionContext(ctx);
      return res;
    })();
    const otherEvent = (await otherRes.json()) as { id: number };

    // Try to access with test user (no permission)
    const res = await request("GET", `/api/events/${otherEvent.id}`);
    expect(res.status).toBe(403);
  });

  it("PUT /api/events/:id updates an event", async () => {
    // Create first
    const createRes = await request("POST", "/api/events", makeEvent({ name: "To Update", slug: "to-update" }));
    const created = (await createRes.json()) as { id: number };

    // Then update
    const res = await request("PUT", `/api/events/${created.id}`, {
      name: "Updated Name",
      status: "upcoming",
    });
    expect(res.status).toBe(200);

    const event = (await res.json()) as { name: string; status: string };
    expect(event.name).toBe("Updated Name");
    expect(event.status).toBe("upcoming");
  });

  it("DELETE /api/events/:id soft-deletes an event", async () => {
    // Create first
    const createRes = await request("POST", "/api/events", makeEvent({ name: "To Delete", slug: "to-delete" }));
    const created = (await createRes.json()) as { id: number };

    // Delete
    const res = await request("DELETE", `/api/events/${created.id}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it("GET /api/events includes participant_count", async () => {
    const createRes = await request("POST", "/api/events", makeEvent({ name: "With Count", slug: "with-count" }));
    expect(createRes.status).toBe(201);

    const res = await request("GET", "/api/events");
    expect(res.status).toBe(200);
    const events = (await res.json()) as { participant_count: number }[];
    expect(events.length).toBeGreaterThan(0);
    // All should have participant_count field
    for (const event of events) {
      expect(typeof event.participant_count).toBe("number");
    }
  });

  it("returns 401 without auth token", async () => {
    const req = new Request(`http://localhost/stage/api/events`, { method: "GET" });
    const ctx = createExecutionContext();
    const res = await app.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(401);
  });
});
