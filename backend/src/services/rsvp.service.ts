import type { Event, Participant } from "@stage/shared";
import {
  getParticipantByToken,
  updateParticipantStatus,
  getMaxQueuePosition,
} from "../db/queries";
import { WaitlistService } from "./waitlist.service";

export const RsvpService = {
  /** Get participant + event info by RSVP token */
  async getByToken(
    db: D1Database,
    token: string
  ): Promise<{ participant: Participant; event: Event } | null> {
    return getParticipantByToken(db, token);
  },

  /** Respond to RSVP (attending or declined), handling auto-waitlist */
  async respond(
    db: D1Database,
    token: string,
    status: string
  ): Promise<{
    ok: boolean;
    status: string;
    name: string;
    waitlisted?: boolean;
    error?: string;
  }> {
    const existing = await getParticipantByToken(db, token);
    if (!existing) {
      return { ok: false, status: "", name: "", error: "Ogiltig eller utgången länk" };
    }

    // If trying to attend, check capacity — auto-waitlist if full
    if (status === "attending") {
      const isFull = await WaitlistService.shouldWaitlist(db, existing.participant.event_id);
      if (isFull && existing.participant.status !== "attending") {
        const maxPos = await getMaxQueuePosition(db, existing.participant.event_id);
        const now = new Date().toISOString();
        await db
          .prepare(
            "UPDATE participants SET status = 'waitlisted', queue_position = ?, updated_at = ? WHERE cancellation_token = ?"
          )
          .bind(maxPos + 1, now, token)
          .run();

        const updated = await db
          .prepare("SELECT * FROM participants WHERE cancellation_token = ?")
          .bind(token)
          .first<{ status: string; name: string }>();

        return {
          ok: true,
          status: updated?.status ?? "waitlisted",
          name: updated?.name ?? existing.participant.name,
          waitlisted: true,
        };
      }
    }

    const participant = await updateParticipantStatus(db, token, status);
    if (!participant) {
      return { ok: false, status: "", name: "", error: "Kunde inte uppdatera svar" };
    }

    return { ok: true, status: participant.status, name: participant.name };
  },

  /** Cancel attendance via RSVP token, with auto-promote */
  async cancel(
    db: D1Database,
    token: string
  ): Promise<{
    ok: boolean;
    status: string;
    name: string;
    error?: string;
  }> {
    const existing = await getParticipantByToken(db, token);
    if (!existing) {
      return { ok: false, status: "", name: "", error: "Ogiltig eller utgången länk" };
    }

    const wasAttending = existing.participant.status === "attending";

    const participant = await updateParticipantStatus(db, token, "cancelled");
    if (!participant) {
      return { ok: false, status: "", name: "", error: "Kunde inte avboka" };
    }

    // If participant was attending, promote next from waitlist
    if (wasAttending) {
      await WaitlistService.promoteNext(db, existing.participant.event_id);
    }

    return { ok: true, status: participant.status, name: participant.name };
  },
};
