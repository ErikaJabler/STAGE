import { Hono } from "hono";
import type { Env } from "../bindings";
import {
  listParticipants,
  getParticipantById,
  createParticipant,
  bulkCreateParticipants,
  updateParticipant,
  deleteParticipant,
  getEventById,
  shouldWaitlist,
  getMaxQueuePosition,
  promoteFromWaitlist,
  getAttendingCount,
  type CreateParticipantInput,
  type UpdateParticipantInput,
} from "../db/queries";

const participants = new Hono<{ Bindings: Env }>();

/** Validate eventId param and check event exists */
async function validateEvent(db: D1Database, eventIdStr: string) {
  const eventId = Number(eventIdStr);
  if (!Number.isFinite(eventId) || eventId < 1) {
    return { error: "Ogiltigt event-ID", status: 400 as const, eventId: 0 };
  }
  const event = await getEventById(db, eventId);
  if (!event) {
    return { error: "Event hittades inte", status: 404 as const, eventId: 0 };
  }
  return { error: null, status: 200 as const, eventId };
}

/** GET /api/events/:eventId/participants — List all participants for an event */
participants.get("/", async (c) => {
  const { error, status, eventId } = await validateEvent(
    c.env.DB,
    c.req.param("eventId") as string
  );
  if (error) return c.json({ error }, status);

  const results = await listParticipants(c.env.DB, eventId);
  return c.json(results);
});

/** POST /api/events/:eventId/participants — Add a participant */
participants.post("/", async (c) => {
  const { error, status, eventId } = await validateEvent(
    c.env.DB,
    c.req.param("eventId") as string
  );
  if (error) return c.json({ error }, status);

  const body = await c.req.json<CreateParticipantInput>();
  const errors = validateCreateParticipant(body);

  if (errors.length > 0) {
    return c.json({ error: "Valideringsfel", details: errors }, 400);
  }

  // Auto-waitlist: if status would be "attending" and event is at capacity
  if (!body.status || body.status === "attending") {
    const needsWaitlist = await shouldWaitlist(c.env.DB, eventId);
    if (needsWaitlist) {
      const maxPos = await getMaxQueuePosition(c.env.DB, eventId);
      body.status = "waitlisted";
      // Create with queue_position — we'll set it after creation
      const participant = await createParticipant(c.env.DB, eventId, body);
      await updateParticipant(c.env.DB, participant.id, { queue_position: maxPos + 1 });
      const updated = await getParticipantById(c.env.DB, participant.id);
      return c.json(updated!, 201);
    }
  }

  const participant = await createParticipant(c.env.DB, eventId, body);
  return c.json(participant, 201);
});

/** POST /api/events/:eventId/participants/import — Bulk import from CSV */
participants.post("/import", async (c) => {
  const { error, status, eventId } = await validateEvent(
    c.env.DB,
    c.req.param("eventId") as string
  );
  if (error) return c.json({ error }, status);

  const body = await c.req.parseBody();
  const file = body["file"];

  if (!file || !(file instanceof File)) {
    return c.json({ error: "CSV-fil krävs (form field 'file')" }, 400);
  }

  const csvText = await file.text();
  const { rows, parseErrors } = parseCSV(csvText);

  if (rows.length === 0 && parseErrors.length === 0) {
    return c.json({ error: "CSV-filen är tom" }, 400);
  }

  // Get existing participants to check for duplicate emails
  const existing = await listParticipants(c.env.DB, eventId);
  const existingEmails = new Set(existing.map((p) => p.email.toLowerCase()));

  const validRows: CreateParticipantInput[] = [];
  const skipped: { row: number; reason: string }[] = [];
  const seenEmails = new Set<string>();

  for (const { data, rowNumber } of rows) {
    // Validate required fields
    if (!data.name?.trim()) {
      skipped.push({ row: rowNumber, reason: "Namn saknas" });
      continue;
    }
    if (!data.email?.trim()) {
      skipped.push({ row: rowNumber, reason: "E-post saknas" });
      continue;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      skipped.push({ row: rowNumber, reason: `Ogiltig e-post: ${data.email}` });
      continue;
    }

    const emailLower = data.email.toLowerCase();

    // Check duplicate in this CSV
    if (seenEmails.has(emailLower)) {
      skipped.push({ row: rowNumber, reason: `Dubblett i CSV: ${data.email}` });
      continue;
    }

    // Check duplicate against existing participants
    if (existingEmails.has(emailLower)) {
      skipped.push({ row: rowNumber, reason: `Finns redan: ${data.email}` });
      continue;
    }

    seenEmails.add(emailLower);

    // Validate category if provided
    const validCategories = ["internal", "public_sector", "private_sector", "partner", "other"];
    const category = data.category && validCategories.includes(data.category)
      ? data.category
      : "other";

    validRows.push({
      name: data.name.trim(),
      email: data.email.trim(),
      company: data.company?.trim() || null,
      category,
    });
  }

  // Check capacity for auto-waitlist during bulk import
  const event = await getEventById(c.env.DB, eventId);
  let currentAttending = await getAttendingCount(c.env.DB, eventId);
  let maxQueuePos = await getMaxQueuePosition(c.env.DB, eventId);
  const capacity = event && event.max_participants !== null
    ? event.max_participants + (event.overbooking_limit ?? 0)
    : null;

  // Insert rows one by one, applying waitlist logic per row
  let created = 0;
  for (const input of validRows) {
    const status = input.status ?? "invited";
    // Only auto-waitlist if the row would be "attending" and we're at capacity
    if (status === "attending" && capacity !== null && currentAttending >= capacity) {
      input.status = "waitlisted";
    }

    const participant = await createParticipant(c.env.DB, eventId, input);

    if (input.status === "waitlisted" && status === "attending") {
      // Was auto-waitlisted — set queue position
      maxQueuePos++;
      await updateParticipant(c.env.DB, participant.id, { queue_position: maxQueuePos });
    } else if (participant.status === "attending") {
      currentAttending++;
    }

    created++;
  }

  return c.json({
    imported: created,
    skipped: skipped.length,
    total: rows.length + parseErrors.length,
    errors: [...parseErrors.map((e) => ({ row: e.row, reason: e.reason })), ...skipped],
  });
});

/** PUT /api/events/:eventId/participants/:id — Update a participant */
participants.put("/:id", async (c) => {
  const { error, status, eventId } = await validateEvent(
    c.env.DB,
    c.req.param("eventId") as string
  );
  if (error) return c.json({ error }, status);

  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: "Ogiltigt deltagare-ID" }, 400);
  }

  const body = await c.req.json<UpdateParticipantInput>();
  const errors = validateUpdateParticipant(body);

  if (errors.length > 0) {
    return c.json({ error: "Valideringsfel", details: errors }, 400);
  }

  // Check if participant was attending before the update
  const before = await getParticipantById(c.env.DB, id);
  if (!before) {
    return c.json({ error: "Deltagare hittades inte" }, 404);
  }

  const participant = await updateParticipant(c.env.DB, id, body);
  if (!participant) {
    return c.json({ error: "Deltagare hittades inte" }, 404);
  }

  // If status changed from "attending" to something else, promote next from waitlist
  if (before.status === "attending" && body.status && body.status !== "attending") {
    await promoteFromWaitlist(c.env.DB, eventId);
  }

  return c.json(participant);
});

/** PUT /api/events/:eventId/participants/:id/reorder — Update queue position */
participants.put("/:id/reorder", async (c) => {
  const { error, status, eventId } = await validateEvent(
    c.env.DB,
    c.req.param("eventId") as string
  );
  if (error) return c.json({ error }, status);

  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: "Ogiltigt deltagare-ID" }, 400);
  }

  const body = await c.req.json<{ queue_position: number }>();
  if (!Number.isFinite(body.queue_position) || body.queue_position < 1) {
    return c.json({ error: "queue_position måste vara ett positivt heltal" }, 400);
  }

  const participant = await getParticipantById(c.env.DB, id);
  if (!participant || participant.event_id !== eventId) {
    return c.json({ error: "Deltagare hittades inte" }, 404);
  }

  if (participant.status !== "waitlisted") {
    return c.json({ error: "Bara väntlistade deltagare kan omordnas" }, 400);
  }

  const oldPos = participant.queue_position ?? 0;
  const newPos = body.queue_position;

  if (oldPos === newPos) {
    return c.json(participant);
  }

  // Shift other waitlisted participants to make room
  const now = new Date().toISOString();
  if (newPos < oldPos) {
    // Moving up: shift positions down for those in [newPos, oldPos)
    await c.env.DB
      .prepare(
        "UPDATE participants SET queue_position = queue_position + 1, updated_at = ? WHERE event_id = ? AND status = 'waitlisted' AND queue_position >= ? AND queue_position < ? AND id != ?"
      )
      .bind(now, eventId, newPos, oldPos, id)
      .run();
  } else {
    // Moving down: shift positions up for those in (oldPos, newPos]
    await c.env.DB
      .prepare(
        "UPDATE participants SET queue_position = queue_position - 1, updated_at = ? WHERE event_id = ? AND status = 'waitlisted' AND queue_position > ? AND queue_position <= ? AND id != ?"
      )
      .bind(now, eventId, oldPos, newPos, id)
      .run();
  }

  const updated = await updateParticipant(c.env.DB, id, { queue_position: newPos });
  return c.json(updated);
});

/** DELETE /api/events/:eventId/participants/:id — Remove a participant */
participants.delete("/:id", async (c) => {
  const { error, status, eventId } = await validateEvent(
    c.env.DB,
    c.req.param("eventId") as string
  );
  if (error) return c.json({ error }, status);

  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: "Ogiltigt deltagare-ID" }, 400);
  }

  // Check if participant was attending before deletion
  const before = await getParticipantById(c.env.DB, id);
  const wasAttending = before?.status === "attending";

  const deleted = await deleteParticipant(c.env.DB, id);
  if (!deleted) {
    return c.json({ error: "Deltagare hittades inte" }, 404);
  }

  // If the deleted participant was attending, promote next from waitlist
  if (wasAttending) {
    await promoteFromWaitlist(c.env.DB, eventId);
  }

  return c.json({ ok: true });
});

/* ---- Validation ---- */

function validateCreateParticipant(body: CreateParticipantInput): string[] {
  const errors: string[] = [];

  if (!body.name?.trim()) errors.push("name krävs");
  if (!body.email?.trim()) errors.push("email krävs");

  if (
    body.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)
  ) {
    errors.push("email måste vara en giltig emailadress");
  }

  const validCategories = [
    "internal",
    "public_sector",
    "private_sector",
    "partner",
    "other",
  ];
  if (body.category && !validCategories.includes(body.category)) {
    errors.push(`category måste vara en av: ${validCategories.join(", ")}`);
  }

  const validStatuses = [
    "invited",
    "attending",
    "declined",
    "waitlisted",
    "cancelled",
  ];
  if (body.status && !validStatuses.includes(body.status)) {
    errors.push(`status måste vara en av: ${validStatuses.join(", ")}`);
  }

  return errors;
}

function validateUpdateParticipant(body: UpdateParticipantInput): string[] {
  const errors: string[] = [];

  if ("name" in body && !body.name?.trim()) {
    errors.push("name kan inte vara tomt");
  }
  if ("email" in body && !body.email?.trim()) {
    errors.push("email kan inte vara tomt");
  }
  if (
    body.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)
  ) {
    errors.push("email måste vara en giltig emailadress");
  }

  return errors;
}

/* ---- CSV parsing ---- */

interface CSVRow {
  name: string;
  email: string;
  company?: string;
  category?: string;
}

function parseCSV(text: string): {
  rows: { data: CSVRow; rowNumber: number }[];
  parseErrors: { row: number; reason: string }[];
} {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { rows: [], parseErrors: [] };

  // Parse header row — normalize to lowercase, trim whitespace
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map((h) =>
    h.toLowerCase().trim().replace(/^["']|["']$/g, "")
  );

  // Map headers to our fields (support common aliases)
  const nameIdx = headers.findIndex((h) =>
    ["namn", "name", "förnamn", "fullname", "full name"].includes(h)
  );
  const emailIdx = headers.findIndex((h) =>
    ["email", "e-post", "epost", "mail", "e-mail"].includes(h)
  );
  const companyIdx = headers.findIndex((h) =>
    ["företag", "company", "firma", "organisation", "org"].includes(h)
  );
  const categoryIdx = headers.findIndex((h) =>
    ["kategori", "category", "typ", "type"].includes(h)
  );

  if (nameIdx === -1 && emailIdx === -1) {
    // No recognized headers — try positional: name, email, company, category
    return parsePositional(lines);
  }

  const rows: { data: CSVRow; rowNumber: number }[] = [];
  const parseErrors: { row: number; reason: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.every((f) => !f.trim())) continue; // skip empty rows

    const row: CSVRow = {
      name: nameIdx >= 0 ? (fields[nameIdx] || "").trim() : "",
      email: emailIdx >= 0 ? (fields[emailIdx] || "").trim() : "",
      company: companyIdx >= 0 ? (fields[companyIdx] || "").trim() : undefined,
      category: categoryIdx >= 0 ? mapCategory((fields[categoryIdx] || "").trim()) : undefined,
    };

    rows.push({ data: row, rowNumber: i + 1 });
  }

  return { rows, parseErrors };
}

function parsePositional(lines: string[]): {
  rows: { data: CSVRow; rowNumber: number }[];
  parseErrors: { row: number; reason: string }[];
} {
  const rows: { data: CSVRow; rowNumber: number }[] = [];
  const parseErrors: { row: number; reason: string }[] = [];

  // First line might be data (no headers recognized)
  for (let i = 0; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.every((f) => !f.trim())) continue;

    // Need at least 2 fields (name, email)
    if (fields.length < 2) {
      parseErrors.push({ row: i + 1, reason: "Mindre än 2 kolumner" });
      continue;
    }

    rows.push({
      data: {
        name: fields[0].trim(),
        email: fields[1].trim(),
        company: fields[2]?.trim() || undefined,
        category: fields[3] ? mapCategory(fields[3].trim()) : undefined,
      },
      rowNumber: i + 1,
    });
  }

  return { rows, parseErrors };
}

/** Parse a single CSV line, handling quoted fields */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  const sep = line.includes(";") && !line.includes(",") ? ";" : ",";

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === sep) {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

/** Map Swedish/English category names to our internal values */
function mapCategory(value: string): string | undefined {
  const lower = value.toLowerCase();
  const map: Record<string, string> = {
    intern: "internal",
    internal: "internal",
    "offentlig sektor": "public_sector",
    public_sector: "public_sector",
    "privat sektor": "private_sector",
    private_sector: "private_sector",
    partner: "partner",
    övrig: "other",
    other: "other",
  };
  return map[lower] || undefined;
}

export default participants;
