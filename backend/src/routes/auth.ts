import { Hono } from "hono";
import type { Env } from "../bindings";
import { loginSchema } from "@stage/shared";
import { parseBody } from "../utils/validation";
import { getUserByEmail, getUserByToken, createUser } from "../db/user.queries";

const auth = new Hono<{ Bindings: Env }>();

/**
 * POST /api/auth/login
 * Simple token auth: email + name → returns user with token.
 * Creates user if not exists, returns existing token if already registered.
 * In production, replace with Azure AD flow.
 */
auth.post("/login", async (c) => {
  const body = await c.req.json();
  const { email, name } = parseBody(loginSchema, body);

  let user = await getUserByEmail(c.env.DB, email);

  if (!user) {
    const token = crypto.randomUUID();
    user = await createUser(c.env.DB, email, name, token);
  }

  return c.json({
    user: { id: user.id, email: user.email, name: user.name, is_admin: user.is_admin === 1 },
    token: user.token,
  });
});

/** GET /api/auth/me — returns current user from token */
auth.get("/me", async (c) => {
  const token = c.req.header("X-Auth-Token");
  if (!token) {
    return c.json({ error: "Autentisering krävs" }, 401);
  }

  const user = await getUserByToken(c.env.DB, token);
  if (!user) {
    return c.json({ error: "Ogiltig token" }, 401);
  }

  return c.json({
    user: { id: user.id, email: user.email, name: user.name, is_admin: user.is_admin === 1 },
  });
});

export default auth;
