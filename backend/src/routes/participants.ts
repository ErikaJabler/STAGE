import { Hono } from 'hono';
import type { Env, AuthVariables } from '../bindings';
import { createParticipantSchema, updateParticipantSchema, reorderSchema } from '@stage/shared';
import { parseBody } from '../utils/validation';
import { parseIdParam, requireEvent } from '../utils/route-helpers';
import { ParticipantService } from '../services/participant.service';
import { WaitlistService } from '../services/waitlist.service';
import { PermissionService } from '../services/permission.service';
import { ActivityService } from '../services/activity.service';

const participants = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

/** GET /api/events/:eventId/participants — List all participants (viewer+) */
participants.get('/', async (c) => {
  const { eventId } = await requireEvent(c.env.DB, c.req.param('eventId') as string);

  const user = c.var.user;
  if (!(await PermissionService.canView(c.env.DB, user.id, eventId))) {
    return c.json({ error: 'Åtkomst nekad' }, 403);
  }

  const results = await ParticipantService.list(c.env.DB, eventId);
  return c.json(results);
});

/** POST /api/events/:eventId/participants — Add a participant (editor+) */
participants.post('/', async (c) => {
  const { eventId } = await requireEvent(c.env.DB, c.req.param('eventId') as string);

  const user = c.var.user;
  if (!(await PermissionService.canEdit(c.env.DB, user.id, eventId))) {
    return c.json({ error: 'Åtkomst nekad' }, 403);
  }

  const body = await c.req.json();
  const input = parseBody(createParticipantSchema, body);

  const participant = await ParticipantService.create(c.env.DB, eventId, input);
  await ActivityService.logParticipantAdded(
    c.env.DB,
    eventId,
    input.name,
    user.email,
    participant.id,
  );
  return c.json(participant, 201);
});

/** POST /api/events/:eventId/participants/import — Bulk import from CSV (editor+) */
participants.post('/import', async (c) => {
  const { eventId } = await requireEvent(c.env.DB, c.req.param('eventId') as string);

  const user = c.var.user;
  if (!(await PermissionService.canEdit(c.env.DB, user.id, eventId))) {
    return c.json({ error: 'Åtkomst nekad' }, 403);
  }

  const body = await c.req.parseBody();
  const file = body['file'];

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
participants.put('/:id', async (c) => {
  const { eventId } = await requireEvent(c.env.DB, c.req.param('eventId') as string);

  const user = c.var.user;
  if (!(await PermissionService.canEdit(c.env.DB, user.id, eventId))) {
    return c.json({ error: 'Åtkomst nekad' }, 403);
  }

  const id = parseIdParam(c.req.param('id'), 'deltagare-ID');

  // Fetch before-state for change detection
  const before = (await ParticipantService.list(c.env.DB, eventId)).find((p) => p.id === id);

  const body = await c.req.json();
  const input = parseBody(updateParticipantSchema, body);

  const participant = await ParticipantService.update(c.env.DB, eventId, id, input);
  if (!participant) {
    return c.json({ error: 'Deltagare hittades inte' }, 404);
  }

  // Log changes
  if (before) {
    const changedFields: string[] = [];
    const fieldLabels: Record<string, string> = {
      name: 'namn',
      email: 'e-post',
      company: 'företag',
      category: 'kategori',
      status: 'status',
      dietary_notes: 'kost',
      plus_one_name: 'plus-one',
      plus_one_email: 'plus-one e-post',
      plus_one_dietary_notes: 'plus-one kost',
      response_deadline: 'svarsfrist',
    };
    const inputRec = input as unknown as Record<string, unknown>;
    const beforeRec = before as unknown as Record<string, unknown>;
    for (const [key, label] of Object.entries(fieldLabels)) {
      if (key in input && inputRec[key] !== beforeRec[key]) {
        changedFields.push(label);
      }
    }

    if (changedFields.length > 0) {
      await ActivityService.logParticipantEdited(
        c.env.DB,
        eventId,
        id,
        participant.name,
        changedFields,
        user.email,
      );
    }

    // Log status change separately if status changed
    if (input.status && input.status !== before.status) {
      await ActivityService.logParticipantStatusChanged(
        c.env.DB,
        eventId,
        participant.name,
        before.status,
        input.status,
        user.email,
        id,
      );
    }
  }

  return c.json(participant);
});

/** PUT /api/events/:eventId/participants/:id/reorder — Update queue position (editor+) */
participants.put('/:id/reorder', async (c) => {
  const { eventId } = await requireEvent(c.env.DB, c.req.param('eventId') as string);

  const user = c.var.user;
  if (!(await PermissionService.canEdit(c.env.DB, user.id, eventId))) {
    return c.json({ error: 'Åtkomst nekad' }, 403);
  }

  const id = parseIdParam(c.req.param('id'), 'deltagare-ID');

  const body = await c.req.json();
  const input = parseBody(reorderSchema, body);

  const result = await WaitlistService.reorder(c.env.DB, eventId, id, input.queue_position);
  if (!result) {
    return c.json({ error: 'Deltagare hittades inte eller är inte väntlistad' }, 404);
  }

  return c.json(result);
});

/** GET /api/events/:eventId/participants/export — Export participants as CSV (viewer+) */
participants.get('/export', async (c) => {
  const { eventId } = await requireEvent(c.env.DB, c.req.param('eventId') as string);

  const user = c.var.user;
  if (!(await PermissionService.canView(c.env.DB, user.id, eventId))) {
    return c.json({ error: 'Åtkomst nekad' }, 403);
  }

  const csv = await ParticipantService.exportCSV(c.env.DB, eventId);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="deltagare-event-${eventId}.csv"`,
    },
  });
});

/** GET /api/events/:eventId/participants/export-catering — Catering export CSV (viewer+) */
participants.get('/export-catering', async (c) => {
  const { eventId } = await requireEvent(c.env.DB, c.req.param('eventId') as string);

  const user = c.var.user;
  if (!(await PermissionService.canView(c.env.DB, user.id, eventId))) {
    return c.json({ error: 'Åtkomst nekad' }, 403);
  }

  const csv = await ParticipantService.exportCateringCSV(c.env.DB, eventId);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="catering-event-${eventId}.csv"`,
    },
  });
});

/** GET /api/events/:eventId/participants/:id/activities — Activity log for participant (viewer+) */
participants.get('/:id/activities', async (c) => {
  const { eventId } = await requireEvent(c.env.DB, c.req.param('eventId') as string);

  const user = c.var.user;
  if (!(await PermissionService.canView(c.env.DB, user.id, eventId))) {
    return c.json({ error: 'Åtkomst nekad' }, 403);
  }

  const id = parseIdParam(c.req.param('id'), 'deltagare-ID');
  const activities = await ActivityService.listForParticipant(c.env.DB, eventId, id);
  return c.json(activities);
});

/** GET /api/events/:eventId/participants/:id/emails — Email history for participant (viewer+) */
participants.get('/:id/emails', async (c) => {
  const { eventId } = await requireEvent(c.env.DB, c.req.param('eventId') as string);

  const user = c.var.user;
  if (!(await PermissionService.canView(c.env.DB, user.id, eventId))) {
    return c.json({ error: 'Åtkomst nekad' }, 403);
  }

  const id = parseIdParam(c.req.param('id'), 'deltagare-ID');
  const history = await ParticipantService.getEmailHistory(c.env.DB, eventId, id);
  return c.json(history);
});

/** DELETE /api/events/:eventId/participants/:id — Remove a participant (editor+) */
participants.delete('/:id', async (c) => {
  const { eventId } = await requireEvent(c.env.DB, c.req.param('eventId') as string);

  const user = c.var.user;
  if (!(await PermissionService.canEdit(c.env.DB, user.id, eventId))) {
    return c.json({ error: 'Åtkomst nekad' }, 403);
  }

  const id = parseIdParam(c.req.param('id'), 'deltagare-ID');

  // Fetch participant name before deletion for activity log
  const participants_list = await ParticipantService.list(c.env.DB, eventId);
  const target = participants_list.find((p) => p.id === id);

  // Log activity BEFORE delete to satisfy FK constraint
  if (target) {
    await ActivityService.logParticipantRemoved(c.env.DB, eventId, target.name, user.email, id);
  }

  const deleted = await ParticipantService.delete(c.env.DB, eventId, id);
  if (!deleted) {
    return c.json({ error: 'Deltagare hittades inte' }, 404);
  }

  return c.json({ ok: true });
});

export default participants;
