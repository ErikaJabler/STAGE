import type { User } from '@stage/shared';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  IMAGES?: R2Bucket; // Session 9 — R2 bildlagring
  RESEND_API_KEY?: string; // Session 4 — Email via Resend
}

/** Variables set by auth middleware, accessible via c.var */
export interface AuthVariables {
  user: User;
}
