import type {
  Participant,
  CreateParticipantInput,
  UpdateParticipantInput,
  ParticipantEmailHistory,
} from '@stage/shared';

export type { CreateParticipantInput, UpdateParticipantInput };

/** List all participants for an event */
export async function listParticipants(db: D1Database, eventId: number): Promise<Participant[]> {
  const result = await db
    .prepare('SELECT * FROM participants WHERE event_id = ? ORDER BY created_at ASC')
    .bind(eventId)
    .all<Participant>();

  return result.results;
}

/** Get a single participant by ID */
export async function getParticipantById(db: D1Database, id: number): Promise<Participant | null> {
  const result = await db
    .prepare('SELECT * FROM participants WHERE id = ?')
    .bind(id)
    .first<Participant>();

  return result ?? null;
}

/** Create a new participant */
export async function createParticipant(
  db: D1Database,
  eventId: number,
  input: CreateParticipantInput,
): Promise<Participant> {
  const now = new Date().toISOString();
  const cancellationToken = crypto.randomUUID();

  const result = await db
    .prepare(
      `INSERT INTO participants (
        event_id, name, email, company, category, status,
        response_deadline, dietary_notes, plus_one_name, plus_one_email,
        cancellation_token, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      eventId,
      input.name,
      input.email,
      input.company ?? null,
      input.category ?? 'other',
      input.status ?? 'invited',
      input.response_deadline ?? null,
      input.dietary_notes ?? null,
      input.plus_one_name ?? null,
      input.plus_one_email ?? null,
      cancellationToken,
      now,
      now,
    )
    .run();

  const id = result.meta.last_row_id;
  const participant = await db
    .prepare('SELECT * FROM participants WHERE id = ?')
    .bind(id)
    .first<Participant>();

  return participant!;
}

/** Bulk create participants (for CSV import) */
export async function bulkCreateParticipants(
  db: D1Database,
  eventId: number,
  inputs: CreateParticipantInput[],
): Promise<number> {
  const now = new Date().toISOString();
  let created = 0;

  // D1 doesn't support batch inserts with variable bindings well,
  // so we insert one-by-one within a reasonable limit
  for (const input of inputs) {
    const cancellationToken = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO participants (
          event_id, name, email, company, category, status,
          response_deadline, dietary_notes, plus_one_name, plus_one_email,
          cancellation_token, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        eventId,
        input.name,
        input.email,
        input.company ?? null,
        input.category ?? 'other',
        input.status ?? 'invited',
        input.response_deadline ?? null,
        input.dietary_notes ?? null,
        input.plus_one_name ?? null,
        input.plus_one_email ?? null,
        cancellationToken,
        now,
        now,
      )
      .run();
    created++;
  }

  return created;
}

/** Update an existing participant (partial update) */
export async function updateParticipant(
  db: D1Database,
  id: number,
  input: UpdateParticipantInput,
): Promise<Participant | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  const updatable: (keyof UpdateParticipantInput)[] = [
    'name',
    'email',
    'company',
    'category',
    'status',
    'queue_position',
    'response_deadline',
    'dietary_notes',
    'plus_one_name',
    'plus_one_email',
  ];

  for (const key of updatable) {
    if (key in input) {
      fields.push(`${key} = ?`);
      values.push(input[key] ?? null);
    }
  }

  if (fields.length === 0) {
    return getParticipantById(db, id);
  }

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  await db
    .prepare(`UPDATE participants SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  return getParticipantById(db, id);
}

/** Get email history for a participant by event + email */
export async function getParticipantEmailHistory(
  db: D1Database,
  eventId: number,
  email: string,
): Promise<ParticipantEmailHistory[]> {
  const result = await db
    .prepare(
      `SELECT id, mailing_id, subject, status, error, created_at, sent_at
       FROM email_queue
       WHERE event_id = ? AND to_email = ?
       ORDER BY created_at DESC`,
    )
    .bind(eventId, email)
    .all<ParticipantEmailHistory>();

  return result.results;
}

/** Delete a participant (hard delete) */
export async function deleteParticipant(db: D1Database, id: number): Promise<boolean> {
  const result = await db.prepare('DELETE FROM participants WHERE id = ?').bind(id).run();

  return result.meta.changes > 0;
}
