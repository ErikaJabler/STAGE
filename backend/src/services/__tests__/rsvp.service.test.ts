import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { RsvpService } from "../rsvp.service";
import { EventService } from "../event.service";
import { ParticipantService } from "../participant.service";

const EVENTS_SQL = `CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, emoji TEXT, slug TEXT NOT NULL UNIQUE, date TEXT NOT NULL, time TEXT NOT NULL, end_date TEXT, end_time TEXT, location TEXT NOT NULL, description TEXT, organizer TEXT NOT NULL, organizer_email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'planning', type TEXT NOT NULL DEFAULT 'other', max_participants INTEGER, overbooking_limit INTEGER NOT NULL DEFAULT 0, visibility TEXT NOT NULL DEFAULT 'private', sender_mailbox TEXT, gdpr_consent_text TEXT, image_url TEXT, website_template TEXT, website_data TEXT, website_published INTEGER NOT NULL DEFAULT 0, created_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), deleted_at TEXT);`;

const PARTICIPANTS_SQL = `CREATE TABLE IF NOT EXISTS participants (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, company TEXT, category TEXT NOT NULL DEFAULT 'other', status TEXT NOT NULL DEFAULT 'invited', queue_position INTEGER, response_deadline TEXT, dietary_notes TEXT, plus_one_name TEXT, plus_one_email TEXT, cancellation_token TEXT NOT NULL UNIQUE, email_status TEXT, gdpr_consent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE);`;

beforeAll(async () => {
  await env.DB.exec(EVENTS_SQL);
  await env.DB.exec(PARTICIPANTS_SQL);
});

const ts = () => Date.now() + Math.random().toString(36).slice(2, 6);

async function createTestEvent(maxParticipants?: number): Promise<number> {
  const event = await EventService.create(env.DB, {
    name: `RSVP Test ${ts()}`,
    slug: `rsvp-${ts()}`,
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

async function addParticipant(
  eventId: number,
  overrides: { name?: string; email?: string; status?: "invited" | "attending" | "declined" | "waitlisted" | "cancelled" } = {}
): Promise<{ id: number; token: string }> {
  const t = ts();
  const p = await ParticipantService.create(env.DB, eventId, {
    name: overrides.name ?? `Person ${t}`,
    email: overrides.email ?? `p-${t}@test.se`,
    status: overrides.status ?? "invited",
  });
  return { id: p.id, token: p.cancellation_token };
}

describe("RsvpService", () => {
  describe("getByToken", () => {
    it("returns participant + event for valid token", async () => {
      const eventId = await createTestEvent();
      const { token } = await addParticipant(eventId);

      const result = await RsvpService.getByToken(env.DB, token);

      expect(result).not.toBeNull();
      expect(result!.participant.cancellation_token).toBe(token);
      expect(result!.event.id).toBe(eventId);
    });

    it("returns null for invalid token", async () => {
      const result = await RsvpService.getByToken(env.DB, "nonexistent-token");
      expect(result).toBeNull();
    });
  });

  describe("respond", () => {
    it("sets status to attending", async () => {
      const eventId = await createTestEvent();
      const { token } = await addParticipant(eventId);

      const result = await RsvpService.respond(env.DB, token, "attending");

      expect(result.ok).toBe(true);
      expect(result.status).toBe("attending");
    });

    it("sets status to declined", async () => {
      const eventId = await createTestEvent();
      const { token } = await addParticipant(eventId);

      const result = await RsvpService.respond(env.DB, token, "declined");

      expect(result.ok).toBe(true);
      expect(result.status).toBe("declined");
    });

    it("saves dietary_notes and plus_one fields", async () => {
      const eventId = await createTestEvent();
      const { token, id } = await addParticipant(eventId);

      await RsvpService.respond(env.DB, token, "attending", {
        dietary_notes: "Vegetarian",
        plus_one_name: "Lisa Svensson",
        plus_one_email: "lisa@test.se",
      });

      const p = await ParticipantService.getById(env.DB, id);
      expect(p?.dietary_notes).toBe("Vegetarian");
      expect(p?.plus_one_name).toBe("Lisa Svensson");
      expect(p?.plus_one_email).toBe("lisa@test.se");
    });

    it("auto-waitlists when event is at capacity", async () => {
      const eventId = await createTestEvent(1);
      // First person attending fills the event
      await addParticipant(eventId, { status: "attending" });

      // Second person tries to attend
      const { token } = await addParticipant(eventId);
      const result = await RsvpService.respond(env.DB, token, "attending");

      expect(result.ok).toBe(true);
      expect(result.status).toBe("waitlisted");
      expect(result.waitlisted).toBe(true);
    });

    it("returns error for invalid token", async () => {
      const result = await RsvpService.respond(env.DB, "bad-token", "attending");

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Ogiltig eller utgången länk");
    });
  });

  describe("cancel", () => {
    it("cancels an attending participant", async () => {
      const eventId = await createTestEvent();
      const { token } = await addParticipant(eventId, { status: "attending" });

      const result = await RsvpService.cancel(env.DB, token);

      expect(result.ok).toBe(true);
      expect(result.status).toBe("cancelled");
    });

    it("promotes next waitlisted when attending cancels", async () => {
      const eventId = await createTestEvent(1);
      // Fill the event
      const { token: attendingToken } = await addParticipant(eventId, {
        status: "attending",
      });

      // Waitlist someone via RSVP
      const { token: waitToken, id: waitId } = await addParticipant(eventId);
      await RsvpService.respond(env.DB, waitToken, "attending");

      // Verify waitlisted
      const before = await ParticipantService.getById(env.DB, waitId);
      expect(before?.status).toBe("waitlisted");

      // Cancel the attending person
      await RsvpService.cancel(env.DB, attendingToken);

      // Waitlisted person should now be attending
      const after = await ParticipantService.getById(env.DB, waitId);
      expect(after?.status).toBe("attending");
    });

    it("returns error for invalid token", async () => {
      const result = await RsvpService.cancel(env.DB, "bad-token");

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Ogiltig eller utgången länk");
    });
  });
});
