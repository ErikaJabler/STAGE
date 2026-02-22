import { Hono } from "hono";
import type { Env, AuthVariables } from "../bindings";
import { PermissionService } from "../services/permission.service";
import { ActivityService } from "../services/activity.service";

const activities = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

/** GET / — list activities for an event */
activities.get("/", async (c) => {
  const eventId = Number(c.req.param("eventId"));
  if (isNaN(eventId)) return c.json({ error: "Ogiltigt event-ID" }, 400);

  const user = c.get("user");
  const canView = await PermissionService.canView(c.env.DB, user.id, eventId);
  if (!canView) return c.json({ error: "Åtkomst nekad" }, 403);

  const limit = Number(c.req.query("limit")) || 50;
  const activities_list = await ActivityService.list(c.env.DB, eventId, limit);
  return c.json(activities_list);
});

export default activities;
