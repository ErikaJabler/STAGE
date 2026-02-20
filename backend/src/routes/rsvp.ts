import { Hono } from "hono";
import type { Env } from "../bindings";
import {
  getParticipantByToken,
  updateParticipantStatus,
} from "../db/queries";

const rsvp = new Hono<{ Bindings: Env }>();

/** GET /api/rsvp/:token — Get participant + event info */
rsvp.get("/:token", async (c) => {
  const token = c.req.param("token");

  const result = await getParticipantByToken(c.env.DB, token);
  if (!result) {
    return c.json({ error: "Ogiltig eller utgången länk" }, 404);
  }

  const { participant, event } = result;

  return c.json({
    participant: {
      name: participant.name,
      email: participant.email,
      status: participant.status,
      company: participant.company,
    },
    event: {
      name: event.name,
      emoji: event.emoji,
      date: event.date,
      time: event.time,
      end_time: event.end_time,
      location: event.location,
      description: event.description,
    },
  });
});

/** POST /api/rsvp/:token/respond — Respond attending or declined */
rsvp.post("/:token/respond", async (c) => {
  const token = c.req.param("token");
  const body = await c.req.json<{ status: string }>();

  if (!body.status || !["attending", "declined"].includes(body.status)) {
    return c.json(
      { error: "status måste vara 'attending' eller 'declined'" },
      400
    );
  }

  // Check token is valid first
  const existing = await getParticipantByToken(c.env.DB, token);
  if (!existing) {
    return c.json({ error: "Ogiltig eller utgången länk" }, 404);
  }

  const participant = await updateParticipantStatus(
    c.env.DB,
    token,
    body.status
  );

  if (!participant) {
    return c.json({ error: "Kunde inte uppdatera svar" }, 500);
  }

  return c.json({
    ok: true,
    status: participant.status,
    name: participant.name,
  });
});

/** POST /api/rsvp/:token/cancel — Cancel attendance */
rsvp.post("/:token/cancel", async (c) => {
  const token = c.req.param("token");

  // Check token is valid first
  const existing = await getParticipantByToken(c.env.DB, token);
  if (!existing) {
    return c.json({ error: "Ogiltig eller utgången länk" }, 404);
  }

  const participant = await updateParticipantStatus(
    c.env.DB,
    token,
    "cancelled"
  );

  if (!participant) {
    return c.json({ error: "Kunde inte avboka" }, 500);
  }

  return c.json({
    ok: true,
    status: participant.status,
    name: participant.name,
  });
});

export default rsvp;
