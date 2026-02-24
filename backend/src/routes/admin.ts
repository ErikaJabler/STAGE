import { Hono } from 'hono';
import type { Env, AuthVariables } from '../bindings';
import { PermissionService } from '../services/permission.service';
import { AdminService } from '../services/admin.service';

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

export default admin;
