import {
  env,
  createExecutionContext,
  waitOnExecutionContext,
} from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import app from "../index";

const EVENTS_SQL = `CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, emoji TEXT, slug TEXT NOT NULL UNIQUE, date TEXT NOT NULL, time TEXT NOT NULL, end_date TEXT, end_time TEXT, location TEXT NOT NULL, description TEXT, organizer TEXT NOT NULL, organizer_email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'planning', type TEXT NOT NULL DEFAULT 'other', max_participants INTEGER, overbooking_limit INTEGER NOT NULL DEFAULT 0, visibility TEXT NOT NULL DEFAULT 'private', sender_mailbox TEXT, gdpr_consent_text TEXT, image_url TEXT, created_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), deleted_at TEXT);`;

const PARTICIPANTS_SQL = `CREATE TABLE IF NOT EXISTS participants (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, company TEXT, category TEXT NOT NULL DEFAULT 'other', status TEXT NOT NULL DEFAULT 'invited', queue_position INTEGER, response_deadline TEXT, cancellation_token TEXT NOT NULL UNIQUE, email_status TEXT, gdpr_consent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE);`;

const MAILINGS_SQL = `CREATE TABLE IF NOT EXISTS mailings (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, recipient_filter TEXT NOT NULL DEFAULT 'all', status TEXT NOT NULL DEFAULT 'draft', sent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE);`;

beforeAll(async () => {
  await env.DB.exec(EVENTS_SQL);
  await env.DB.exec(PARTICIPANTS_SQL);
  await env.DB.exec(MAILINGS_SQL);
});

async function request(
  method: string,
  path: string,
  body?: unknown
): Promise<Response> {
  const req = new Request(`http://localhost/stage${path}`, {
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
    name: `Mailing Test ${Date.now()}`,
    date: "2026-09-01",
    time: "14:00",
    location: "Malmö",
    organizer: "Test",
    organizer_email: "test@consid.se",
    slug: `mailing-test-${Date.now()}`,
  });
  const event = (await res.json()) as { id: number };
  return event.id;
}

describe("Mailings CRUD API", () => {
  it("POST /api/events/:id/mailings creates a mailing and returns 201", async () => {
    const eventId = await createTestEvent();

    const res = await request("POST", `/api/events/${eventId}/mailings`, {
      subject: "Välkommen!",
      body: "Hej, välkommen till eventet.",
      recipient_filter: "all",
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
    expect(mailing.subject).toBe("Välkommen!");
    expect(mailing.body).toBe("Hej, välkommen till eventet.");
    expect(mailing.status).toBe("draft");
    expect(mailing.recipient_filter).toBe("all");
  });

  it("GET /api/events/:id/mailings lists mailings for an event", async () => {
    const eventId = await createTestEvent();

    // Create two mailings
    await request("POST", `/api/events/${eventId}/mailings`, {
      subject: "Utskick A",
      body: "Brödtext A",
    });
    await request("POST", `/api/events/${eventId}/mailings`, {
      subject: "Utskick B",
      body: "Brödtext B",
    });

    const res = await request("GET", `/api/events/${eventId}/mailings`);
    expect(res.status).toBe(200);

    const mailings = (await res.json()) as { subject: string }[];
    expect(mailings.length).toBe(2);
  });

  it("POST /api/events/:id/mailings returns 400 for missing subject", async () => {
    const eventId = await createTestEvent();

    const res = await request("POST", `/api/events/${eventId}/mailings`, {
      subject: "",
      body: "Lite text",
    });
    expect(res.status).toBe(400);

    const body = (await res.json()) as { error: string; details: string[] };
    expect(body.error).toBe("Valideringsfel");
    expect(body.details).toContain("subject krävs");
  });
});

describe("RSVP API", () => {
  it("POST /api/rsvp/:token/respond updates participant status to attending", async () => {
    const eventId = await createTestEvent();

    // Create a participant
    const createRes = await request("POST", `/api/events/${eventId}/participants`, {
      name: "RSVP Test",
      email: "rsvp@consid.se",
    });
    const participant = (await createRes.json()) as {
      cancellation_token: string;
      status: string;
    };
    expect(participant.status).toBe("invited");

    // Respond attending
    const res = await request("POST", `/api/rsvp/${participant.cancellation_token}/respond`, {
      status: "attending",
    });
    expect(res.status).toBe(200);

    const body = (await res.json()) as { ok: boolean; status: string; name: string };
    expect(body.ok).toBe(true);
    expect(body.status).toBe("attending");
    expect(body.name).toBe("RSVP Test");
  });

  it("POST /api/rsvp/:token/cancel cancels participant attendance", async () => {
    const eventId = await createTestEvent();

    // Create a participant and set to attending
    const createRes = await request("POST", `/api/events/${eventId}/participants`, {
      name: "Cancel Test",
      email: "cancel@consid.se",
      status: "attending",
    });
    const participant = (await createRes.json()) as {
      cancellation_token: string;
    };

    // Cancel
    const res = await request("POST", `/api/rsvp/${participant.cancellation_token}/cancel`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { ok: boolean; status: string; name: string };
    expect(body.ok).toBe(true);
    expect(body.status).toBe("cancelled");
    expect(body.name).toBe("Cancel Test");
  });

  it("GET /api/rsvp/:token returns participant and event info", async () => {
    const eventId = await createTestEvent();

    const createRes = await request("POST", `/api/events/${eventId}/participants`, {
      name: "Info Test",
      email: "info@consid.se",
    });
    const participant = (await createRes.json()) as {
      cancellation_token: string;
    };

    const res = await request("GET", `/api/rsvp/${participant.cancellation_token}`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      participant: { name: string; email: string; status: string };
      event: { name: string; location: string };
    };
    expect(body.participant.name).toBe("Info Test");
    expect(body.participant.email).toBe("info@consid.se");
    expect(body.event.location).toBe("Malmö");
  });

  it("GET /api/rsvp/invalid-token returns 404", async () => {
    const res = await request("GET", "/api/rsvp/invalid-token-xxx");
    expect(res.status).toBe(404);
  });
});
