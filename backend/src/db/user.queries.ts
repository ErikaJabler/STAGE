import type { User, AdminUser } from '@stage/shared';

const USER_COLUMNS = 'id, email, name, token, is_admin, created_at, updated_at';
const ADMIN_USER_COLUMNS = 'id, email, name, is_admin, created_at';

export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const row = await db
    .prepare(`SELECT ${USER_COLUMNS} FROM users WHERE email = ?`)
    .bind(email)
    .first();
  return row ? (row as unknown as User) : null;
}

export async function getUserByToken(db: D1Database, token: string): Promise<User | null> {
  const row = await db
    .prepare(`SELECT ${USER_COLUMNS} FROM users WHERE token = ?`)
    .bind(token)
    .first();
  return row ? (row as unknown as User) : null;
}

export async function createUser(
  db: D1Database,
  email: string,
  name: string,
  token: string,
): Promise<User> {
  await db
    .prepare('INSERT INTO users (email, name, token) VALUES (?, ?, ?)')
    .bind(email, name, token)
    .run();

  const user = await getUserByEmail(db, email);
  return user!;
}

/** Get or create user — returns existing user if email exists, creates new otherwise */
export async function getOrCreateUser(
  db: D1Database,
  email: string,
  name: string,
  token: string,
): Promise<User> {
  const existing = await getUserByEmail(db, email);
  if (existing) return existing;
  return createUser(db, email, name, token);
}

/** Check if a user has global admin status */
export async function isAdminUser(db: D1Database, userId: number): Promise<boolean> {
  const row = await db
    .prepare('SELECT is_admin FROM users WHERE id = ?')
    .bind(userId)
    .first<{ is_admin: number }>();
  return row ? row.is_admin === 1 : false;
}

/** List all users (for admin dashboard) — omits token */
export async function listAllUsers(db: D1Database): Promise<AdminUser[]> {
  const { results } = await db
    .prepare(`SELECT ${ADMIN_USER_COLUMNS} FROM users ORDER BY created_at DESC`)
    .all();
  return (results as unknown as (Omit<AdminUser, 'is_admin'> & { is_admin: number })[]).map(
    (r) => ({ ...r, is_admin: r.is_admin === 1 }),
  );
}

/** Update a user's admin status */
export async function updateUserAdmin(
  db: D1Database,
  userId: number,
  isAdmin: boolean,
): Promise<void> {
  await db
    .prepare('UPDATE users SET is_admin = ?, updated_at = ? WHERE id = ?')
    .bind(isAdmin ? 1 : 0, new Date().toISOString(), userId)
    .run();
}

/** Delete a user */
export async function deleteUser(db: D1Database, userId: number): Promise<void> {
  await db.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
}
