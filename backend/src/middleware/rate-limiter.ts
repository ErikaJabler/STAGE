import type { Context, Next } from 'hono';
import type { Env } from '../bindings';

interface RateLimitConfig {
  /** Unique prefix for the rate limit key (e.g. "auth_login") */
  keyPrefix: string;
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Window size in seconds */
  windowSeconds: number;
  /** Function to extract the rate limit key from the request (e.g. IP, token) */
  keyExtractor: (c: Context<{ Bindings: Env }>) => string;
}

/**
 * D1-based sliding window rate limiter.
 * Trades some latency (one DB query per request) for simplicity.
 * Acceptable for public endpoints — protects against automated attacks, not DDoS.
 */
export function rateLimiter(config: RateLimitConfig) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const identifier = config.keyExtractor(c);
    const key = `${config.keyPrefix}:${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - config.windowSeconds;

    try {
      // Clean old entry and get/increment current count in one flow
      const row = await c.env.DB.prepare(
        'SELECT window_start, count FROM rate_limits WHERE key = ?',
      )
        .bind(key)
        .first<{ window_start: number; count: number }>();

      if (!row || row.window_start < windowStart) {
        // No entry or expired window — start fresh
        await c.env.DB.prepare(
          'INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1) ' +
            'ON CONFLICT(key) DO UPDATE SET window_start = ?, count = 1',
        )
          .bind(key, now, now)
          .run();
      } else {
        // Active window — check limit
        if (row.count >= config.maxRequests) {
          const retryAfter = row.window_start + config.windowSeconds - now;
          return c.json(
            { error: 'För många förfrågningar. Försök igen senare.' },
            { status: 429, headers: { 'Retry-After': String(retryAfter) } },
          );
        }

        // Increment counter
        await c.env.DB.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?')
          .bind(key)
          .run();
      }
    } catch {
      // If rate limiting fails, allow the request through (fail-open)
      console.error('[rate-limiter] D1 error, allowing request');
    }

    await next();
  };
}

/** Rate limiter for auth/login: 10 requests per IP per hour */
export const loginRateLimiter = rateLimiter({
  keyPrefix: 'auth_login',
  maxRequests: 10,
  windowSeconds: 3600,
  keyExtractor: (c) =>
    c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown',
});

/** Rate limiter for RSVP respond: 5 requests per token per minute */
export const rsvpRespondRateLimiter = rateLimiter({
  keyPrefix: 'rsvp_respond',
  maxRequests: 5,
  windowSeconds: 60,
  keyExtractor: (c) => c.req.param('token') || 'unknown',
});
