import { ZodSchema } from "zod";

/**
 * Parse input through a Zod schema.
 * Throws ZodError on failure — caught by error-handler middleware.
 */
export function parseBody<T>(schema: ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}
