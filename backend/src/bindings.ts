export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  // IMAGES: R2Bucket;  // Session 2
  RESEND_API_KEY?: string;  // Session 4 — Email via Resend
}
