import {
  env,
  createExecutionContext,
  waitOnExecutionContext,
} from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import app from "../index";

const EVENTS_SQL = `CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, emoji TEXT, slug TEXT NOT NULL UNIQUE, date TEXT NOT NULL, time TEXT NOT NULL, end_date TEXT, end_time TEXT, location TEXT NOT NULL, description TEXT, organizer TEXT NOT NULL, organizer_email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'planning', type TEXT NOT NULL DEFAULT 'other', max_participants INTEGER, overbooking_limit INTEGER NOT NULL DEFAULT 0, visibility TEXT NOT NULL DEFAULT 'private', sender_mailbox TEXT, gdpr_consent_text TEXT, image_url TEXT, created_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), deleted_at TEXT);`;

const PARTICIPANTS_SQL = `CREATE TABLE IF NOT EXISTS participants (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, company TEXT, category TEXT NOT NULL DEFAULT 'other', status TEXT NOT NULL DEFAULT 'invited', queue_position INTEGER, response_deadline TEXT, cancellation_token TEXT NOT NULL UNIQUE, email_status TEXT, gdpr_consent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE);`;

beforeAll(async () => {
  await env.DB.exec(EVENTS_SQL);
  await env.DB.exec(PARTICIPANTS_SQL);
});

async function request(
  method: string,
  path: string,
  body?: unknown
): Promise<Response> {
  const req = new Request(`http://localhost${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
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
});
