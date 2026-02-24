import type { User } from '@stage/shared';

const USER_COLUMNS = 'id, email, name, token, is_admin, created_at, updated_at';

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
