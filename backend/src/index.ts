import { Hono } from "hono";
import type { Env } from "./bindings";
import events from "./routes/events";
import participants from "./routes/participants";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.route("/api/events", events);
app.route("/api/events/:eventId/participants", participants);

export default app;
