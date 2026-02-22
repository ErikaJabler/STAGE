import { Hono } from "hono";
import type { Env, AuthVariables } from "../bindings";
import { createParticipantSchema, updateParticipantSchema, reorderSchema } from "@stage/shared";
import { parseBody } from "../utils/validation";
import { getEventById } from "../db/queries";
import { ParticipantService } from "../services/participant.service";
import { WaitlistService } from "../services/waitlist.service";
import { PermissionService } from "../services/permission.service";
import { ActivityService } from "../services/activity.service";

const participants = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

/** Validate eventId param and check event exists */
async function validateEvent(db: D1Database, eventIdStr: string) {
  const eventId = Number(eventIdStr);
  if (!Number.isFinite(eventId) || eventId < 1) {
    return { error: "Ogiltigt event-ID", status: 400 as const, eventId: 0 };
  }
  const event = await getEventById(db, eventId);
  if (!event) {
    return { error: "Event hittades inte", status: 404 as const, eventId: 0 };
  }
  return { error: null, status: 200 as const, eventId };
}

/** GET /api/events/:eventId/participants — List all participants (viewer+) */
participants.get("/", async (c) => {
  const { error, status, eventId } = await validateEvent(c.env.DB, c.req.param("eventId") as string);
  if (error) return c.json({ error }, status);

  const user = c.var.user;
  if (!(await PermissionService.canView(c.env.DB, user.id, eventId))) {
    return c.json({ error: "Åtkomst nekad" }, 403);
  }

  const results = await ParticipantService.list(c.env.DB, eventId);
  return c.json(results);
});

/** POST /api/events/:eventId/participants — Add a participant (editor+) */
participants.post("/", async (c) => {
  const { error, status, eventId } = await validateEvent(c.env.DB, c.req.param("eventId") as string);
  if (error) return c.json({ error }, status);

  const user = c.var.user;
  if (!(await PermissionService.canEdit(c.env.DB, user.id, eventId))) {
    return c.json({ error: "Åtkomst nekad" }, 403);
  }

  const body = await c.req.json();
  const input = parseBody(createParticipantSchema, body);

  const participant = await ParticipantService.create(c.env.DB, eventId, input);
  await ActivityService.logParticipantAdded(c.env.DB, eventId, input.name, user.email);
  return c.json(participant, 201);
});

/** POST /api/events/:eventId/participants/import — Bulk import from CSV (editor+) */
participants.post("/import", async (c) => {
  const { error, status, eventId } = await validateEvent(c.env.DB, c.req.param("eventId") as string);
  if (error) return c.json({ error }, status);

  const user = c.var.user;
  if (!(await PermissionService.canEdit(c.env.DB, user.id, eventId))) {
    return c.json({ error: "Åtkomst nekad" }, 403);
  }

  const body = await c.req.parseBody();
  const file = body["file"];

  if (!file || !(file instanceof File)) {
    return c.json({ error: "CSV-fil krävs (form field 'file')" }, 400);
  }

  const csvText = await file.text();

  try {
    const result = await ParticipantService.importCSV(c.env.DB, eventId, csvText);
    if (result.imported > 0) {
      await ActivityService.logParticipantImported(c.env.DB, eventId, result.imported, user.email);
    }
    return c.json(result);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 400);
  }
});

/** PUT /api/events/:eventId/participants/:id — Update a participant (editor+) */
participants.put("/:id", async (c) => {
  const { error, status, eventId } = await validateEvent(c.env.DB, c.req.param("eventId") as string);
  if (error) return c.json({ error }, status);

  const user = c.var.user;
  if (!(await PermissionService.canEdit(c.env.DB, user.id, eventId))) {
    return c.json({ error: "Åtkomst nekad" }, 403);
  }

  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: "Ogiltigt deltagare-ID" }, 400);
  }

  const body = await c.req.json();
  const input = parseBody(updateParticipantSchema, body);

  const participant = await ParticipantService.update(c.env.DB, eventId, id, input);
  if (!participant) {
    return c.json({ error: "Deltagare hittades inte" }, 404);
  }

  return c.json(participant);
});

/** PUT /api/events/:eventId/participants/:id/reorder — Update queue position (editor+) */
participants.put("/:id/reorder", async (c) => {
  const { error, status, eventId } = await validateEvent(c.env.DB, c.req.param("eventId") as string);
  if (error) return c.json({ error }, status);

  const user = c.var.user;
  if (!(await PermissionService.canEdit(c.env.DB, user.id, eventId))) {
    return c.json({ error: "Åtkomst nekad" }, 403);
  }

  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: "Ogiltigt deltagare-ID" }, 400);
  }

  const body = await c.req.json();
  const input = parseBody(reorderSchema, body);

  const result = await WaitlistService.reorder(c.env.DB, eventId, id, input.queue_position);
  if (!result) {
    return c.json({ error: "Deltagare hittades inte eller är inte väntlistad" }, 404);
  }

  return c.json(result);
});

/** GET /api/events/:eventId/participants/export — Export participants as CSV (viewer+) */
participants.get("/export", async (c) => {
  const { error, status, eventId } = await validateEvent(c.env.DB, c.req.param("eventId") as string);
  if (error) return c.json({ error }, status);

  const user = c.var.user;
  if (!(await PermissionService.canView(c.env.DB, user.id, eventId))) {
    return c.json({ error: "Åtkomst nekad" }, 403);
  }

  const csv = await ParticipantService.exportCSV(c.env.DB, eventId);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="deltagare-event-${eventId}.csv"`,
    },
  });
});

/** DELETE /api/events/:eventId/participants/:id — Remove a participant (editor+) */
participants.delete("/:id", async (c) => {
  const { error, status, eventId } = await validateEvent(c.env.DB, c.req.param("eventId") as string);
  if (error) return c.json({ error }, status);

  const user = c.var.user;
  if (!(await PermissionService.canEdit(c.env.DB, user.id, eventId))) {
    return c.json({ error: "Åtkomst nekad" }, 403);
  }

  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: "Ogiltigt deltagare-ID" }, 400);
  }

  // Fetch participant name before deletion for activity log
  const participants_list = await ParticipantService.list(c.env.DB, eventId);
  const target = participants_list.find((p) => p.id === id);

  const deleted = await ParticipantService.delete(c.env.DB, eventId, id);
  if (!deleted) {
    return c.json({ error: "Deltagare hittades inte" }, 404);
  }

  if (target) {
    await ActivityService.logParticipantRemoved(c.env.DB, eventId, target.name, user.email);
  }

  return c.json({ ok: true });
});

export default participants;
