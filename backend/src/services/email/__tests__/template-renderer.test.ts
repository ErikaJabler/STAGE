import { describe, it, expect } from 'vitest';
import { buildMergeContext, renderText, renderHtml, renderEmail } from '../template-renderer';
import type { Event, Participant } from '@stage/shared';

const BASE_URL = 'https://example.com';

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 1,
    name: 'Test Event',
    slug: 'test-event',
    emoji: null,
    date: '2026-06-15',
    time: '14:00',
    end_date: null,
    end_time: null,
    location: 'Stockholm',
    description: 'Beskrivning',
    organizer: 'Anna',
    organizer_email: 'anna@consid.se',
    status: 'upcoming' as const,
    type: 'internal' as const,
    max_participants: null,
    overbooking_limit: 0,
    visibility: 'private' as const,
    sender_mailbox: null,
    gdpr_consent_text: null,
    image_url: null,
    website_template: null,
    website_data: null,
    website_published: 0,
    created_by: 'anna@consid.se',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    deleted_at: null,
    ...overrides,
  };
}

function makeParticipant(overrides: Partial<Participant> = {}): Participant {
  return {
    id: 10,
    event_id: 1,
    name: 'Erik Svensson',
    email: 'erik@test.se',
    company: 'Consid',
    category: 'internal' as const,
    status: 'invited' as const,
    queue_position: null,
    response_deadline: null,
    dietary_notes: null,
    plus_one_name: null,
    plus_one_email: null,
    plus_one_dietary_notes: null,
    cancellation_token: 'abc-123-def',
    email_status: null,
    gdpr_consent_at: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  };
}

describe('buildMergeContext', () => {
  it('maps all fields from event + participant correctly', () => {
    const event = makeEvent();
    const participant = makeParticipant();
    const ctx = buildMergeContext(event, participant, BASE_URL);

    expect(ctx.name).toBe('Erik Svensson');
    expect(ctx.event).toBe('Test Event');
    expect(ctx.datum).toBe('2026-06-15');
    expect(ctx.tid).toBe('14:00');
    expect(ctx.plats).toBe('Stockholm');
    expect(ctx.organizer).toBe('Anna (anna@consid.se)');
    expect(ctx.rsvp_link).toBe(`${BASE_URL}/stage/rsvp/abc-123-def`);
    expect(ctx.calendar_link).toBe(`${BASE_URL}/stage/api/events/1/calendar.ics`);
  });
});

describe('renderText', () => {
  it('replaces merge fields with values', () => {
    const ctx = buildMergeContext(makeEvent(), makeParticipant(), BASE_URL);
    const result = renderText('Hej {{name}}, välkommen till {{event}}!', ctx);
    expect(result).toBe('Hej Erik Svensson, välkommen till Test Event!');
  });

  it('replaces all occurrences of same field', () => {
    const ctx = buildMergeContext(makeEvent(), makeParticipant(), BASE_URL);
    const result = renderText('{{name}} heter {{name}}', ctx);
    expect(result).toBe('Erik Svensson heter Erik Svensson');
  });

  it('does NOT escape HTML in text mode', () => {
    const ctx = buildMergeContext(
      makeEvent(),
      makeParticipant({ name: '<script>alert("xss")</script>' }),
      BASE_URL,
    );
    const result = renderText('Hej {{name}}', ctx);
    expect(result).toBe('Hej <script>alert("xss")</script>');
  });
});

describe('renderHtml', () => {
  it('replaces merge fields with escaped values', () => {
    const ctx = buildMergeContext(makeEvent(), makeParticipant(), BASE_URL);
    const result = renderHtml('<p>Hej {{name}}, välkommen till {{event}}</p>', ctx);
    expect(result).toBe('<p>Hej Erik Svensson, välkommen till Test Event</p>');
  });

  it('escapes XSS in name field', () => {
    const ctx = buildMergeContext(
      makeEvent(),
      makeParticipant({ name: '<script>alert("xss")</script>' }),
      BASE_URL,
    );
    const result = renderHtml('<p>Hej {{name}}</p>', ctx);
    expect(result).toContain('&lt;script&gt;');
    expect(result).not.toContain('<script>');
  });

  it('does NOT escape URL fields (rsvp_link, calendar_link)', () => {
    const ctx = buildMergeContext(makeEvent(), makeParticipant(), BASE_URL);
    const result = renderHtml('<a href="{{rsvp_link}}">Svara</a>', ctx);
    expect(result).toContain(`href="${BASE_URL}/stage/rsvp/abc-123-def"`);
    expect(result).not.toContain('&amp;');
  });

  it('escapes HTML special characters in event name', () => {
    const ctx = buildMergeContext(
      makeEvent({ name: 'Event "Special" & <Bold>' }),
      makeParticipant(),
      BASE_URL,
    );
    const result = renderHtml('<h1>{{event}}</h1>', ctx);
    expect(result).toContain('&amp;');
    expect(result).toContain('&lt;Bold&gt;');
    expect(result).toContain('&quot;Special&quot;');
  });
});

describe('renderEmail', () => {
  it('renders complete email with subject, text and html', () => {
    const ctx = buildMergeContext(makeEvent(), makeParticipant(), BASE_URL);
    const result = renderEmail('Hej {{name}}!', 'Inbjudan till {{event}}', ctx, makeEvent());

    expect(result.subject).toBe('Inbjudan till Test Event');
    expect(result.text).toContain('Hej Erik Svensson!');
    expect(result.html).toContain('Erik Svensson');
  });

  it('auto-appends rsvp_link if not in body', () => {
    const ctx = buildMergeContext(makeEvent(), makeParticipant(), BASE_URL);
    const result = renderEmail('Hej {{name}}!', 'Ämne', ctx, makeEvent());

    expect(result.text).toContain('Svara på inbjudan:');
    expect(result.text).toContain(BASE_URL);
  });

  it('does not duplicate rsvp_link if already in body', () => {
    const ctx = buildMergeContext(makeEvent(), makeParticipant(), BASE_URL);
    const result = renderEmail('Klicka här: {{rsvp_link}}', 'Ämne', ctx, makeEvent());

    // Should contain rsvp_link once from body, not appended again
    const matches = result.text.match(/rsvp/g);
    expect(matches?.length).toBe(1);
  });
});
