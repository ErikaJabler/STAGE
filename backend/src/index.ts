import { Hono } from "hono";
import type { Env } from "./bindings";
import events from "./routes/events";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.route("/api/events", events);

export default app;
