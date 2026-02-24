import type { Activity, ActivityType } from '@stage/shared';
import { listActivities, createActivity } from '../db/activity.queries';

export const ActivityService = {
  /** List activities for an event */
  list(db: D1Database, eventId: number, limit?: number): Promise<Activity[]> {
    return listActivities(db, eventId, limit);
  },

  /** Log an activity */
  log(
    db: D1Database,
    eventId: number,
    type: ActivityType,
    description: string,
    createdBy?: string,
    metadata?: Record<string, unknown>,
  ): Promise<Activity> {
    return createActivity(db, eventId, type, description, createdBy, metadata);
  },

  /** Log mailing created */
  logMailingCreated(db: D1Database, eventId: number, subject: string, createdBy?: string) {
    return this.log(db, eventId, 'mailing_created', `Utskick skapat: "${subject}"`, createdBy);
  },

  /** Log mailing sent */
  logMailingSent(
    db: D1Database,
    eventId: number,
    subject: string,
    recipientCount: number,
    createdBy?: string,
  ) {
    return this.log(
      db,
      eventId,
      'mailing_sent',
      `Utskick skickat: "${subject}" till ${recipientCount} mottagare`,
      createdBy,
      { recipientCount },
    );
  },

  /** Log participant added */
  logParticipantAdded(
    db: D1Database,
    eventId: number,
    participantName: string,
    createdBy?: string,
  ) {
    return this.log(
      db,
      eventId,
      'participant_added',
      `Deltagare tillagd: ${participantName}`,
      createdBy,
    );
  },

  /** Log participant removed */
  logParticipantRemoved(
    db: D1Database,
    eventId: number,
    participantName: string,
    createdBy?: string,
  ) {
    return this.log(
      db,
      eventId,
      'participant_removed',
      `Deltagare borttagen: ${participantName}`,
      createdBy,
    );
  },

  /** Log participant status changed */
  logParticipantStatusChanged(
    db: D1Database,
    eventId: number,
    participantName: string,
    oldStatus: string,
    newStatus: string,
    createdBy?: string,
  ) {
    return this.log(
      db,
      eventId,
      'participant_status_changed',
      `${participantName}: ${oldStatus} → ${newStatus}`,
      createdBy,
      { oldStatus, newStatus },
    );
  },

  /** Log participants imported */
  logParticipantImported(db: D1Database, eventId: number, count: number, createdBy?: string) {
    return this.log(
      db,
      eventId,
      'participant_imported',
      `${count} deltagare importerade via CSV`,
      createdBy,
      { count },
    );
  },

  /** Log event updated */
  logEventUpdated(db: D1Database, eventId: number, fields: string[], createdBy?: string) {
    return this.log(
      db,
      eventId,
      'event_updated',
      `Event uppdaterat: ${fields.join(', ')}`,
      createdBy,
      { fields },
    );
  },

  /** Log permission added */
  logPermissionAdded(
    db: D1Database,
    eventId: number,
    userEmail: string,
    role: string,
    createdBy?: string,
  ) {
    return this.log(
      db,
      eventId,
      'permission_added',
      `Behörighet tillagd: ${userEmail} (${role})`,
      createdBy,
      { userEmail, role },
    );
  },

  /** Log permission removed */
  logPermissionRemoved(db: D1Database, eventId: number, userEmail: string, createdBy?: string) {
    return this.log(
      db,
      eventId,
      'permission_removed',
      `Behörighet borttagen: ${userEmail}`,
      createdBy,
    );
  },
};
