import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import {
  ParticipantService,
  parseCSV,
  validateCreateParticipant,
  validateUpdateParticipant,
} from "../participant.service";
import { EventService } from "../event.service";

const EVENTS_SQL = `CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, emoji TEXT, slug TEXT NOT NULL UNIQUE, date TEXT NOT NULL, time TEXT NOT NULL, end_date TEXT, end_time TEXT, location TEXT NOT NULL, description TEXT, organizer TEXT NOT NULL, organizer_email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'planning', type TEXT NOT NULL DEFAULT 'other', max_participants INTEGER, overbooking_limit INTEGER NOT NULL DEFAULT 0, visibility TEXT NOT NULL DEFAULT 'private', sender_mailbox TEXT, gdpr_consent_text TEXT, image_url TEXT, created_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), deleted_at TEXT);`;

const PARTICIPANTS_SQL = `CREATE TABLE IF NOT EXISTS participants (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, company TEXT, category TEXT NOT NULL DEFAULT 'other', status TEXT NOT NULL DEFAULT 'invited', queue_position INTEGER, response_deadline TEXT, cancellation_token TEXT NOT NULL UNIQUE, email_status TEXT, gdpr_consent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE);`;

beforeAll(async () => {
  await env.DB.exec(EVENTS_SQL);
  await env.DB.exec(PARTICIPANTS_SQL);
});

async function createTestEvent(maxParticipants?: number): Promise<number> {
  const event = await EventService.create(env.DB, {
    name: `Participant Test ${Date.now()}`,
    slug: `pt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    date: "2026-09-01",
    time: "14:00",
    location: "Göteborg",
    organizer: "Test",
    organizer_email: "test@consid.se",
    created_by: "test@consid.se",
    max_participants: maxParticipants ?? null,
    overbooking_limit: 0,
  });
  return event.id;
}

describe("parseCSV", () => {
  it("parses CSV with Swedish headers", () => {
    const csv = "namn,email,företag,kategori\nAnna,anna@test.se,Consid,intern\nErik,erik@test.se,IKEA,partner";
    const { rows, parseErrors } = parseCSV(csv);

    expect(rows).toHaveLength(2);
    expect(rows[0].data.name).toBe("Anna");
    expect(rows[0].data.email).toBe("anna@test.se");
    expect(rows[0].data.company).toBe("Consid");
    expect(rows[0].data.category).toBe("internal");
    expect(rows[1].data.category).toBe("partner");
    expect(parseErrors).toHaveLength(0);
  });

  it("parses CSV with semicolon separator", () => {
    const csv = "namn;email;företag\nAnna;anna@test.se;Consid";
    const { rows } = parseCSV(csv);

    expect(rows).toHaveLength(1);
    expect(rows[0].data.name).toBe("Anna");
    expect(rows[0].data.email).toBe("anna@test.se");
  });

  it("falls back to positional parsing when no headers match", () => {
    const csv = "Anna,anna@test.se,Consid";
    const { rows } = parseCSV(csv);

    expect(rows).toHaveLength(1);
    expect(rows[0].data.name).toBe("Anna");
    expect(rows[0].data.email).toBe("anna@test.se");
    expect(rows[0].data.company).toBe("Consid");
  });

  it("handles quoted fields with commas", () => {
    const csv = 'namn,email\n"Svensson, Anna",anna@test.se';
    const { rows } = parseCSV(csv);

    expect(rows).toHaveLength(1);
    expect(rows[0].data.name).toBe("Svensson, Anna");
  });
});

describe("validateCreateParticipant", () => {
  it("returns errors for missing required fields", () => {
    const errors = validateCreateParticipant({ name: "", email: "" });
    expect(errors).toContain("name krävs");
    expect(errors).toContain("email krävs");
  });

  it("validates email format", () => {
    const errors = validateCreateParticipant({ name: "Test", email: "not-an-email" });
    expect(errors).toContain("email måste vara en giltig emailadress");
  });

  it("validates category enum", () => {
    const errors = validateCreateParticipant({ name: "Test", email: "t@t.se", category: "invalid" });
    expect(errors.some((e) => e.includes("category"))).toBe(true);
  });

  it("passes for valid input", () => {
    const errors = validateCreateParticipant({ name: "Anna", email: "anna@test.se", category: "internal" });
    expect(errors).toHaveLength(0);
  });
});

describe("validateUpdateParticipant", () => {
  it("rejects empty name", () => {
    const errors = validateUpdateParticipant({ name: "" });
    expect(errors).toContain("name kan inte vara tomt");
  });

  it("rejects invalid email", () => {
    const errors = validateUpdateParticipant({ email: "bad" });
    expect(errors).toContain("email måste vara en giltig emailadress");
  });
});

describe("ParticipantService", () => {
  it("creates and lists participants", async () => {
    const eventId = await createTestEvent();

    await ParticipantService.create(env.DB, eventId, {
      name: "Test Person",
      email: `test-${Date.now()}@test.se`,
    });

    const list = await ParticipantService.list(env.DB, eventId);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].name).toBe("Test Person");
    expect(list[0].cancellation_token).toBeTruthy();
  });

  it("auto-waitlists when at capacity", async () => {
    const eventId = await createTestEvent(1);
    const ts = Date.now();

    await ParticipantService.create(env.DB, eventId, {
      name: "First",
      email: `first-${ts}@test.se`,
      status: "attending",
    });

    const second = await ParticipantService.create(env.DB, eventId, {
      name: "Second",
      email: `second-${ts}@test.se`,
      status: "attending",
    });

    expect(second.status).toBe("waitlisted");
    expect(second.queue_position).toBe(1);
  });

  it("promotes from waitlist on delete", async () => {
    const eventId = await createTestEvent(1);
    const ts = Date.now();

    const first = await ParticipantService.create(env.DB, eventId, {
      name: "Attending",
      email: `att-del-${ts}@test.se`,
      status: "attending",
    });

    const second = await ParticipantService.create(env.DB, eventId, {
      name: "Waitlisted",
      email: `wl-del-${ts}@test.se`,
      status: "attending",
    });
    expect(second.status).toBe("waitlisted");

    await ParticipantService.delete(env.DB, eventId, first.id);

    const updated = await ParticipantService.getById(env.DB, second.id);
    expect(updated?.status).toBe("attending");
    expect(updated?.queue_position).toBeNull();
  });

  it("imports CSV with duplicate detection", async () => {
    const eventId = await createTestEvent();
    const ts = Date.now();

    // Add existing participant
    await ParticipantService.create(env.DB, eventId, {
      name: "Existing",
      email: `existing-${ts}@test.se`,
    });

    const csv = `namn,email\nNew Person,new-${ts}@test.se\nExisting,existing-${ts}@test.se`;
    const result = await ParticipantService.importCSV(env.DB, eventId, csv);

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.errors.some((e) => e.reason.includes("Finns redan"))).toBe(true);
  });
});
