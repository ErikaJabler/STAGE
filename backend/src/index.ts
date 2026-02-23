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
import website from "./routes/website";
import admin from "./routes/admin";
import { WebsiteService } from "./services/website.service";
import { processQueue } from "./services/email/send-queue";
import { templates, getTemplate, renderText, buildEmailHtml } from "./services/email";

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

/* ---- Global error handler ---- */
app.onError(errorHandler);

/* ---- Public routes (no auth) ---- */

app.get("/stage/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.route("/stage/api/auth", auth);
app.route("/stage/api/rsvp", rsvp);

/** GET /api/public/events/:slug — public event data for website rendering (no auth) */
app.get("/stage/api/public/events/:slug", async (c) => {
  const slug = c.req.param("slug");
  const event = await WebsiteService.getPublicEvent(c.env.DB, slug);
  if (!event) {
    return c.json({ error: "Event hittades inte eller är inte publicerat" }, 404);
  }
  return c.json({ event });
});


/* ---- Protected routes (auth required) ---- */

app.use("/stage/api/events/*", async (c, next) => {
  // Public registration endpoint — no auth required
  if (c.req.method === "POST" && c.req.path.endsWith("/register")) {
    return next();
  }
  return authMiddleware(c, next);
});
app.use("/stage/api/images/*", async (c, next) => {
  // GET images is public (served with cache headers, UUID-based keys)
  // POST upload requires auth
  if (c.req.method === "GET") return next();
  return authMiddleware(c, next);
});
app.use("/stage/api/admin/*", authMiddleware);
app.use("/stage/api/search/*", authMiddleware);
app.use("/stage/api/templates/*", authMiddleware);

app.route("/stage/api/events", events);
app.route("/stage/api/events/:eventId/participants", participants);
app.route("/stage/api/events/:eventId/mailings", mailings);
app.route("/stage/api/events/:eventId/permissions", permissions);
app.route("/stage/api/events/:eventId/activities", activities);
app.route("/stage/api/events", website);
app.route("/stage/api/admin", admin);
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

/** GET /api/templates/:type/preview — render template with example data */
app.get("/stage/api/templates/:type/preview", (c) => {
  const type = c.req.param("type");
  const template = getTemplate(type);
  if (!template) {
    return c.json({ error: "Mall hittades inte" }, 404);
  }

  const exampleContext = {
    name: "Anna Andersson",
    event: "Consid Sommarmingel 2026",
    datum: "2026-06-15",
    tid: "17:00",
    plats: "Göteborg, Eriksberg",
    organizer: "Erik Svensson (erik.svensson@consid.se)",
    rsvp_link: "https://example.com/rsvp/preview",
    calendar_link: "https://example.com/calendar.ics",
  };

  const renderedBody = renderText(template.body, exampleContext);
  const renderedSubject = renderText(template.defaultSubject, exampleContext);

  const html = buildEmailHtml({
    body: renderedBody,
    recipientName: exampleContext.name,
    eventName: "Consid Sommarmingel 2026",
    eventDate: exampleContext.datum,
    eventTime: exampleContext.tid,
    eventLocation: exampleContext.plats,
    rsvpUrl: exampleContext.rsvp_link,
    calendarUrl: exampleContext.calendar_link,
  });

  return c.html(html);
});

/* ---- Bare /stage → redirect to /stage/ ---- */
app.get("/stage", (c) => c.redirect("/stage/"));

/* ---- Catch-all: serve frontend assets with path rewriting ---- */
app.all("/stage/*", async (c) => {
  // Strip /stage prefix so assets can be served from dist/
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace(/^\/stage/, "") || "/";

  // Use a clean GET request to ASSETS — do NOT forward the browser's
  // request mode/credentials (crossorigin="anonymous" on <script type=module>
  // sets mode:"cors" which can cause ASSETS to return responses the browser rejects).
  const assetResponse = await c.env.ASSETS.fetch(url.toString());

  if (assetResponse.ok) {
    // Stale asset detection: if a .js/.css/.woff2 request got text/html back,
    // the SPA fallback served index.html for a non-existent hashed bundle.
    // Return 404 so the browser doesn't try to parse HTML as JavaScript.
    const ct = assetResponse.headers.get("content-type") || "";
    if (/\.\w{2,}$/.test(url.pathname) && ct.includes("text/html")) {
      return new Response("Not Found", { status: 404 });
    }
    return assetResponse;
  }

  // SPA fallback: serve index.html for client-side routes (e.g. /e/:slug, /login)
  url.pathname = "/index.html";
  return c.env.ASSETS.fetch(url.toString());
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
