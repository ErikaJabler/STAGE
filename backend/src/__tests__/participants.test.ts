import {
  env,
  createExecutionContext,
  waitOnExecutionContext,
} from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import app from "../index";

const EVENTS_SQL = `CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, emoji TEXT, slug TEXT NOT NULL UNIQUE, date TEXT NOT NULL, time TEXT NOT NULL, end_date TEXT, end_time TEXT, location TEXT NOT NULL, description TEXT, organizer TEXT NOT NULL, organizer_email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'planning', type TEXT NOT NULL DEFAULT 'other', max_participants INTEGER, overbooking_limit INTEGER NOT NULL DEFAULT 0, visibility TEXT NOT NULL DEFAULT 'private', sender_mailbox TEXT, gdpr_consent_text TEXT, image_url TEXT, created_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), deleted_at TEXT);`;

const PARTICIPANTS_SQL = `CREATE TABLE IF NOT EXISTS participants (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, company TEXT, category TEXT NOT NULL DEFAULT 'other', status TEXT NOT NULL DEFAULT 'invited', queue_position INTEGER, response_deadline TEXT, cancellation_token TEXT NOT NULL UNIQUE, email_status TEXT, gdpr_consent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE);`;

const USERS_SQL = `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, token TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')));`;

const PERMISSIONS_SQL = `CREATE TABLE IF NOT EXISTS event_permissions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, event_id INTEGER NOT NULL, role TEXT NOT NULL DEFAULT 'viewer', created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE, UNIQUE(user_id, event_id));`;

const TEST_TOKEN = "test-auth-token-participants";

beforeAll(async () => {
  await env.DB.exec(EVENTS_SQL);
  await env.DB.exec(PARTICIPANTS_SQL);
  await env.DB.exec(USERS_SQL);
  await env.DB.exec(PERMISSIONS_SQL);
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

async function createTestEvent(): Promise<number> {
  const res = await request("POST", "/api/events", {
    name: `Participant Test ${Date.now()}`,
    date: "2026-09-01",
    time: "14:00",
    location: "Göteborg",
    organizer: "Test",
    organizer_email: "test@consid.se",
    slug: `participant-test-${Date.now()}`,
  });
  const event = (await res.json()) as { id: number };
  return event.id;
}

describe("Participants CRUD API", () => {
  it("POST /api/events/:id/participants creates a participant and returns 201", async () => {
    const eventId = await createTestEvent();

    const res = await request("POST", `/api/events/${eventId}/participants`, {
      name: "Anna Svensson",
      email: "anna@consid.se",
      company: "Consid AB",
      category: "internal",
    });
    expect(res.status).toBe(201);

    const participant = (await res.json()) as {
      id: number;
      name: string;
      email: string;
      company: string;
      category: string;
      status: string;
      cancellation_token: string;
    };
    expect(participant.id).toBeGreaterThan(0);
    expect(participant.name).toBe("Anna Svensson");
    expect(participant.email).toBe("anna@consid.se");
    expect(participant.company).toBe("Consid AB");
    expect(participant.category).toBe("internal");
    expect(participant.status).toBe("invited");
    expect(participant.cancellation_token).toBeTruthy();
  });

  it("GET /api/events/:id/participants lists participants for an event", async () => {
    const eventId = await createTestEvent();

    // Add two participants
    await request("POST", `/api/events/${eventId}/participants`, {
      name: "Person A",
      email: "a@consid.se",
    });
    await request("POST", `/api/events/${eventId}/participants`, {
      name: "Person B",
      email: "b@consid.se",
    });

    const res = await request("GET", `/api/events/${eventId}/participants`);
    expect(res.status).toBe(200);

    const participants = (await res.json()) as { name: string }[];
    expect(participants.length).toBe(2);
    expect(participants[0].name).toBe("Person A");
    expect(participants[1].name).toBe("Person B");
  });

  it("POST /api/events/:id/participants returns 400 for invalid data", async () => {
    const eventId = await createTestEvent();

    const res = await request("POST", `/api/events/${eventId}/participants`, {
      name: "",
      email: "invalid-email",
    });
    expect(res.status).toBe(400);

    const body = (await res.json()) as { error: string; details: string[] };
    expect(body.error).toBe("Valideringsfel");
    expect(body.details.length).toBeGreaterThan(0);
  });

  it("DELETE /api/events/:id/participants/:id removes a participant", async () => {
    const eventId = await createTestEvent();

    // Create participant
    const createRes = await request("POST", `/api/events/${eventId}/participants`, {
      name: "To Delete",
      email: "delete@consid.se",
    });
    const created = (await createRes.json()) as { id: number };

    // Delete
    const res = await request("DELETE", `/api/events/${eventId}/participants/${created.id}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);

    // Verify gone from list
    const listRes = await request("GET", `/api/events/${eventId}/participants`);
    const list = (await listRes.json()) as { id: number }[];
    expect(list.find((p) => p.id === created.id)).toBeUndefined();
  });

  it("POST /api/events/:id/participants/import imports CSV with headers", async () => {
    const eventId = await createTestEvent();

    const csv = `namn,email,företag,kategori
Anna Import,anna-import-${Date.now()}@test.se,Consid,intern
Erik Import,erik-import-${Date.now()}@test.se,IKEA,partner
Lisa Import,lisa-import-${Date.now()}@test.se,,`;

    const formData = new FormData();
    formData.append("file", new File([csv], "test.csv", { type: "text/csv" }));

    const req = new Request(`http://localhost/stage/api/events/${eventId}/participants/import`, {
      method: "POST",
      headers: { "X-Auth-Token": TEST_TOKEN },
      body: formData,
    });
    const ctx = createExecutionContext();
    const res = await app.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const result = (await res.json()) as {
      imported: number;
      skipped: number;
      total: number;
      errors: { row: number; reason: string }[];
    };
    expect(result.imported).toBe(3);
    expect(result.skipped).toBe(0);

    // Verify participants exist
    const listRes = await request("GET", `/api/events/${eventId}/participants`);
    const participants = (await listRes.json()) as { name: string; email: string }[];
    expect(participants.length).toBe(3);
  });

  it("GET /api/events/:id/participants/export returns CSV with header and data", async () => {
    const eventId = await createTestEvent();

    // Add participants
    await request("POST", `/api/events/${eventId}/participants`, {
      name: "Export Test",
      email: `export-${Date.now()}@test.se`,
      company: "Consid AB",
      category: "internal",
    });

    const res = await request("GET", `/api/events/${eventId}/participants/export`);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    expect(res.headers.get("Content-Disposition")).toContain("deltagare-event-");

    const csv = await res.text();
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Namn,E-post,Företag,Kategori,Status");
    expect(lines.length).toBeGreaterThanOrEqual(2);
    expect(lines[1]).toContain("Export Test");
    expect(lines[1]).toContain("Consid AB");
  });

  it("POST /api/events/:id/participants/import skips duplicates and invalid emails", async () => {
    const eventId = await createTestEvent();

    const ts = Date.now();
    // Add existing participant
    await request("POST", `/api/events/${eventId}/participants`, {
      name: "Existing",
      email: `existing-${ts}@test.se`,
    });

    const csv = `name,email,company
Valid New,valid-${ts}@test.se,Test
Existing,existing-${ts}@test.se,Test
Bad Email,not-an-email,Test
No Email,,Test
Duplicate,valid-${ts}@test.se,Test`;

    const formData = new FormData();
    formData.append("file", new File([csv], "test.csv", { type: "text/csv" }));

    const req = new Request(`http://localhost/stage/api/events/${eventId}/participants/import`, {
      method: "POST",
      headers: { "X-Auth-Token": TEST_TOKEN },
      body: formData,
    });
    const ctx = createExecutionContext();
    const res = await app.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const result = (await res.json()) as {
      imported: number;
      skipped: number;
      errors: { row: number; reason: string }[];
    };
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(4);
    expect(result.errors.length).toBe(4);
  });
});
