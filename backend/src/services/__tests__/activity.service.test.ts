import { env } from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vitest';
import { ActivityService } from '../activity.service';

const EVENTS_SQL = `CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, emoji TEXT, slug TEXT NOT NULL UNIQUE, date TEXT NOT NULL, time TEXT NOT NULL, end_date TEXT, end_time TEXT, location TEXT NOT NULL, description TEXT, organizer TEXT NOT NULL, organizer_email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'planning', type TEXT NOT NULL DEFAULT 'other', max_participants INTEGER, overbooking_limit INTEGER NOT NULL DEFAULT 0, visibility TEXT NOT NULL DEFAULT 'private', sender_mailbox TEXT, gdpr_consent_text TEXT, image_url TEXT, website_template TEXT, website_data TEXT, website_published INTEGER NOT NULL DEFAULT 0, created_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), deleted_at TEXT);`;

const PARTICIPANTS_SQL = `CREATE TABLE IF NOT EXISTS participants (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, company TEXT, category TEXT NOT NULL DEFAULT 'other', status TEXT NOT NULL DEFAULT 'invited', queue_position INTEGER, response_deadline TEXT, dietary_notes TEXT, plus_one_name TEXT, plus_one_email TEXT, plus_one_dietary_notes TEXT, cancellation_token TEXT NOT NULL UNIQUE, email_status TEXT, gdpr_consent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE);`;

const ACTIVITIES_SQL = `CREATE TABLE IF NOT EXISTS activities (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL REFERENCES events(id), participant_id INTEGER REFERENCES participants(id) ON DELETE SET NULL, type TEXT NOT NULL, description TEXT NOT NULL, metadata TEXT, created_by TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));`;

beforeAll(async () => {
  await env.DB.exec(EVENTS_SQL);
  await env.DB.exec(PARTICIPANTS_SQL);
  await env.DB.exec(ACTIVITIES_SQL);
});

let counter = 0;

async function createTestEvent(slug: string): Promise<number> {
  const result = await env.DB.prepare(
    `INSERT INTO events (name, slug, date, time, location, organizer, organizer_email, created_by)
       VALUES ('Test Event', ?, '2026-06-15', '10:00', 'Stockholm', 'Test', 'test@consid.se', 'test')`,
  )
    .bind(slug)
    .run();
  return result.meta.last_row_id as number;
}

async function createTestParticipant(eventId: number, name: string): Promise<number> {
  counter++;
  const token = `tok-${Date.now()}-${counter}`;
  const result = await env.DB.prepare(
    `INSERT INTO participants (event_id, name, email, cancellation_token)
       VALUES (?, ?, ?, ?)`,
  )
    .bind(eventId, name, `${name.toLowerCase().replace(' ', '.')}@test.se`, token)
    .run();
  return result.meta.last_row_id as number;
}

describe('ActivityService', () => {
  it('logs an activity and retrieves it', async () => {
    const eventId = await createTestEvent(`activity-log-${Date.now()}`);
    const activity = await ActivityService.log(
      env.DB,
      eventId,
      'event_created',
      'Event skapat: "Test Event"',
      'test@consid.se',
    );

    expect(activity.id).toBeGreaterThan(0);
    expect(activity.event_id).toBe(eventId);
    expect(activity.type).toBe('event_created');
    expect(activity.description).toContain('Test Event');
    expect(activity.created_by).toBe('test@consid.se');
  });

  it('lists activities for an event', async () => {
    const eventId = await createTestEvent(`activity-list-${Date.now()}`);
    await ActivityService.log(env.DB, eventId, 'event_created', 'Skapad', 'test@consid.se');
    await ActivityService.logParticipantAdded(env.DB, eventId, 'Anna Svensson', 'test@consid.se');
    await ActivityService.logMailingCreated(env.DB, eventId, 'Inbjudan', 'test@consid.se');

    const activities = await ActivityService.list(env.DB, eventId);
    expect(activities.length).toBe(3);
  });

  it('stores metadata as JSON', async () => {
    const eventId = await createTestEvent(`activity-meta-${Date.now()}`);
    const activity = await ActivityService.logMailingSent(
      env.DB,
      eventId,
      'Påminnelse',
      42,
      'test@consid.se',
    );

    expect(activity.metadata).toBeTruthy();
    const meta = JSON.parse(activity.metadata!);
    expect(meta.recipientCount).toBe(42);
  });

  it('respects limit parameter', async () => {
    const eventId = await createTestEvent(`activity-limit-${Date.now()}`);
    await ActivityService.log(env.DB, eventId, 'event_created', 'A', 'test@consid.se');
    await ActivityService.log(env.DB, eventId, 'event_updated', 'B', 'test@consid.se');
    await ActivityService.log(env.DB, eventId, 'participant_added', 'C', 'test@consid.se');

    const activities = await ActivityService.list(env.DB, eventId, 2);
    expect(activities.length).toBe(2);
  });

  it('logs participant status change with old and new status', async () => {
    const eventId = await createTestEvent(`activity-status-${Date.now()}`);
    const activity = await ActivityService.logParticipantStatusChanged(
      env.DB,
      eventId,
      'Erik Karlsson',
      'invited',
      'attending',
      'test@consid.se',
    );

    expect(activity.description).toContain('invited');
    expect(activity.description).toContain('attending');
    expect(activity.description).toContain('Erik Karlsson');
  });

  it('creates activity with participantId', async () => {
    const eventId = await createTestEvent(`activity-pid-${Date.now()}`);
    const pid = await createTestParticipant(eventId, 'Anna Svensson');
    const activity = await ActivityService.logParticipantAdded(
      env.DB,
      eventId,
      'Anna Svensson',
      'test@consid.se',
      pid,
    );

    expect(activity.participant_id).toBe(pid);
    expect(activity.type).toBe('participant_added');
  });

  it('lists activities for a specific participant', async () => {
    const eventId = await createTestEvent(`activity-plist-${Date.now()}`);
    const pidAnna = await createTestParticipant(eventId, 'Anna');
    const pidErik = await createTestParticipant(eventId, 'Erik');

    await ActivityService.logRsvpResponded(env.DB, eventId, pidAnna, 'Anna', 'attending');
    await ActivityService.logParticipantEdited(
      env.DB,
      eventId,
      pidAnna,
      'Anna',
      ['namn'],
      'admin@consid.se',
    );
    // Participant Erik (should not appear)
    await ActivityService.logRsvpResponded(env.DB, eventId, pidErik, 'Erik', 'declined');
    // Event-level (no participant, should not appear)
    await ActivityService.log(env.DB, eventId, 'event_updated', 'Event ändrat', 'admin@consid.se');

    const activities = await ActivityService.listForParticipant(env.DB, eventId, pidAnna);
    expect(activities.length).toBe(2);
    expect(activities.every((a) => a.participant_id === pidAnna)).toBe(true);
  });

  it('logs RSVP responded with status label', async () => {
    const eventId = await createTestEvent(`activity-rsvp-${Date.now()}`);
    const pid = await createTestParticipant(eventId, 'Anna');
    const activity = await ActivityService.logRsvpResponded(
      env.DB,
      eventId,
      pid,
      'Anna',
      'attending',
    );

    expect(activity.type).toBe('rsvp_responded');
    expect(activity.description).toContain('Anna');
    expect(activity.description).toContain('Deltar');
    expect(activity.participant_id).toBe(pid);
  });

  it('logs RSVP cancellation', async () => {
    const eventId = await createTestEvent(`activity-cancel-${Date.now()}`);
    const pid = await createTestParticipant(eventId, 'Anna');
    const activity = await ActivityService.logRsvpCancelled(env.DB, eventId, pid, 'Anna');

    expect(activity.type).toBe('rsvp_cancelled');
    expect(activity.description).toContain('Anna');
    expect(activity.description).toContain('avbokade');
  });

  it('logs participant edited with changed fields', async () => {
    const eventId = await createTestEvent(`activity-edit-${Date.now()}`);
    const pid = await createTestParticipant(eventId, 'Anna');
    const activity = await ActivityService.logParticipantEdited(
      env.DB,
      eventId,
      pid,
      'Anna',
      ['namn', 'kost'],
      'admin@consid.se',
    );

    expect(activity.type).toBe('participant_edited');
    expect(activity.description).toContain('namn');
    expect(activity.description).toContain('kost');
    expect(activity.created_by).toBe('admin@consid.se');
  });

  it('logs participant registered via website', async () => {
    const eventId = await createTestEvent(`activity-reg-${Date.now()}`);
    const pid = await createTestParticipant(eventId, 'Anna');
    const activity = await ActivityService.logParticipantRegistered(env.DB, eventId, pid, 'Anna');

    expect(activity.type).toBe('participant_registered');
    expect(activity.description).toContain('hemsidan');
  });

  it('logs waitlist promotion', async () => {
    const eventId = await createTestEvent(`activity-promote-${Date.now()}`);
    const pid = await createTestParticipant(eventId, 'Anna');
    const activity = await ActivityService.logWaitlistPromoted(env.DB, eventId, pid, 'Anna');

    expect(activity.type).toBe('waitlist_promoted');
    expect(activity.description).toContain('väntelista');
  });
});
