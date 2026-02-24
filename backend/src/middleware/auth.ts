import { createMiddleware } from 'hono/factory';
import type { Env, AuthVariables } from '../bindings';
import type { User } from '@stage/shared';

/**
 * AuthProvider interface — swap implementation for Azure AD later.
 * Current: simple token lookup in D1 users table.
 */
export interface AuthProvider {
  /** Resolve a user from a request token. Returns null if invalid. */
  resolveUser(token: string, db: D1Database): Promise<User | null>;
}

/** Simple token-based auth provider (D1 lookup) */
export const tokenAuthProvider: AuthProvider = {
  async resolveUser(token: string, db: D1Database): Promise<User | null> {
    const row = await db
      .prepare(
        'SELECT id, email, name, token, is_admin, created_at, updated_at FROM users WHERE token = ?',
      )
      .bind(token)
      .first();
    return row ? (row as unknown as User) : null;
  },
};

/** Currently active auth provider */
let currentProvider: AuthProvider = tokenAuthProvider;

export function setAuthProvider(provider: AuthProvider) {
  currentProvider = provider;
}

/**
 * Auth middleware — reads X-Auth-Token header, resolves user, sets c.var.user.
 * Returns 401 if no token or invalid token.
 */
export const authMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: AuthVariables;
}>(async (c, next) => {
  const token = c.req.header('X-Auth-Token');

  if (!token) {
    return c.json({ error: 'Autentisering krävs' }, 401);
  }

  const user = await currentProvider.resolveUser(token, c.env.DB);

  if (!user) {
    return c.json({ error: 'Ogiltig token' }, 401);
  }

  c.set('user', user);
  await next();
});
