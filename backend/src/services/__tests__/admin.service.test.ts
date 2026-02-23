import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { AdminService } from "../admin.service";
import { PermissionService } from "../permission.service";
import { createUser, isAdminUser } from "../../db/user.queries";

const EVENTS_SQL = `CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, emoji TEXT, slug TEXT NOT NULL UNIQUE, date TEXT NOT NULL, time TEXT NOT NULL, end_date TEXT, end_time TEXT, location TEXT NOT NULL, description TEXT, organizer TEXT NOT NULL, organizer_email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'planning', type TEXT NOT NULL DEFAULT 'other', max_participants INTEGER, overbooking_limit INTEGER NOT NULL DEFAULT 0, visibility TEXT NOT NULL DEFAULT 'private', sender_mailbox TEXT, gdpr_consent_text TEXT, image_url TEXT, website_template TEXT, website_data TEXT, website_published INTEGER NOT NULL DEFAULT 0, created_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), deleted_at TEXT);`;

const PARTICIPANTS_SQL = `CREATE TABLE IF NOT EXISTS participants (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, company TEXT, category TEXT NOT NULL DEFAULT 'other', status TEXT NOT NULL DEFAULT 'invited', queue_position INTEGER, response_deadline TEXT, dietary_notes TEXT, plus_one_name TEXT, plus_one_email TEXT, cancellation_token TEXT NOT NULL UNIQUE, email_status TEXT, gdpr_consent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE);`;

const MAILINGS_SQL = `CREATE TABLE IF NOT EXISTS mailings (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, html_body TEXT, editor_data TEXT, recipient_filter TEXT NOT NULL DEFAULT 'all', status TEXT NOT NULL DEFAULT 'draft', sent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE);`;

const USERS_SQL = `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, token TEXT NOT NULL UNIQUE, is_admin INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')));`;

const PERMISSIONS_SQL = `CREATE TABLE IF NOT EXISTS event_permissions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, event_id INTEGER NOT NULL, role TEXT NOT NULL DEFAULT 'viewer', created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE, UNIQUE(user_id, event_id));`;

describe("AdminService", () => {
  beforeAll(async () => {
    await env.DB.exec(EVENTS_SQL);
    await env.DB.exec(PARTICIPANTS_SQL);
    await env.DB.exec(MAILINGS_SQL);
    await env.DB.exec(USERS_SQL);
    await env.DB.exec(PERMISSIONS_SQL);

    // Create test data: 2 events, 1 past + 1 future
    const today = new Date();
    const pastDate = new Date(today.getFullYear() - 1, 0, 15).toISOString().split("T")[0];
    const futureDate = new Date(today.getFullYear() + 1, 5, 15).toISOString().split("T")[0];

    await env.DB.exec(`INSERT INTO events (name, slug, date, time, location, organizer, organizer_email, created_by) VALUES ('Past Event', 'past-event', '${pastDate}', '10:00', 'Stockholm', 'Test', 'test@consid.se', 'test@consid.se');`);
    await env.DB.exec(`INSERT INTO events (name, slug, date, time, location, organizer, organizer_email, created_by) VALUES ('Future Event', 'future-event', '${futureDate}', '18:00', 'Göteborg', 'Test', 'test@consid.se', 'test@consid.se');`);

    // Add participants
    await env.DB.exec(`INSERT INTO participants (event_id, name, email, category, cancellation_token) VALUES (1, 'P1', 'p1@test.se', 'internal', 'token-admin-p1');`);
    await env.DB.exec(`INSERT INTO participants (event_id, name, email, category, cancellation_token) VALUES (1, 'P2', 'p2@test.se', 'public_sector', 'token-admin-p2');`);
    await env.DB.exec(`INSERT INTO participants (event_id, name, email, category, cancellation_token) VALUES (2, 'P3', 'p3@test.se', 'internal', 'token-admin-p3');`);

    // Add a mailing
    await env.DB.exec(`INSERT INTO mailings (event_id, subject, body, status) VALUES (1, 'Testutskick', 'Hej alla', 'sent');`);
  });

  it("listAllEvents returns all non-deleted events", async () => {
    const events = await AdminService.listAllEvents(env.DB);
    expect(events.length).toBe(2);
    expect(events[0].name).toBe("Past Event");
    expect(events[1].name).toBe("Future Event");
  });

  it("getDashboardData returns correct aggregates", async () => {
    const data = await AdminService.getDashboardData(env.DB);
    expect(data.total_events).toBe(2);
    expect(data.active_events).toBe(1);
    expect(data.historical_events).toBe(1);
    expect(data.total_participants).toBe(3);
    expect(data.participants_by_category.internal).toBe(2);
    expect(data.participants_by_category.public_sector).toBe(1);
    expect(data.upcoming_events.length).toBe(1);
    expect(data.upcoming_events[0].name).toBe("Future Event");
    expect(data.recent_mailings.length).toBe(1);
    expect(data.recent_mailings[0].subject).toBe("Testutskick");
  });

  it("checkConflicts detects same date + location", async () => {
    const today = new Date();
    const futureDate = new Date(today.getFullYear() + 1, 5, 15).toISOString().split("T")[0];

    const conflicts = await AdminService.checkConflicts(env.DB, futureDate, "Göteborg");
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].name).toBe("Future Event");
  });

  it("checkConflicts returns empty for different location", async () => {
    const today = new Date();
    const futureDate = new Date(today.getFullYear() + 1, 5, 15).toISOString().split("T")[0];

    const conflicts = await AdminService.checkConflicts(env.DB, futureDate, "Malmö");
    expect(conflicts.length).toBe(0);
  });

  it("checkConflicts excludes event by ID", async () => {
    const today = new Date();
    const futureDate = new Date(today.getFullYear() + 1, 5, 15).toISOString().split("T")[0];

    const conflicts = await AdminService.checkConflicts(env.DB, futureDate, "Göteborg", 2);
    expect(conflicts.length).toBe(0);
  });

  it("isAdminUser returns false for regular user", async () => {
    const user = await createUser(env.DB, "regular@consid.se", "Regular User", "token-regular-admin-test");
    const isAdmin = await isAdminUser(env.DB, user.id);
    expect(isAdmin).toBe(false);
  });

  it("isAdminUser returns true after setting is_admin = 1", async () => {
    const user = await createUser(env.DB, "admin@consid.se", "Admin User", "token-admin-admin-test");
    await env.DB.exec(`UPDATE users SET is_admin = 1 WHERE id = ${user.id};`);
    const isAdmin = await isAdminUser(env.DB, user.id);
    expect(isAdmin).toBe(true);
  });

  it("PermissionService.isAdmin delegates correctly", async () => {
    // Regular user
    const user1 = await createUser(env.DB, "perm-regular@consid.se", "Regular", "token-perm-reg");
    expect(await PermissionService.isAdmin(env.DB, user1.id)).toBe(false);

    // Admin user
    const user2 = await createUser(env.DB, "perm-admin@consid.se", "Admin", "token-perm-admin");
    await env.DB.exec(`UPDATE users SET is_admin = 1 WHERE id = ${user2.id};`);
    expect(await PermissionService.isAdmin(env.DB, user2.id)).toBe(true);
  });

  it("admin user canView/canEdit any event without explicit permission", async () => {
    const user = await createUser(env.DB, "admin-view@consid.se", "Admin View", "token-admin-view-test");
    await env.DB.exec(`UPDATE users SET is_admin = 1 WHERE id = ${user.id};`);

    // Admin can view/edit event 1 without any event_permissions record
    expect(await PermissionService.canView(env.DB, user.id, 1)).toBe(true);
    expect(await PermissionService.canEdit(env.DB, user.id, 1)).toBe(true);
  });
});
