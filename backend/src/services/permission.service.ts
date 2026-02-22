import type { User, EventPermission, EventPermissionWithUser, Role } from "@stage/shared";
import {
  getPermission,
  listPermissions,
  addPermission,
  removePermission,
} from "../db/permission.queries";
import { getOrCreateUser } from "../db/user.queries";

export const PermissionService = {
  /** Get the role a user has on an event, or null if no permission */
  async getRole(db: D1Database, userId: number, eventId: number): Promise<Role | null> {
    const perm = await getPermission(db, userId, eventId);
    return perm ? perm.role : null;
  },

  /** Check if user can view an event (any role) */
  async canView(db: D1Database, userId: number, eventId: number): Promise<boolean> {
    const role = await this.getRole(db, userId, eventId);
    return role !== null;
  },

  /** Check if user can edit an event (owner or editor) */
  async canEdit(db: D1Database, userId: number, eventId: number): Promise<boolean> {
    const role = await this.getRole(db, userId, eventId);
    return role === "owner" || role === "editor";
  },

  /** Check if user is owner of an event */
  async isOwner(db: D1Database, userId: number, eventId: number): Promise<boolean> {
    const role = await this.getRole(db, userId, eventId);
    return role === "owner";
  },

  /** List all permissions for an event */
  async listForEvent(db: D1Database, eventId: number): Promise<EventPermissionWithUser[]> {
    return listPermissions(db, eventId);
  },

  /** Add or update a permission. Creates user if needed. Only owners can manage permissions. */
  async addPermission(
    db: D1Database,
    eventId: number,
    email: string,
    name: string,
    role: Role
  ): Promise<EventPermission> {
    const token = crypto.randomUUID();
    const user = await getOrCreateUser(db, email, name, token);
    return addPermission(db, user.id, eventId, role);
  },

  /** Remove a permission. Returns false if not found. */
  async removePermission(
    db: D1Database,
    userId: number,
    eventId: number
  ): Promise<boolean> {
    return removePermission(db, userId, eventId);
  },

  /** Set the event creator as owner */
  async setOwner(db: D1Database, userId: number, eventId: number): Promise<EventPermission> {
    return addPermission(db, userId, eventId, "owner");
  },
};
