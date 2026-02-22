import type { User } from "@stage/shared";

export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const row = await db
    .prepare("SELECT id, email, name, token, created_at, updated_at FROM users WHERE email = ?")
    .bind(email)
    .first();
  return row ? (row as unknown as User) : null;
}

export async function getUserByToken(db: D1Database, token: string): Promise<User | null> {
  const row = await db
    .prepare("SELECT id, email, name, token, created_at, updated_at FROM users WHERE token = ?")
    .bind(token)
    .first();
  return row ? (row as unknown as User) : null;
}

export async function createUser(
  db: D1Database,
  email: string,
  name: string,
  token: string
): Promise<User> {
  await db
    .prepare("INSERT INTO users (email, name, token) VALUES (?, ?, ?)")
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
  token: string
): Promise<User> {
  const existing = await getUserByEmail(db, email);
  if (existing) return existing;
  return createUser(db, email, name, token);
}
