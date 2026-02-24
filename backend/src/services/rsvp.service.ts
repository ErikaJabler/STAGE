import type { Event, Participant } from '@stage/shared';
import { getParticipantByToken, updateParticipantStatus, getMaxQueuePosition } from '../db/queries';
import { WaitlistService } from './waitlist.service';

export const RsvpService = {
  /** Get participant + event info by RSVP token */
  async getByToken(
    db: D1Database,
    token: string,
  ): Promise<{ participant: Participant; event: Event } | null> {
    return getParticipantByToken(db, token);
  },

  /** Respond to RSVP (attending or declined), handling auto-waitlist + extra fields */
  async respond(
    db: D1Database,
    token: string,
    status: string,
    extra?: {
      dietary_notes?: string | null;
      plus_one_name?: string | null;
      plus_one_email?: string | null;
    },
  ): Promise<{
    ok: boolean;
    status: string;
    name: string;
    waitlisted?: boolean;
    error?: string;
  }> {
    const existing = await getParticipantByToken(db, token);
    if (!existing) {
      return { ok: false, status: '', name: '', error: 'Ogiltig eller utgången länk' };
    }

    // Save extra fields (dietary_notes, plus_one) regardless of status outcome
    if (extra) {
      const extraFields: string[] = [];
      const extraValues: unknown[] = [];
      if (extra.dietary_notes !== undefined) {
        extraFields.push('dietary_notes = ?');
        extraValues.push(extra.dietary_notes ?? null);
      }
      if (extra.plus_one_name !== undefined) {
        extraFields.push('plus_one_name = ?');
        extraValues.push(extra.plus_one_name ?? null);
      }
      if (extra.plus_one_email !== undefined) {
        extraFields.push('plus_one_email = ?');
        extraValues.push(extra.plus_one_email ?? null);
      }
      if (extraFields.length > 0) {
        extraFields.push('updated_at = ?');
        extraValues.push(new Date().toISOString());
        extraValues.push(token);
        await db
          .prepare(`UPDATE participants SET ${extraFields.join(', ')} WHERE cancellation_token = ?`)
          .bind(...extraValues)
          .run();
      }
    }

    // If trying to attend, check capacity — auto-waitlist if full
    if (status === 'attending') {
      const isFull = await WaitlistService.shouldWaitlist(db, existing.participant.event_id);
      if (isFull && existing.participant.status !== 'attending') {
        const maxPos = await getMaxQueuePosition(db, existing.participant.event_id);
        const now = new Date().toISOString();
        await db
          .prepare(
            "UPDATE participants SET status = 'waitlisted', queue_position = ?, updated_at = ? WHERE cancellation_token = ?",
          )
          .bind(maxPos + 1, now, token)
          .run();

        const updated = await db
          .prepare('SELECT * FROM participants WHERE cancellation_token = ?')
          .bind(token)
          .first<{ status: string; name: string }>();

        return {
          ok: true,
          status: updated?.status ?? 'waitlisted',
          name: updated?.name ?? existing.participant.name,
          waitlisted: true,
        };
      }
    }

    const participant = await updateParticipantStatus(db, token, status);
    if (!participant) {
      return { ok: false, status: '', name: '', error: 'Kunde inte uppdatera svar' };
    }

    return { ok: true, status: participant.status, name: participant.name };
  },

  /** Cancel attendance via RSVP token, with auto-promote */
  async cancel(
    db: D1Database,
    token: string,
  ): Promise<{
    ok: boolean;
    status: string;
    name: string;
    error?: string;
  }> {
    const existing = await getParticipantByToken(db, token);
    if (!existing) {
      return { ok: false, status: '', name: '', error: 'Ogiltig eller utgången länk' };
    }

    const wasAttending = existing.participant.status === 'attending';

    const participant = await updateParticipantStatus(db, token, 'cancelled');
    if (!participant) {
      return { ok: false, status: '', name: '', error: 'Kunde inte avboka' };
    }

    // If participant was attending, promote next from waitlist
    if (wasAttending) {
      await WaitlistService.promoteNext(db, existing.participant.event_id);
    }

    return { ok: true, status: participant.status, name: participant.name };
  },
};
