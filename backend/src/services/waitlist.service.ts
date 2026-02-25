import type { Participant } from '@stage/shared';
import {
  getParticipantById,
  createParticipant,
  updateParticipant,
  getAttendingCount,
  getMaxQueuePosition,
  promoteFromWaitlist,
  shouldWaitlist,
  type CreateParticipantInput,
} from '../db/queries';
import { ActivityService } from './activity.service';

export const WaitlistService = {
  /** Check if event is at capacity */
  shouldWaitlist(db: D1Database, eventId: number): Promise<boolean> {
    return shouldWaitlist(db, eventId);
  },

  /** Get attending count for an event */
  getAttendingCount(db: D1Database, eventId: number): Promise<number> {
    return getAttendingCount(db, eventId);
  },

  /** Get max queue position for an event */
  getMaxQueuePosition(db: D1Database, eventId: number): Promise<number> {
    return getMaxQueuePosition(db, eventId);
  },

  /** Promote next waitlisted participant to attending */
  async promoteNext(db: D1Database, eventId: number): Promise<Participant | null> {
    const promoted = await promoteFromWaitlist(db, eventId);
    if (promoted) {
      try {
        await ActivityService.logWaitlistPromoted(db, eventId, promoted.id, promoted.name);
      } catch {
        /* logging must not break promotion */
      }
    }
    return promoted;
  },

  /** Create a participant as waitlisted with queue position */
  async createWaitlisted(
    db: D1Database,
    eventId: number,
    input: CreateParticipantInput,
  ): Promise<Participant> {
    const maxPos = await getMaxQueuePosition(db, eventId);
    input.status = 'waitlisted';
    const participant = await createParticipant(db, eventId, input);
    await updateParticipant(db, participant.id, { queue_position: maxPos + 1 });
    const updated = await getParticipantById(db, participant.id);
    return updated!;
  },

  /** Reorder a waitlisted participant's queue position */
  async reorder(
    db: D1Database,
    eventId: number,
    participantId: number,
    newPos: number,
  ): Promise<Participant | null> {
    const participant = await getParticipantById(db, participantId);
    if (!participant || participant.event_id !== eventId) return null;
    if (participant.status !== 'waitlisted') return null;

    const oldPos = participant.queue_position ?? 0;
    if (oldPos === newPos) return participant;

    const now = new Date().toISOString();

    // This requires raw SQL for bulk position shifts — we accept this
    // as a thin DB operation that doesn't belong in queries layer either.
    // We'll pass db directly for this specific case.
    if (newPos < oldPos) {
      // Moving up: shift positions down for those in [newPos, oldPos)
      await db
        .prepare(
          "UPDATE participants SET queue_position = queue_position + 1, updated_at = ? WHERE event_id = ? AND status = 'waitlisted' AND queue_position >= ? AND queue_position < ? AND id != ?",
        )
        .bind(now, eventId, newPos, oldPos, participantId)
        .run();
    } else {
      // Moving down: shift positions up for those in (oldPos, newPos]
      await db
        .prepare(
          "UPDATE participants SET queue_position = queue_position - 1, updated_at = ? WHERE event_id = ? AND status = 'waitlisted' AND queue_position > ? AND queue_position <= ? AND id != ?",
        )
        .bind(now, eventId, oldPos, newPos, participantId)
        .run();
    }

    return updateParticipant(db, participantId, { queue_position: newPos });
  },
};
