export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  IMAGES?: R2Bucket;  // Session 9 — R2 bildlagring
  RESEND_API_KEY?: string;  // Session 4 — Email via Resend
}
