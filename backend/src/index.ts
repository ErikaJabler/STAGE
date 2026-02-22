import { Hono } from "hono";
import type { Env, AuthVariables } from "./bindings";
import { errorHandler } from "./middleware/error-handler";
import { authMiddleware } from "./middleware/auth";
import events from "./routes/events";
import participants from "./routes/participants";
import mailings from "./routes/mailings";
import rsvp from "./routes/rsvp";
import images from "./routes/images";
import auth from "./routes/auth";
import permissions from "./routes/permissions";
import activities from "./routes/activities";
import search from "./routes/search";
import { processQueue } from "./services/email/send-queue";
import { templates } from "./services/email";

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

/* ---- Global error handler ---- */
app.onError(errorHandler);

/* ---- Public routes (no auth) ---- */

app.get("/stage/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.route("/stage/api/auth", auth);
app.route("/stage/api/rsvp", rsvp);

/* ---- Protected routes (auth required) ---- */

app.use("/stage/api/events/*", authMiddleware);
app.use("/stage/api/images/*", authMiddleware);
app.use("/stage/api/search/*", authMiddleware);
app.use("/stage/api/templates/*", authMiddleware);

app.route("/stage/api/events", events);
app.route("/stage/api/events/:eventId/participants", participants);
app.route("/stage/api/events/:eventId/mailings", mailings);
app.route("/stage/api/events/:eventId/permissions", permissions);
app.route("/stage/api/events/:eventId/activities", activities);
app.route("/stage/api/images", images);
app.route("/stage/api/search", search);

/** GET /api/templates — list available email templates */
app.get("/stage/api/templates", (c) => {
  return c.json(
    templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      defaultSubject: t.defaultSubject,
      body: t.body,
    }))
  );
});

/* ---- Bare /stage → redirect to /stage/ ---- */
app.get("/stage", (c) => c.redirect("/stage/"));

/* ---- Catch-all: serve frontend assets with path rewriting ---- */
app.all("/stage/*", async (c) => {
  // Strip /stage prefix so assets can be served from dist/
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace(/^\/stage/, "") || "/";

  const assetResponse = await c.env.ASSETS.fetch(
    new Request(url.toString(), c.req.raw)
  );

  // If asset found, serve it (only accept 2xx responses)
  if (assetResponse.ok) {
    return assetResponse;
  }

  // SPA fallback: serve index.html for client-side routes
  url.pathname = "/index.html";
  return c.env.ASSETS.fetch(new Request(url.toString(), c.req.raw));
});

export default {
  fetch: app.fetch,

  /** Cron Trigger — process email queue every 5 minutes */
  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<void> {
    const result = await processQueue(env.DB, env.RESEND_API_KEY);
    if (result.sent > 0 || result.failed > 0) {
      console.log(`[Cron] Email queue processed: ${result.sent} sent, ${result.failed} failed`);
    }
  },
};
