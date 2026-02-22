import type { ErrorHandler } from "hono";
import { ZodError } from "zod";
import type { Env } from "../bindings";

/**
 * Global error handler for Hono.
 * - ZodError → 400 with structured validation errors
 * - Everything else → 500
 */
export const errorHandler: ErrorHandler<{ Bindings: Env }> = (err, c) => {
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => e.message);
    return c.json({ error: "Valideringsfel", details }, 400);
  }

  console.error("Unhandled error:", err);
  return c.json({ error: "Internt serverfel" }, 500);
};
