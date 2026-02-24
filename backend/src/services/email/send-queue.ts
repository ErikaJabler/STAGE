import type { EmailQueueItem } from '@stage/shared';
import { createEmailProvider } from './factory';

const BATCH_SIZE = 20;

/** Delay between sends to respect Resend rate-limit (2 emails/sec) */
const SEND_DELAY_MS = 550;

/** Max retries on rate-limit (429) responses */
const MAX_RETRIES = 3;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Enqueue emails for a mailing (one row per recipient) */
export async function enqueueEmails(
  db: D1Database,
  items: Array<{
    mailing_id: number;
    event_id: number;
    to_email: string;
    to_name: string;
    subject: string;
    html: string;
    plain_text: string;
  }>,
): Promise<number> {
  if (items.length === 0) return 0;

  const now = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT INTO email_queue (mailing_id, event_id, to_email, to_name, subject, html, plain_text, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
  );

  const batch = items.map((item) =>
    stmt.bind(
      item.mailing_id,
      item.event_id,
      item.to_email,
      item.to_name,
      item.subject,
      item.html,
      item.plain_text,
      now,
    ),
  );

  await db.batch(batch);
  return items.length;
}

/** Record already-sent emails in the queue (audit trail for direct sends) */
export async function recordSentEmails(
  db: D1Database,
  items: Array<{
    mailing_id: number;
    event_id: number;
    to_email: string;
    to_name: string;
    subject: string;
    html: string;
    plain_text: string;
  }>,
): Promise<number> {
  if (items.length === 0) return 0;

  const now = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT INTO email_queue (mailing_id, event_id, to_email, to_name, subject, html, plain_text, status, created_at, sent_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', ?, ?)`,
  );

  const batch = items.map((item) =>
    stmt.bind(
      item.mailing_id,
      item.event_id,
      item.to_email,
      item.to_name,
      item.subject,
      item.html,
      item.plain_text,
      now,
      now,
    ),
  );

  await db.batch(batch);
  return items.length;
}

/** Process pending emails from the queue (called by Cron Trigger) */
export async function processQueue(
  db: D1Database,
  apiKey?: string,
): Promise<{ sent: number; failed: number }> {
  const pending = await db
    .prepare(`SELECT * FROM email_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT ?`)
    .bind(BATCH_SIZE)
    .all<EmailQueueItem>();

  if (pending.results.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const provider = createEmailProvider(apiKey);
  let sent = 0;
  let failed = 0;
  const now = new Date().toISOString();

  for (let i = 0; i < pending.results.length; i++) {
    const item = pending.results[i];

    // Rate-limit delay between sends
    if (i > 0) await sleep(SEND_DELAY_MS);

    let result = await provider.send({
      to: item.to_email,
      subject: item.subject,
      body: item.plain_text,
      html: item.html,
    });

    // Retry with exponential backoff on rate-limit (429)
    for (let attempt = 1; result.retryable && attempt <= MAX_RETRIES; attempt++) {
      await sleep(SEND_DELAY_MS * 2 ** attempt);
      result = await provider.send({
        to: item.to_email,
        subject: item.subject,
        body: item.plain_text,
        html: item.html,
      });
    }

    if (result.success) {
      await db
        .prepare(`UPDATE email_queue SET status = 'sent', sent_at = ? WHERE id = ?`)
        .bind(now, item.id)
        .run();
      sent++;
    } else {
      await db
        .prepare(`UPDATE email_queue SET status = 'failed', error = ? WHERE id = ?`)
        .bind(result.error ?? 'Unknown error', item.id)
        .run();
      failed++;
    }
  }

  return { sent, failed };
}

/** Get queue stats for a mailing */
export async function getQueueStats(
  db: D1Database,
  mailingId: number,
): Promise<{ pending: number; sent: number; failed: number; total: number }> {
  const result = await db
    .prepare(
      `SELECT status, COUNT(*) as count FROM email_queue WHERE mailing_id = ? GROUP BY status`,
    )
    .bind(mailingId)
    .all<{ status: string; count: number }>();

  const stats = { pending: 0, sent: 0, failed: 0, total: 0 };
  for (const row of result.results) {
    if (row.status === 'pending') stats.pending = row.count;
    else if (row.status === 'sent') stats.sent = row.count;
    else if (row.status === 'failed') stats.failed = row.count;
    stats.total += row.count;
  }
  return stats;
}
