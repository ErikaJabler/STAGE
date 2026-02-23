import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { PermissionService } from "../permission.service";
import { createUser } from "../../db/user.queries";
import { EventService, generateSlug } from "../event.service";
import type { CreateEventInput } from "../../db/queries";

const EVENTS_SQL = `CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, emoji TEXT, slug TEXT NOT NULL UNIQUE, date TEXT NOT NULL, time TEXT NOT NULL, end_date TEXT, end_time TEXT, location TEXT NOT NULL, description TEXT, organizer TEXT NOT NULL, organizer_email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'planning', type TEXT NOT NULL DEFAULT 'other', max_participants INTEGER, overbooking_limit INTEGER NOT NULL DEFAULT 0, visibility TEXT NOT NULL DEFAULT 'private', sender_mailbox TEXT, gdpr_consent_text TEXT, image_url TEXT, website_template TEXT, website_data TEXT, website_published INTEGER NOT NULL DEFAULT 0, created_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), deleted_at TEXT);`;

const PARTICIPANTS_SQL = `CREATE TABLE IF NOT EXISTS participants (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, company TEXT, category TEXT NOT NULL DEFAULT 'other', status TEXT NOT NULL DEFAULT 'invited', queue_position INTEGER, response_deadline TEXT, dietary_notes TEXT, plus_one_name TEXT, plus_one_email TEXT, cancellation_token TEXT NOT NULL UNIQUE, email_status TEXT, gdpr_consent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE);`;

const USERS_SQL = `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, token TEXT NOT NULL UNIQUE, is_admin INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')));`;

const PERMISSIONS_SQL = `CREATE TABLE IF NOT EXISTS event_permissions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, event_id INTEGER NOT NULL, role TEXT NOT NULL DEFAULT 'viewer', created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE, UNIQUE(user_id, event_id));`;

beforeAll(async () => {
  await env.DB.exec(EVENTS_SQL);
  await env.DB.exec(PARTICIPANTS_SQL);
  await env.DB.exec(USERS_SQL);
  await env.DB.exec(PERMISSIONS_SQL);
});

function makeEvent(overrides: Partial<CreateEventInput> = {}): CreateEventInput {
  const ts = Date.now();
  return {
    name: `Perm Test ${ts}`,
    slug: `perm-test-${ts}-${Math.random().toString(36).slice(2)}`,
    date: "2026-08-15",
    time: "14:00",
    location: "Stockholm",
    organizer: "Test",
    organizer_email: "test@consid.se",
    created_by: "test@consid.se",
    ...overrides,
  };
}

describe("PermissionService", () => {
  it("setOwner grants owner role", async () => {
    const user = await createUser(env.DB, `owner-${Date.now()}@test.se`, "Owner", crypto.randomUUID());
    const event = await EventService.create(env.DB, makeEvent());

    await PermissionService.setOwner(env.DB, user.id, event.id);

    const role = await PermissionService.getRole(env.DB, user.id, event.id);
    expect(role).toBe("owner");
  });

  it("owner can view, edit, and is owner", async () => {
    const user = await createUser(env.DB, `owner2-${Date.now()}@test.se`, "Owner2", crypto.randomUUID());
    const event = await EventService.create(env.DB, makeEvent());
    await PermissionService.setOwner(env.DB, user.id, event.id);

    expect(await PermissionService.canView(env.DB, user.id, event.id)).toBe(true);
    expect(await PermissionService.canEdit(env.DB, user.id, event.id)).toBe(true);
    expect(await PermissionService.isOwner(env.DB, user.id, event.id)).toBe(true);
  });

  it("editor can view and edit but is not owner", async () => {
    const owner = await createUser(env.DB, `editortest-owner-${Date.now()}@test.se`, "Owner", crypto.randomUUID());
    const editor = await createUser(env.DB, `editortest-editor-${Date.now()}@test.se`, "Editor", crypto.randomUUID());
    const event = await EventService.create(env.DB, makeEvent());
    await PermissionService.setOwner(env.DB, owner.id, event.id);
    await PermissionService.addPermission(env.DB, event.id, editor.email, editor.name, "editor");

    expect(await PermissionService.canView(env.DB, editor.id, event.id)).toBe(true);
    expect(await PermissionService.canEdit(env.DB, editor.id, event.id)).toBe(true);
    expect(await PermissionService.isOwner(env.DB, editor.id, event.id)).toBe(false);
  });

  it("viewer can view but not edit", async () => {
    const owner = await createUser(env.DB, `viewertest-owner-${Date.now()}@test.se`, "Owner", crypto.randomUUID());
    const viewer = await createUser(env.DB, `viewertest-viewer-${Date.now()}@test.se`, "Viewer", crypto.randomUUID());
    const event = await EventService.create(env.DB, makeEvent());
    await PermissionService.setOwner(env.DB, owner.id, event.id);
    await PermissionService.addPermission(env.DB, event.id, viewer.email, viewer.name, "viewer");

    expect(await PermissionService.canView(env.DB, viewer.id, event.id)).toBe(true);
    expect(await PermissionService.canEdit(env.DB, viewer.id, event.id)).toBe(false);
    expect(await PermissionService.isOwner(env.DB, viewer.id, event.id)).toBe(false);
  });

  it("user without permission cannot access event", async () => {
    const user = await createUser(env.DB, `noperm-${Date.now()}@test.se`, "NoPerm", crypto.randomUUID());
    const event = await EventService.create(env.DB, makeEvent());

    expect(await PermissionService.canView(env.DB, user.id, event.id)).toBe(false);
    expect(await PermissionService.canEdit(env.DB, user.id, event.id)).toBe(false);
    expect(await PermissionService.isOwner(env.DB, user.id, event.id)).toBe(false);
    expect(await PermissionService.getRole(env.DB, user.id, event.id)).toBe(null);
  });

  it("removePermission revokes access", async () => {
    const user = await createUser(env.DB, `remove-${Date.now()}@test.se`, "Remove", crypto.randomUUID());
    const event = await EventService.create(env.DB, makeEvent());
    await PermissionService.addPermission(env.DB, event.id, user.email, user.name, "editor");

    expect(await PermissionService.canEdit(env.DB, user.id, event.id)).toBe(true);

    const removed = await PermissionService.removePermission(env.DB, user.id, event.id);
    expect(removed).toBe(true);

    expect(await PermissionService.canView(env.DB, user.id, event.id)).toBe(false);
  });

  it("listForEvent returns all permissions with user info", async () => {
    const owner = await createUser(env.DB, `listtest-owner-${Date.now()}@test.se`, "Owner", crypto.randomUUID());
    const editor = await createUser(env.DB, `listtest-editor-${Date.now()}@test.se`, "Editor", crypto.randomUUID());
    const event = await EventService.create(env.DB, makeEvent());
    await PermissionService.setOwner(env.DB, owner.id, event.id);
    await PermissionService.addPermission(env.DB, event.id, editor.email, editor.name, "editor");

    const perms = await PermissionService.listForEvent(env.DB, event.id);
    expect(perms.length).toBe(2);
    expect(perms.some((p) => p.role === "owner" && p.user_email === owner.email)).toBe(true);
    expect(perms.some((p) => p.role === "editor" && p.user_email === editor.email)).toBe(true);
  });

  it("addPermission upgrades role if permission exists", async () => {
    const user = await createUser(env.DB, `upgrade-${Date.now()}@test.se`, "Upgrade", crypto.randomUUID());
    const event = await EventService.create(env.DB, makeEvent());
    await PermissionService.addPermission(env.DB, event.id, user.email, user.name, "viewer");

    expect(await PermissionService.getRole(env.DB, user.id, event.id)).toBe("viewer");

    await PermissionService.addPermission(env.DB, event.id, user.email, user.name, "editor");

    expect(await PermissionService.getRole(env.DB, user.id, event.id)).toBe("editor");
  });
});
