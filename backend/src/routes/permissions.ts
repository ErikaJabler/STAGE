import { Hono } from 'hono';
import type { Env, AuthVariables } from '../bindings';
import { addPermissionSchema } from '@stage/shared';
import { parseBody } from '../utils/validation';
import { PermissionService } from '../services/permission.service';
import { ActivityService } from '../services/activity.service';

const permissions = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

/** GET /api/events/:eventId/permissions — list all permissions for event */
permissions.get('/', async (c) => {
  const eventId = Number(c.req.param('eventId'));
  const user = c.var.user;

  const canView = await PermissionService.canView(c.env.DB, user.id, eventId);
  if (!canView) {
    return c.json({ error: 'Åtkomst nekad' }, 403);
  }

  const perms = await PermissionService.listForEvent(c.env.DB, eventId);
  return c.json(perms);
});

/** POST /api/events/:eventId/permissions — add/update permission (owner or admin) */
permissions.post('/', async (c) => {
  const eventId = Number(c.req.param('eventId'));
  const user = c.var.user;

  const isOwner = await PermissionService.isOwner(c.env.DB, user.id, eventId);
  const isAdmin = await PermissionService.isAdmin(c.env.DB, user.id);
  if (!isOwner && !isAdmin) {
    return c.json({ error: 'Bara ägaren eller admin kan hantera behörigheter' }, 403);
  }

  const body = await c.req.json();
  const { email, name, role } = parseBody(addPermissionSchema, body);

  const perm = await PermissionService.addPermission(c.env.DB, eventId, email, name, role);
  await ActivityService.logPermissionAdded(c.env.DB, eventId, email, role, user.email);
  return c.json(perm, 201);
});

/** DELETE /api/events/:eventId/permissions/:userId — remove permission (owner or admin) */
permissions.delete('/:userId', async (c) => {
  const eventId = Number(c.req.param('eventId'));
  const userId = Number(c.req.param('userId'));
  const user = c.var.user;

  const isOwner = await PermissionService.isOwner(c.env.DB, user.id, eventId);
  const isAdmin = await PermissionService.isAdmin(c.env.DB, user.id);
  if (!isOwner && !isAdmin) {
    return c.json({ error: 'Bara ägaren eller admin kan hantera behörigheter' }, 403);
  }

  // Prevent owner from removing themselves
  if (userId === user.id) {
    return c.json({ error: 'Du kan inte ta bort din egen ägarbehörighet' }, 400);
  }

  const removed = await PermissionService.removePermission(c.env.DB, userId, eventId);
  if (!removed) {
    return c.json({ error: 'Behörighet hittades inte' }, 404);
  }

  return c.json({ ok: true });
});

export default permissions;
