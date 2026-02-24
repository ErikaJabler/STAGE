/**
 * Session 13b: End-to-end integration tests
 *
 * Tests full flows across multiple services/routes:
 * 1. Event → deltagare → waitlist → promote
 * 2. Inbjudan → RSVP → bekräftelse
 * 3. Behörigheter (owner/editor/viewer)
 * 4. Email-queue (Cron processning)
 * 5. Klona event → verifiera kopia
 */
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vitest';
import app from '../index';
import { processQueue } from '../services/email/send-queue';

/* ---- Table definitions ---- */

const EVENTS_SQL = `CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, emoji TEXT, slug TEXT NOT NULL UNIQUE, date TEXT NOT NULL, time TEXT NOT NULL, end_date TEXT, end_time TEXT, location TEXT NOT NULL, description TEXT, organizer TEXT NOT NULL, organizer_email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'planning', type TEXT NOT NULL DEFAULT 'other', max_participants INTEGER, overbooking_limit INTEGER NOT NULL DEFAULT 0, visibility TEXT NOT NULL DEFAULT 'private', sender_mailbox TEXT, gdpr_consent_text TEXT, image_url TEXT, website_template TEXT, website_data TEXT, website_published INTEGER NOT NULL DEFAULT 0, created_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), deleted_at TEXT);`;

const PARTICIPANTS_SQL = `CREATE TABLE IF NOT EXISTS participants (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, company TEXT, category TEXT NOT NULL DEFAULT 'other', status TEXT NOT NULL DEFAULT 'invited', queue_position INTEGER, response_deadline TEXT, dietary_notes TEXT, plus_one_name TEXT, plus_one_email TEXT, plus_one_dietary_notes TEXT, cancellation_token TEXT NOT NULL UNIQUE, email_status TEXT, gdpr_consent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE);`;

const MAILINGS_SQL = `CREATE TABLE IF NOT EXISTS mailings (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, html_body TEXT, editor_data TEXT, recipient_filter TEXT NOT NULL DEFAULT 'all', status TEXT NOT NULL DEFAULT 'draft', sent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE);`;

const USERS_SQL = `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, token TEXT NOT NULL UNIQUE, is_admin INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')));`;

const PERMISSIONS_SQL = `CREATE TABLE IF NOT EXISTS event_permissions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, event_id INTEGER NOT NULL, role TEXT NOT NULL DEFAULT 'viewer', created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE, UNIQUE(user_id, event_id));`;

const ACTIVITIES_SQL = `CREATE TABLE IF NOT EXISTS activities (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL REFERENCES events(id), type TEXT NOT NULL, description TEXT NOT NULL, metadata TEXT, created_by TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));`;

const EMAIL_QUEUE_SQL = `CREATE TABLE IF NOT EXISTS email_queue (id INTEGER PRIMARY KEY AUTOINCREMENT, mailing_id INTEGER NOT NULL REFERENCES mailings(id), event_id INTEGER NOT NULL REFERENCES events(id), to_email TEXT NOT NULL, to_name TEXT NOT NULL, subject TEXT NOT NULL, html TEXT NOT NULL, plain_text TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', error TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), sent_at TEXT);`;

/* ---- Test users ---- */

const OWNER_TOKEN = 'integ-owner-token';
const EDITOR_TOKEN = 'integ-editor-token';
const VIEWER_TOKEN = 'integ-viewer-token';
const NO_ACCESS_TOKEN = 'integ-noaccess-token';

beforeAll(async () => {
  await env.DB.exec(EVENTS_SQL);
  await env.DB.exec(PARTICIPANTS_SQL);
  await env.DB.exec(MAILINGS_SQL);
  await env.DB.exec(USERS_SQL);
  await env.DB.exec(PERMISSIONS_SQL);
  await env.DB.exec(ACTIVITIES_SQL);
  await env.DB.exec(EMAIL_QUEUE_SQL);

  // Create test users
  await env.DB.exec(
    `INSERT OR IGNORE INTO users (email, name, token) VALUES ('owner@consid.se', 'Owner User', '${OWNER_TOKEN}')`,
  );
  await env.DB.exec(
    `INSERT OR IGNORE INTO users (email, name, token) VALUES ('editor@consid.se', 'Editor User', '${EDITOR_TOKEN}')`,
  );
  await env.DB.exec(
    `INSERT OR IGNORE INTO users (email, name, token) VALUES ('viewer@consid.se', 'Viewer User', '${VIEWER_TOKEN}')`,
  );
  await env.DB.exec(
    `INSERT OR IGNORE INTO users (email, name, token) VALUES ('noaccess@consid.se', 'No Access User', '${NO_ACCESS_TOKEN}')`,
  );
});

/* ---- Helpers ---- */

async function request(
  method: string,
  path: string,
  body?: unknown,
  token = OWNER_TOKEN,
): Promise<Response> {
  const headers: Record<string, string> = { 'X-Auth-Token': token };
  if (body) headers['Content-Type'] = 'application/json';
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

/** Public request (no auth token) — for RSVP endpoints */
async function publicRequest(method: string, path: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body) headers['Content-Type'] = 'application/json';
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

let uniqueCounter = 0;
function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${++uniqueCounter}`;
}

async function createEvent(
  overrides: Record<string, unknown> = {},
  token = OWNER_TOKEN,
): Promise<{ id: number; [key: string]: unknown }> {
  const slug = unique('integ');
  const res = await request(
    'POST',
    '/api/events',
    {
      name: `Integration Test ${slug}`,
      date: '2026-08-15',
      time: '14:00',
      location: 'Stockholm',
      organizer: 'Owner User',
      organizer_email: 'owner@consid.se',
      slug,
      ...overrides,
    },
    token,
  );
  return (await res.json()) as { id: number };
}

async function addParticipant(
  eventId: number,
  overrides: Record<string, unknown> = {},
  token = OWNER_TOKEN,
): Promise<{
  id: number;
  status: string;
  cancellation_token: string;
  queue_position: number | null;
}> {
  const email = unique('p') + '@test.se';
  const res = await request(
    'POST',
    `/api/events/${eventId}/participants`,
    {
      name: `Participant ${email}`,
      email,
      ...overrides,
    },
    token,
  );
  return (await res.json()) as {
    id: number;
    status: string;
    cancellation_token: string;
    queue_position: number | null;
  };
}

/* ===================================================================
   1. Event → deltagare → waitlist → promote
   =================================================================== */

describe('Integration: Event → Participants → Waitlist → Promote', () => {
  it('creates event, fills capacity, auto-waitlists, then promotes on cancel', async () => {
    // Create event with max 2 participants
    const event = await createEvent({ max_participants: 2, overbooking_limit: 0 });

    // Add 2 attending participants (fills capacity)
    const p1 = await addParticipant(event.id, { status: 'attending' });
    expect(p1.status).toBe('attending');

    const p2 = await addParticipant(event.id, { status: 'attending' });
    expect(p2.status).toBe('attending');

    // Third participant should be auto-waitlisted
    const p3 = await addParticipant(event.id, { status: 'attending' });
    expect(p3.status).toBe('waitlisted');
    expect(p3.queue_position).toBe(1);

    // Fourth participant also waitlisted (queue pos 2)
    const p4 = await addParticipant(event.id, { status: 'attending' });
    expect(p4.status).toBe('waitlisted');
    expect(p4.queue_position).toBe(2);

    // Delete p1 (attending) → p3 (first in queue) should be promoted
    await request('DELETE', `/api/events/${event.id}/participants/${p1.id}`);

    // Verify p3 is now attending
    const listRes = await request('GET', `/api/events/${event.id}/participants`);
    const participants = (await listRes.json()) as Array<{
      id: number;
      status: string;
      queue_position: number | null;
    }>;

    const promotedP3 = participants.find((p) => p.id === p3.id);
    expect(promotedP3?.status).toBe('attending');
    expect(promotedP3?.queue_position).toBeNull();

    // p4 should still be waitlisted
    const stillWaitedP4 = participants.find((p) => p.id === p4.id);
    expect(stillWaitedP4?.status).toBe('waitlisted');
  });

  it('promotes when attending participant changes status to declined', async () => {
    const event = await createEvent({ max_participants: 1, overbooking_limit: 0 });

    const p1 = await addParticipant(event.id, { status: 'attending' });
    const p2 = await addParticipant(event.id, { status: 'attending' });
    expect(p2.status).toBe('waitlisted');

    // Change p1 to declined
    await request('PUT', `/api/events/${event.id}/participants/${p1.id}`, {
      status: 'declined',
    });

    // p2 should now be attending
    const listRes = await request('GET', `/api/events/${event.id}/participants`);
    const participants = (await listRes.json()) as Array<{ id: number; status: string }>;
    const promoted = participants.find((p) => p.id === p2.id);
    expect(promoted?.status).toBe('attending');
  });
});

/* ===================================================================
   2. Inbjudan → RSVP → bekräftelse
   =================================================================== */

describe('Integration: Invitation → RSVP → Confirmation', () => {
  it('full flow: create event, add invited participant, RSVP attending, verify status', async () => {
    const event = await createEvent();

    // Add participant as invited (default status)
    const participant = await addParticipant(event.id);
    expect(participant.status).toBe('invited');

    // Verify RSVP info is accessible via public endpoint
    const infoRes = await publicRequest('GET', `/api/rsvp/${participant.cancellation_token}`);
    expect(infoRes.status).toBe(200);
    const info = (await infoRes.json()) as {
      participant: { status: string; name: string };
      event: { name: string; location: string };
    };
    expect(info.participant.status).toBe('invited');
    expect(info.event.location).toBe('Stockholm');

    // RSVP attending with dietary notes and plus-one
    const rsvpRes = await publicRequest(
      'POST',
      `/api/rsvp/${participant.cancellation_token}/respond`,
      {
        status: 'attending',
        dietary_notes: 'Vegetarian',
        plus_one_name: 'Plus One Guest',
        plus_one_email: 'plusone@test.se',
      },
    );
    expect(rsvpRes.status).toBe(200);
    const rsvpBody = (await rsvpRes.json()) as {
      ok: boolean;
      status: string;
      name: string;
    };
    expect(rsvpBody.ok).toBe(true);
    expect(rsvpBody.status).toBe('attending');

    // Verify participant updated via admin API
    const listRes = await request('GET', `/api/events/${event.id}/participants`);
    const participants = (await listRes.json()) as Array<{
      id: number;
      status: string;
      dietary_notes: string | null;
      plus_one_name: string | null;
    }>;
    const updated = participants.find((p) => p.id === participant.id);
    expect(updated?.status).toBe('attending');
    expect(updated?.dietary_notes).toBe('Vegetarian');
    expect(updated?.plus_one_name).toBe('Plus One Guest');
  });

  it('RSVP cancel with auto-promote from waitlist', async () => {
    const event = await createEvent({ max_participants: 1, overbooking_limit: 0 });

    // p1 attending, p2 waitlisted
    const p1 = await addParticipant(event.id, { status: 'attending' });
    const p2 = await addParticipant(event.id, { status: 'attending' });
    expect(p2.status).toBe('waitlisted');

    // p1 cancels via RSVP
    const cancelRes = await publicRequest('POST', `/api/rsvp/${p1.cancellation_token}/cancel`);
    expect(cancelRes.status).toBe(200);
    const cancelBody = (await cancelRes.json()) as { ok: boolean; status: string };
    expect(cancelBody.ok).toBe(true);
    expect(cancelBody.status).toBe('cancelled');

    // p2 should be promoted
    const listRes = await request('GET', `/api/events/${event.id}/participants`);
    const participants = (await listRes.json()) as Array<{ id: number; status: string }>;
    const promoted = participants.find((p) => p.id === p2.id);
    expect(promoted?.status).toBe('attending');
  });

  it('RSVP auto-waitlists when event is full', async () => {
    const event = await createEvent({ max_participants: 1, overbooking_limit: 0 });

    // Add invited participant BEFORE filling capacity (explicit status avoids auto-waitlist)
    const invited = await addParticipant(event.id, { status: 'invited' });
    expect(invited.status).toBe('invited');

    // Now fill capacity
    await addParticipant(event.id, { status: 'attending' });

    // Try to RSVP attending — should be auto-waitlisted since event is now full
    const rsvpRes = await publicRequest('POST', `/api/rsvp/${invited.cancellation_token}/respond`, {
      status: 'attending',
    });
    expect(rsvpRes.status).toBe(200);
    const body = (await rsvpRes.json()) as {
      ok: boolean;
      status: string;
      waitlisted?: boolean;
    };
    expect(body.ok).toBe(true);
    expect(body.status).toBe('waitlisted');
    expect(body.waitlisted).toBe(true);
  });
});

/* ===================================================================
   3. Behörigheter (owner/editor/viewer)
   =================================================================== */

describe('Integration: Permissions (owner/editor/viewer)', () => {
  /** Helper: create event and set up all role permissions */
  async function setupEventWithRoles(): Promise<number> {
    const event = await createEvent();
    await request('POST', `/api/events/${event.id}/permissions`, {
      email: 'editor@consid.se',
      name: 'Editor User',
      role: 'editor',
    });
    await request('POST', `/api/events/${event.id}/permissions`, {
      email: 'viewer@consid.se',
      name: 'Viewer User',
      role: 'viewer',
    });
    return event.id;
  }

  it('owner creates event and adds editor + viewer', async () => {
    const eid = await setupEventWithRoles();

    // Verify permissions list
    const listRes = await request('GET', `/api/events/${eid}/permissions`);
    expect(listRes.status).toBe(200);
    const perms = (await listRes.json()) as Array<{ role: string; user_email: string }>;
    expect(perms.length).toBe(3); // owner + editor + viewer

    const roles = perms.map((p) => p.role).sort();
    expect(roles).toEqual(['editor', 'owner', 'viewer']);
  });

  it('editor can read and modify event', async () => {
    const eid = await setupEventWithRoles();

    // Editor can read
    const getRes = await request('GET', `/api/events/${eid}`, undefined, EDITOR_TOKEN);
    expect(getRes.status).toBe(200);

    // Editor can update
    const updateRes = await request(
      'PUT',
      `/api/events/${eid}`,
      { description: 'Updated by editor' },
      EDITOR_TOKEN,
    );
    expect(updateRes.status).toBe(200);
    const updated = (await updateRes.json()) as { description: string };
    expect(updated.description).toBe('Updated by editor');

    // Editor can add participants
    const addRes = await request(
      'POST',
      `/api/events/${eid}/participants`,
      { name: 'Editor Added', email: `editor-added-${Date.now()}@test.se` },
      EDITOR_TOKEN,
    );
    expect(addRes.status).toBe(201);
  });

  it('viewer can read but not modify', async () => {
    const eid = await setupEventWithRoles();

    // Viewer can read event
    const getRes = await request('GET', `/api/events/${eid}`, undefined, VIEWER_TOKEN);
    expect(getRes.status).toBe(200);

    // Viewer can list participants
    const listRes = await request(
      'GET',
      `/api/events/${eid}/participants`,
      undefined,
      VIEWER_TOKEN,
    );
    expect(listRes.status).toBe(200);

    // Viewer cannot update event
    const updateRes = await request(
      'PUT',
      `/api/events/${eid}`,
      { description: 'Should fail' },
      VIEWER_TOKEN,
    );
    expect(updateRes.status).toBe(403);

    // Viewer cannot add participants
    const addRes = await request(
      'POST',
      `/api/events/${eid}/participants`,
      { name: 'Should Fail', email: 'fail@test.se' },
      VIEWER_TOKEN,
    );
    expect(addRes.status).toBe(403);
  });

  it('user without permission gets 403', async () => {
    const eid = await setupEventWithRoles();
    const getRes = await request('GET', `/api/events/${eid}`, undefined, NO_ACCESS_TOKEN);
    expect(getRes.status).toBe(403);
  });

  it('editor cannot manage permissions', async () => {
    const eid = await setupEventWithRoles();
    const res = await request(
      'POST',
      `/api/events/${eid}/permissions`,
      { email: 'new@consid.se', name: 'New User', role: 'viewer' },
      EDITOR_TOKEN,
    );
    expect(res.status).toBe(403);
  });
});

/* ===================================================================
   4. Email-queue (Cron processning)
   =================================================================== */

describe('Integration: Email Queue + Cron Processing', () => {
  it('enqueues emails for >5 recipients and processes via queue', async () => {
    const event = await createEvent();

    // Add 6 participants (> 5 threshold for direct send)
    for (let i = 1; i <= 6; i++) {
      await addParticipant(event.id, {
        name: `Queue P${i}`,
        email: `queue-p${i}-${Date.now()}@test.se`,
        status: 'invited',
      });
    }

    // Create mailing
    const mailingRes = await request('POST', `/api/events/${event.id}/mailings`, {
      subject: 'Queue Test',
      body: 'Hej {{name}}, detta testar kön.',
      recipient_filter: 'all',
    });
    expect(mailingRes.status).toBe(201);
    const mailing = (await mailingRes.json()) as { id: number };

    // Send mailing (>5 recipients → queued, not direct)
    const sendRes = await request('POST', `/api/events/${event.id}/mailings/${mailing.id}/send`);
    expect(sendRes.status).toBe(200);
    const sendBody = (await sendRes.json()) as {
      sent: number;
      total: number;
    };
    // Should be queued (sent=0, total=6)
    expect(sendBody.total).toBe(6);
    expect(sendBody.sent).toBe(0);

    // Verify email_queue has 6 pending items
    const queueBefore = await env.DB.prepare(
      "SELECT COUNT(*) as cnt FROM email_queue WHERE mailing_id = ? AND status = 'pending'",
    )
      .bind(mailing.id)
      .first<{ cnt: number }>();
    expect(queueBefore?.cnt).toBe(6);

    // Process the queue (simulates Cron Trigger)
    const result = await processQueue(env.DB);
    expect(result.sent).toBe(6);
    expect(result.failed).toBe(0);

    // Verify all items are now sent
    const queueAfter = await env.DB.prepare(
      "SELECT COUNT(*) as cnt FROM email_queue WHERE mailing_id = ? AND status = 'sent'",
    )
      .bind(mailing.id)
      .first<{ cnt: number }>();
    expect(queueAfter?.cnt).toBe(6);
  });

  it('direct send for <=5 recipients (no queue)', async () => {
    const event = await createEvent();

    // Add 3 participants
    for (let i = 1; i <= 3; i++) {
      await addParticipant(event.id, {
        name: `Direct P${i}`,
        email: `direct-p${i}-${Date.now()}@test.se`,
        status: 'invited',
      });
    }

    // Create and send mailing
    const mailingRes = await request('POST', `/api/events/${event.id}/mailings`, {
      subject: 'Direct Test',
      body: 'Hej {{name}}, detta skickas direkt.',
      recipient_filter: 'all',
    });
    const mailing = (await mailingRes.json()) as { id: number };

    const sendRes = await request('POST', `/api/events/${event.id}/mailings/${mailing.id}/send`);
    expect(sendRes.status).toBe(200);
    const sendBody = (await sendRes.json()) as { sent: number; total: number };
    // Direct send (sent=3, total=3)
    expect(sendBody.sent).toBe(3);
    expect(sendBody.total).toBe(3);

    // Direct sends are now recorded in email_queue with status='sent' for audit trail
    const queueCount = await env.DB.prepare(
      "SELECT COUNT(*) as cnt FROM email_queue WHERE mailing_id = ? AND status = 'sent'",
    )
      .bind(mailing.id)
      .first<{ cnt: number }>();
    expect(queueCount?.cnt).toBe(3);
  });
});

/* ===================================================================
   5. Klona event → verifiera kopia
   =================================================================== */

describe('Integration: Clone Event', () => {
  it('clones event with correct data, no participants copied', async () => {
    // Create source event with specific data
    const source = await createEvent({
      name: 'Konsultdagen 2026',
      description: 'Årlig konferens',
      type: 'conference',
      max_participants: 100,
      overbooking_limit: 5,
    });

    // Add participants to source
    await addParticipant(source.id, { status: 'attending' });
    await addParticipant(source.id, { status: 'attending' });
    await addParticipant(source.id, { status: 'invited' });

    // Verify source has 3 participants
    const sourceParticipants = await request('GET', `/api/events/${source.id}/participants`);
    const srcList = (await sourceParticipants.json()) as Array<{ id: number }>;
    expect(srcList.length).toBe(3);

    // Clone
    const cloneRes = await request('POST', `/api/events/${source.id}/clone`);
    expect(cloneRes.status).toBe(201);
    const cloned = (await cloneRes.json()) as {
      id: number;
      name: string;
      description: string;
      type: string;
      status: string;
      max_participants: number;
      overbooking_limit: number;
    };

    // Verify cloned data
    expect(cloned.id).not.toBe(source.id);
    expect(cloned.name).toBe('Konsultdagen 2026 (kopia)');
    expect(cloned.description).toBe('Årlig konferens');
    expect(cloned.type).toBe('conference');
    expect(cloned.status).toBe('planning');
    expect(cloned.max_participants).toBe(100);
    expect(cloned.overbooking_limit).toBe(5);

    // Cloned event should have 0 participants
    const clonedParticipants = await request('GET', `/api/events/${cloned.id}/participants`);
    const cloneList = (await clonedParticipants.json()) as Array<{ id: number }>;
    expect(cloneList.length).toBe(0);
  });

  it('clone sets current user as owner', async () => {
    const source = await createEvent();

    const cloneRes = await request('POST', `/api/events/${source.id}/clone`);
    const cloned = (await cloneRes.json()) as { id: number };

    // Verify owner permission on cloned event (field is user_email from JOIN query)
    const permsRes = await request('GET', `/api/events/${cloned.id}/permissions`);
    const perms = (await permsRes.json()) as Array<{ role: string; user_email: string }>;
    const ownerPerm = perms.find((p) => p.user_email === 'owner@consid.se');
    expect(ownerPerm?.role).toBe('owner');
  });
});
