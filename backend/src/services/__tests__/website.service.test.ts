import { env } from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vitest';
import { WebsiteService } from '../website.service';
import { EventService } from '../event.service';
import type { CreateEventInput } from '../../db/queries';

const EVENTS_SQL = `CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, emoji TEXT, slug TEXT NOT NULL UNIQUE, date TEXT NOT NULL, time TEXT NOT NULL, end_date TEXT, end_time TEXT, location TEXT NOT NULL, description TEXT, organizer TEXT NOT NULL, organizer_email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'planning', type TEXT NOT NULL DEFAULT 'other', max_participants INTEGER, overbooking_limit INTEGER NOT NULL DEFAULT 0, visibility TEXT NOT NULL DEFAULT 'private', sender_mailbox TEXT, gdpr_consent_text TEXT, image_url TEXT, website_template TEXT, website_data TEXT, website_published INTEGER NOT NULL DEFAULT 0, created_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), deleted_at TEXT);`;

const PARTICIPANTS_SQL = `CREATE TABLE IF NOT EXISTS participants (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, company TEXT, category TEXT NOT NULL DEFAULT 'other', status TEXT NOT NULL DEFAULT 'invited', queue_position INTEGER, response_deadline TEXT, dietary_notes TEXT, plus_one_name TEXT, plus_one_email TEXT, cancellation_token TEXT NOT NULL UNIQUE, email_status TEXT, gdpr_consent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE);`;

beforeAll(async () => {
  await env.DB.exec(EVENTS_SQL);
  await env.DB.exec(PARTICIPANTS_SQL);
});

function makeEvent(overrides: Partial<CreateEventInput> = {}): CreateEventInput {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    name: `Website Test ${id}`,
    slug: `website-test-${id}`,
    date: '2026-09-01',
    time: '09:00',
    location: 'Göteborg',
    organizer: 'Test',
    organizer_email: 'test@consid.se',
    created_by: 'test@consid.se',
    ...overrides,
  };
}

describe('WebsiteService', () => {
  describe('getWebsite + saveWebsite', () => {
    it('saves and retrieves website config', async () => {
      const event = await EventService.create(env.DB, makeEvent());

      // Initially empty
      const initial = await WebsiteService.getWebsite(env.DB, event.id);
      expect(initial).toBeTruthy();
      expect(initial!.template).toBeNull();
      expect(initial!.published).toBe(false);

      // Save config
      const saved = await WebsiteService.saveWebsite(env.DB, event.id, {
        template: 'hero-info',
        data: { hero_title: 'Välkommen!', hero_subtitle: 'Till vårt event' },
        published: true,
      });

      expect(saved.template).toBe('hero-info');
      expect(saved.data!.hero_title).toBe('Välkommen!');
      expect(saved.published).toBe(true);

      // Retrieve
      const retrieved = await WebsiteService.getWebsite(env.DB, event.id);
      expect(retrieved!.template).toBe('hero-info');
      expect(retrieved!.data!.hero_subtitle).toBe('Till vårt event');
      expect(retrieved!.published).toBe(true);
    });
  });

  describe('getPublicEvent', () => {
    it('returns event when published', async () => {
      const event = await EventService.create(env.DB, makeEvent());
      await WebsiteService.saveWebsite(env.DB, event.id, {
        template: 'hero-info',
        published: true,
      });

      const publicEvent = await WebsiteService.getPublicEvent(env.DB, event.slug);
      expect(publicEvent).toBeTruthy();
      expect(publicEvent!.name).toBe(event.name);
    });

    it('returns null when not published', async () => {
      const event = await EventService.create(env.DB, makeEvent());
      const publicEvent = await WebsiteService.getPublicEvent(env.DB, event.slug);
      expect(publicEvent).toBeNull();
    });
  });

  describe('getWebsite with invalid JSON', () => {
    it('returns null data when website_data contains invalid JSON', async () => {
      const event = await EventService.create(env.DB, makeEvent());

      // Manually insert invalid JSON into the database
      await env.DB.prepare(
        "UPDATE events SET website_data = ?, website_template = 'hero-info', website_published = 1 WHERE id = ?",
      )
        .bind('{invalid json!!!', event.id)
        .run();

      const result = await WebsiteService.getWebsite(env.DB, event.id);
      expect(result).toBeTruthy();
      expect(result!.data).toBeNull();
      expect(result!.template).toBe('hero-info');
    });
  });

  describe('getPublicEvent with invalid JSON', () => {
    it('returns null website_data_parsed when JSON is corrupt', async () => {
      const event = await EventService.create(env.DB, makeEvent());

      await env.DB.prepare('UPDATE events SET website_data = ?, website_published = 1 WHERE id = ?')
        .bind('not-json', event.id)
        .run();

      const result = await WebsiteService.getPublicEvent(env.DB, event.slug);
      expect(result).toBeTruthy();
      expect(result!.website_data_parsed).toBeNull();
    });
  });

  describe('register', () => {
    it('registers a participant successfully', async () => {
      const event = await EventService.create(env.DB, makeEvent());
      await WebsiteService.saveWebsite(env.DB, event.id, {
        template: 'hero-info',
        published: true,
      });

      const result = await WebsiteService.register(env.DB, event.slug, {
        name: 'Anna Andersson',
        email: `anna-${Date.now()}@example.com`,
      });

      expect(result.ok).toBe(true);
      expect(result.status).toBe('attending');
    });

    it('rejects duplicate email registration', async () => {
      const event = await EventService.create(env.DB, makeEvent());
      await WebsiteService.saveWebsite(env.DB, event.id, {
        template: 'hero-info',
        published: true,
      });

      const email = `dup-${Date.now()}@example.com`;
      await WebsiteService.register(env.DB, event.slug, {
        name: 'First',
        email,
      });

      const result = await WebsiteService.register(env.DB, event.slug, {
        name: 'Second',
        email,
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('redan anmäld');
    });

    it('auto-waitlists when event is full', async () => {
      const event = await EventService.create(
        env.DB,
        makeEvent({
          max_participants: 1,
          overbooking_limit: 0,
        }),
      );
      await WebsiteService.saveWebsite(env.DB, event.id, {
        template: 'hero-info',
        published: true,
      });

      // First registration — should attend
      const first = await WebsiteService.register(env.DB, event.slug, {
        name: 'First',
        email: `first-${Date.now()}@example.com`,
      });
      expect(first.status).toBe('attending');

      // Second registration — should be waitlisted
      const second = await WebsiteService.register(env.DB, event.slug, {
        name: 'Second',
        email: `second-${Date.now()}@example.com`,
      });
      expect(second.status).toBe('waitlisted');
      expect(second.waitlisted).toBe(true);
    });
  });
});
