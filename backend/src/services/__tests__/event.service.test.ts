import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { EventService, generateSlug, generateICS } from "../event.service";
import type { CreateEventInput } from "../../db/queries";

const EVENTS_SQL = `CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, emoji TEXT, slug TEXT NOT NULL UNIQUE, date TEXT NOT NULL, time TEXT NOT NULL, end_date TEXT, end_time TEXT, location TEXT NOT NULL, description TEXT, organizer TEXT NOT NULL, organizer_email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'planning', type TEXT NOT NULL DEFAULT 'other', max_participants INTEGER, overbooking_limit INTEGER NOT NULL DEFAULT 0, visibility TEXT NOT NULL DEFAULT 'private', sender_mailbox TEXT, gdpr_consent_text TEXT, image_url TEXT, website_template TEXT, website_data TEXT, website_published INTEGER NOT NULL DEFAULT 0, created_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), deleted_at TEXT);`;

const PARTICIPANTS_SQL = `CREATE TABLE IF NOT EXISTS participants (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, company TEXT, category TEXT NOT NULL DEFAULT 'other', status TEXT NOT NULL DEFAULT 'invited', queue_position INTEGER, response_deadline TEXT, dietary_notes TEXT, plus_one_name TEXT, plus_one_email TEXT, cancellation_token TEXT NOT NULL UNIQUE, email_status TEXT, gdpr_consent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE);`;

beforeAll(async () => {
  await env.DB.exec(EVENTS_SQL);
  await env.DB.exec(PARTICIPANTS_SQL);
});

function makeEvent(overrides: Partial<CreateEventInput> = {}): CreateEventInput {
  return {
    name: `Service Test ${Date.now()}`,
    slug: `service-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    date: "2026-08-15",
    time: "14:00",
    location: "Malmö",
    organizer: "Test User",
    organizer_email: "test@consid.se",
    created_by: "test@consid.se",
    ...overrides,
  };
}

describe("generateSlug", () => {
  it("converts Swedish characters correctly", () => {
    expect(generateSlug("Årsmöte på Åland")).toBe("arsmote-pa-aland");
  });

  it("handles special characters and spaces", () => {
    expect(generateSlug("Event 2026: Q&A Session!")).toBe("event-2026-q-a-session");
  });

  it("removes leading/trailing hyphens", () => {
    expect(generateSlug("--test--")).toBe("test");
  });
});

describe("generateICS", () => {
  it("generates valid ICS with VTIMEZONE", () => {
    const ics = generateICS({
      id: 1,
      name: "Test Event",
      date: "2026-06-15",
      time: "10:00",
      location: "Stockholm",
      slug: "test",
      emoji: null,
      end_date: null,
      end_time: "12:00",
      description: "En beskrivning",
      organizer: "Test",
      organizer_email: "test@test.se",
      status: "planning" as const,
      type: "internal" as const,
      max_participants: null,
      overbooking_limit: 0,
      visibility: "private" as const,
      sender_mailbox: null,
      gdpr_consent_text: null,
      image_url: null,
      created_by: "test@test.se",
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
      deleted_at: null,
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VTIMEZONE");
    expect(ics).toContain("TZID:Europe/Stockholm");
    expect(ics).toContain("SUMMARY:Test Event");
    expect(ics).toContain("LOCATION:Stockholm");
    expect(ics).toContain("DESCRIPTION:En beskrivning");
    expect(ics).toContain("DTSTART;TZID=Europe/Stockholm:20260615T100000");
    expect(ics).toContain("DTEND;TZID=Europe/Stockholm:20260615T120000");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("defaults to +2 hours if no end_time", () => {
    const ics = generateICS({
      id: 2, name: "No End", date: "2026-06-15", time: "14:00",
      location: "Test", slug: "no-end", emoji: null,
      end_date: null, end_time: null, description: null,
      organizer: "T", organizer_email: "t@t.se",
      status: "planning" as const, type: "other" as const,
      max_participants: null, overbooking_limit: 0,
      visibility: "private" as const, sender_mailbox: null,
      gdpr_consent_text: null, image_url: null,
      created_by: "t@t.se", created_at: "", updated_at: "", deleted_at: null,
    });

    expect(ics).toContain("DTEND;TZID=Europe/Stockholm:20260615T160000");
  });
});

describe("EventService", () => {
  it("creates an event with auto-generated slug", async () => {
    const event = await EventService.create(env.DB, {
      ...makeEvent({ name: "Nytt Årsmöte" }),
      slug: "", // empty → should auto-generate
    });

    expect(event.id).toBeGreaterThan(0);
    expect(event.name).toBe("Nytt Årsmöte");
    expect(event.slug).toBe("nytt-arsmote");
  });

  it("creates an event with defaults", async () => {
    const event = await EventService.create(env.DB, makeEvent({ name: "Default Test" }));

    expect(event.status).toBe("planning");
    expect(event.visibility).toBe("private");
    expect(event.overbooking_limit).toBe(0);
  });

  it("soft-deletes an event and hides from list", async () => {
    const event = await EventService.create(env.DB, makeEvent({ name: "To Delete" }));

    const deleted = await EventService.softDelete(env.DB, event.id);
    expect(deleted).toBe(true);

    const found = await EventService.getById(env.DB, event.id);
    expect(found).toBeNull();
  });

  it("updates an event partially", async () => {
    const event = await EventService.create(env.DB, makeEvent({ name: "Original Name" }));

    const updated = await EventService.update(env.DB, event.id, {
      name: "Updated Name",
      status: "upcoming",
    });

    expect(updated?.name).toBe("Updated Name");
    expect(updated?.status).toBe("upcoming");
    expect(updated?.location).toBe("Malmö"); // unchanged
  });

  it("returns null when updating non-existent event", async () => {
    const result = await EventService.update(env.DB, 99999, { name: "Ghost" });
    expect(result).toBeNull();
  });
});
