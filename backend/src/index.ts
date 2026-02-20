import { Hono } from "hono";
import type { Env } from "./bindings";
import events from "./routes/events";
import participants from "./routes/participants";

const app = new Hono<{ Bindings: Env }>();

/* ---- API routes (under /stage/api/) ---- */

app.get("/stage/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.route("/stage/api/events", events);
app.route("/stage/api/events/:eventId/participants", participants);

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

  // If asset found, serve it
  if (assetResponse.status !== 404) {
    return assetResponse;
  }

  // SPA fallback: serve index.html for client-side routes
  url.pathname = "/index.html";
  return c.env.ASSETS.fetch(new Request(url.toString(), c.req.raw));
});

export default app;
