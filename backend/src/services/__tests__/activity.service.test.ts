import { env } from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vitest';
import { ActivityService } from '../activity.service';

const EVENTS_SQL = `CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, emoji TEXT, slug TEXT NOT NULL UNIQUE, date TEXT NOT NULL, time TEXT NOT NULL, end_date TEXT, end_time TEXT, location TEXT NOT NULL, description TEXT, organizer TEXT NOT NULL, organizer_email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'planning', type TEXT NOT NULL DEFAULT 'other', max_participants INTEGER, overbooking_limit INTEGER NOT NULL DEFAULT 0, visibility TEXT NOT NULL DEFAULT 'private', sender_mailbox TEXT, gdpr_consent_text TEXT, image_url TEXT, website_template TEXT, website_data TEXT, website_published INTEGER NOT NULL DEFAULT 0, created_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), deleted_at TEXT);`;

const ACTIVITIES_SQL = `CREATE TABLE IF NOT EXISTS activities (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL REFERENCES events(id), type TEXT NOT NULL, description TEXT NOT NULL, metadata TEXT, created_by TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));`;

beforeAll(async () => {
  await env.DB.exec(EVENTS_SQL);
  await env.DB.exec(ACTIVITIES_SQL);
});

async function createTestEvent(slug: string): Promise<number> {
  const result = await env.DB.prepare(
    `INSERT INTO events (name, slug, date, time, location, organizer, organizer_email, created_by)
       VALUES ('Test Event', ?, '2026-06-15', '10:00', 'Stockholm', 'Test', 'test@consid.se', 'test')`,
  )
    .bind(slug)
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
});
