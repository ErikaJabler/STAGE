import { Hono } from 'hono';
import type { Env, AuthVariables } from '../bindings';
import { PermissionService } from '../services/permission.service';
import { AdminService } from '../services/admin.service';
import { listAllUsers, updateUserAdmin, deleteUser } from '../db/user.queries';

const admin = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

/** Admin guard — returns 403 if user is not a global admin */
admin.use('*', async (c, next) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: 'Autentisering krävs' }, 401);
  }
  const isAdmin = await PermissionService.isAdmin(c.env.DB, user.id);
  if (!isAdmin) {
    return c.json({ error: 'Administratörsåtkomst krävs' }, 403);
  }
  return next();
});

/** GET /api/admin/dashboard — aggregated cross-event stats */
admin.get('/dashboard', async (c) => {
  const data = await AdminService.getDashboardData(c.env.DB);
  return c.json(data);
});

/** GET /api/admin/events — list ALL events (admin sees everything) */
admin.get('/events', async (c) => {
  const events = await AdminService.listAllEvents(c.env.DB);
  return c.json(events);
});

/** GET /api/admin/users — list all registered users */
admin.get('/users', async (c) => {
  const users = await listAllUsers(c.env.DB);
  return c.json(users);
});

/** PUT /api/admin/users/:id — update admin status */
admin.put('/users/:id', async (c) => {
  const userId = Number(c.req.param('id'));
  const currentUser = c.var.user!;
  if (userId === currentUser.id) {
    return c.json({ error: 'Du kan inte ändra din egen admin-behörighet' }, 400);
  }
  const body = await c.req.json<{ is_admin: boolean }>();
  await updateUserAdmin(c.env.DB, userId, body.is_admin);
  return c.json({ ok: true });
});

/** DELETE /api/admin/users/:id — delete a user */
admin.delete('/users/:id', async (c) => {
  const userId = Number(c.req.param('id'));
  const currentUser = c.var.user!;
  if (userId === currentUser.id) {
    return c.json({ error: 'Du kan inte ta bort dig själv' }, 400);
  }
  await deleteUser(c.env.DB, userId);
  return c.json({ ok: true });
});

export default admin;
