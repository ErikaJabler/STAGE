import type { Activity, ActivityType } from "@stage/shared";

/** List activities for an event, newest first */
export async function listActivities(
  db: D1Database,
  eventId: number,
  limit = 50
): Promise<Activity[]> {
  const result = await db
    .prepare(
      "SELECT * FROM activities WHERE event_id = ? ORDER BY created_at DESC LIMIT ?"
    )
    .bind(eventId, limit)
    .all<Activity>();

  return result.results;
}

/** Create an activity log entry */
export async function createActivity(
  db: D1Database,
  eventId: number,
  type: ActivityType,
  description: string,
  createdBy?: string,
  metadata?: Record<string, unknown>
): Promise<Activity> {
  const now = new Date().toISOString();
  const metadataJson = metadata ? JSON.stringify(metadata) : null;

  const result = await db
    .prepare(
      `INSERT INTO activities (event_id, type, description, metadata, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(eventId, type, description, metadataJson, createdBy ?? null, now)
    .run();

  const id = result.meta.last_row_id;
  const activity = await db
    .prepare("SELECT * FROM activities WHERE id = ?")
    .bind(id)
    .first<Activity>();

  return activity!;
}
