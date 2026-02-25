import type { Activity, ActivityType } from '@stage/shared';
import { listActivities, listParticipantActivities, createActivity } from '../db/activity.queries';

export const ActivityService = {
  /** List activities for an event */
  list(db: D1Database, eventId: number, limit?: number): Promise<Activity[]> {
    return listActivities(db, eventId, limit);
  },

  /** List activities for a specific participant */
  listForParticipant(
    db: D1Database,
    eventId: number,
    participantId: number,
    limit?: number,
  ): Promise<Activity[]> {
    return listParticipantActivities(db, eventId, participantId, limit);
  },

  /** Log an activity */
  log(
    db: D1Database,
    eventId: number,
    type: ActivityType,
    description: string,
    createdBy?: string,
    metadata?: Record<string, unknown>,
    participantId?: number,
  ): Promise<Activity> {
    return createActivity(db, eventId, type, description, createdBy, metadata, participantId);
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
    participantId?: number,
  ) {
    return this.log(
      db,
      eventId,
      'participant_added',
      `Deltagare tillagd: ${participantName}`,
      createdBy,
      undefined,
      participantId,
    );
  },

  /** Log participant removed */
  logParticipantRemoved(
    db: D1Database,
    eventId: number,
    participantName: string,
    createdBy?: string,
    participantId?: number,
  ) {
    return this.log(
      db,
      eventId,
      'participant_removed',
      `Deltagare borttagen: ${participantName}`,
      createdBy,
      undefined,
      participantId,
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
    participantId?: number,
  ) {
    return this.log(
      db,
      eventId,
      'participant_status_changed',
      `${participantName}: ${oldStatus} → ${newStatus}`,
      createdBy,
      { oldStatus, newStatus },
      participantId,
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

  /** Log RSVP response */
  logRsvpResponded(
    db: D1Database,
    eventId: number,
    participantId: number,
    name: string,
    status: string,
  ) {
    const statusLabel =
      status === 'attending'
        ? 'Deltar'
        : status === 'declined'
          ? 'Avböjde'
          : status === 'waitlisted'
            ? 'Väntelista'
            : status;
    return this.log(
      db,
      eventId,
      'rsvp_responded',
      `${name} svarade: ${statusLabel}`,
      undefined,
      { status },
      participantId,
    );
  },

  /** Log RSVP cancellation */
  logRsvpCancelled(db: D1Database, eventId: number, participantId: number, name: string) {
    return this.log(
      db,
      eventId,
      'rsvp_cancelled',
      `${name} avbokade`,
      undefined,
      undefined,
      participantId,
    );
  },

  /** Log participant edited by admin */
  logParticipantEdited(
    db: D1Database,
    eventId: number,
    participantId: number,
    name: string,
    changedFields: string[],
    createdBy?: string,
  ) {
    return this.log(
      db,
      eventId,
      'participant_edited',
      `${name} redigerad: ${changedFields.join(', ')}`,
      createdBy,
      { changedFields },
      participantId,
    );
  },

  /** Log participant self-registration via website */
  logParticipantRegistered(db: D1Database, eventId: number, participantId: number, name: string) {
    return this.log(
      db,
      eventId,
      'participant_registered',
      `${name} anmälde sig via hemsidan`,
      undefined,
      undefined,
      participantId,
    );
  },

  /** Log waitlist promotion */
  logWaitlistPromoted(db: D1Database, eventId: number, participantId: number, name: string) {
    return this.log(
      db,
      eventId,
      'waitlist_promoted',
      `${name} flyttad från väntelista`,
      undefined,
      undefined,
      participantId,
    );
  },
};
