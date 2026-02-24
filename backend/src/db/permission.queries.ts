import type { EventPermission, EventPermissionWithUser, Role } from '@stage/shared';

export async function getPermission(
  db: D1Database,
  userId: number,
  eventId: number,
): Promise<EventPermission | null> {
  const row = await db
    .prepare(
      'SELECT id, user_id, event_id, role, created_at FROM event_permissions WHERE user_id = ? AND event_id = ?',
    )
    .bind(userId, eventId)
    .first();
  return row ? (row as unknown as EventPermission) : null;
}

export async function listPermissions(
  db: D1Database,
  eventId: number,
): Promise<EventPermissionWithUser[]> {
  const { results } = await db
    .prepare(
      `SELECT ep.id, ep.user_id, ep.event_id, ep.role, ep.created_at,
              u.email as user_email, u.name as user_name
       FROM event_permissions ep
       JOIN users u ON u.id = ep.user_id
       WHERE ep.event_id = ?
       ORDER BY ep.created_at ASC`,
    )
    .bind(eventId)
    .all();
  return (results ?? []) as unknown as EventPermissionWithUser[];
}

export async function addPermission(
  db: D1Database,
  userId: number,
  eventId: number,
  role: Role,
): Promise<EventPermission> {
  await db
    .prepare(
      `INSERT INTO event_permissions (user_id, event_id, role)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id, event_id) DO UPDATE SET role = excluded.role`,
    )
    .bind(userId, eventId, role)
    .run();

  const perm = await getPermission(db, userId, eventId);
  return perm!;
}

export async function removePermission(
  db: D1Database,
  userId: number,
  eventId: number,
): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM event_permissions WHERE user_id = ? AND event_id = ?')
    .bind(userId, eventId)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}
