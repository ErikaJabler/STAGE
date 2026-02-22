import { Hono } from "hono";
import type { Env } from "../bindings";
import { RsvpService } from "../services/rsvp.service";

const rsvp = new Hono<{ Bindings: Env }>();

/** GET /api/rsvp/:token — Get participant + event info */
rsvp.get("/:token", async (c) => {
  const token = c.req.param("token");

  const result = await RsvpService.getByToken(c.env.DB, token);
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
    return c.json({ error: "status måste vara 'attending' eller 'declined'" }, 400);
  }

  const result = await RsvpService.respond(c.env.DB, token, body.status);

  if (!result.ok) {
    const statusCode = result.error === "Ogiltig eller utgången länk" ? 404 : 500;
    return c.json({ error: result.error }, statusCode);
  }

  return c.json({
    ok: true,
    status: result.status,
    name: result.name,
    ...(result.waitlisted ? { waitlisted: true } : {}),
  });
});

/** POST /api/rsvp/:token/cancel — Cancel attendance */
rsvp.post("/:token/cancel", async (c) => {
  const token = c.req.param("token");

  const result = await RsvpService.cancel(c.env.DB, token);

  if (!result.ok) {
    const statusCode = result.error === "Ogiltig eller utgången länk" ? 404 : 500;
    return c.json({ error: result.error }, statusCode);
  }

  return c.json({
    ok: true,
    status: result.status,
    name: result.name,
  });
});

export default rsvp;
