/**
 * Barrel re-export — keeps existing import paths working.
 * Actual implementations live in domain-specific files:
 *   - event.queries.ts
 *   - participant.queries.ts
 *   - mailing.queries.ts
 *   - waitlist.queries.ts
 */
export * from "./event.queries";
export * from "./participant.queries";
export * from "./mailing.queries";
export * from "./waitlist.queries";
export * from "./user.queries";
export * from "./permission.queries";
