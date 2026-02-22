import type { Participant } from "@stage/shared";
import {
  listParticipants,
  getParticipantById,
  createParticipant,
  updateParticipant,
  deleteParticipant,
  getEventById,
  type CreateParticipantInput,
  type UpdateParticipantInput,
} from "../db/queries";
import { WaitlistService } from "./waitlist.service";

/* ---- CSV parsing ---- */

interface CSVRow {
  name: string;
  email: string;
  company?: string;
  category?: string;
}

export function parseCSV(text: string): {
  rows: { data: CSVRow; rowNumber: number }[];
  parseErrors: { row: number; reason: string }[];
} {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { rows: [], parseErrors: [] };

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map((h) =>
    h.toLowerCase().trim().replace(/^["']|["']$/g, "")
  );

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
    return parsePositional(lines);
  }

  const rows: { data: CSVRow; rowNumber: number }[] = [];
  const parseErrors: { row: number; reason: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.every((f) => !f.trim())) continue;

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

  for (let i = 0; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.every((f) => !f.trim())) continue;

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

/* ---- Validation ---- */

export function validateCreateParticipant(body: CreateParticipantInput): string[] {
  const errors: string[] = [];

  if (!body.name?.trim()) errors.push("name krävs");
  if (!body.email?.trim()) errors.push("email krävs");

  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.push("email måste vara en giltig emailadress");
  }

  const validCategories = ["internal", "public_sector", "private_sector", "partner", "other"];
  if (body.category && !validCategories.includes(body.category)) {
    errors.push(`category måste vara en av: ${validCategories.join(", ")}`);
  }

  const validStatuses = ["invited", "attending", "declined", "waitlisted", "cancelled"];
  if (body.status && !validStatuses.includes(body.status)) {
    errors.push(`status måste vara en av: ${validStatuses.join(", ")}`);
  }

  return errors;
}

export function validateUpdateParticipant(body: UpdateParticipantInput): string[] {
  const errors: string[] = [];

  if ("name" in body && !body.name?.trim()) {
    errors.push("name kan inte vara tomt");
  }
  if ("email" in body && !body.email?.trim()) {
    errors.push("email kan inte vara tomt");
  }
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.push("email måste vara en giltig emailadress");
  }

  return errors;
}

/* ---- Service ---- */

export const ParticipantService = {
  list(db: D1Database, eventId: number): Promise<Participant[]> {
    return listParticipants(db, eventId);
  },

  getById(db: D1Database, id: number): Promise<Participant | null> {
    return getParticipantById(db, id);
  },

  async create(
    db: D1Database,
    eventId: number,
    input: CreateParticipantInput
  ): Promise<Participant> {
    // Auto-waitlist: if status would be "attending" and event is at capacity
    if (!input.status || input.status === "attending") {
      const needsWaitlist = await WaitlistService.shouldWaitlist(db, eventId);
      if (needsWaitlist) {
        return WaitlistService.createWaitlisted(db, eventId, input);
      }
    }

    return createParticipant(db, eventId, input);
  },

  async update(
    db: D1Database,
    eventId: number,
    id: number,
    input: UpdateParticipantInput
  ): Promise<Participant | null> {
    const before = await getParticipantById(db, id);
    if (!before) return null;

    const participant = await updateParticipant(db, id, input);
    if (!participant) return null;

    // If status changed from "attending" to something else, promote next from waitlist
    if (before.status === "attending" && input.status && input.status !== "attending") {
      await WaitlistService.promoteNext(db, eventId);
    }

    return participant;
  },

  async delete(db: D1Database, eventId: number, id: number): Promise<boolean> {
    const before = await getParticipantById(db, id);
    const wasAttending = before?.status === "attending";

    const deleted = await deleteParticipant(db, id);
    if (!deleted) return false;

    if (wasAttending) {
      await WaitlistService.promoteNext(db, eventId);
    }

    return true;
  },

  async importCSV(
    db: D1Database,
    eventId: number,
    csvText: string
  ): Promise<{
    imported: number;
    skipped: number;
    total: number;
    errors: { row: number; reason: string }[];
  }> {
    const { rows, parseErrors } = parseCSV(csvText);

    if (rows.length === 0 && parseErrors.length === 0) {
      throw new Error("CSV-filen är tom");
    }

    // Get existing participants to check for duplicate emails
    const existing = await listParticipants(db, eventId);
    const existingEmails = new Set(existing.map((p) => p.email.toLowerCase()));

    const validRows: CreateParticipantInput[] = [];
    const skipped: { row: number; reason: string }[] = [];
    const seenEmails = new Set<string>();

    for (const { data, rowNumber } of rows) {
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

      if (seenEmails.has(emailLower)) {
        skipped.push({ row: rowNumber, reason: `Dubblett i CSV: ${data.email}` });
        continue;
      }

      if (existingEmails.has(emailLower)) {
        skipped.push({ row: rowNumber, reason: `Finns redan: ${data.email}` });
        continue;
      }

      seenEmails.add(emailLower);

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
    const event = await getEventById(db, eventId);
    let currentAttending = await WaitlistService.getAttendingCount(db, eventId);
    let maxQueuePos = await WaitlistService.getMaxQueuePosition(db, eventId);
    const capacity = event && event.max_participants !== null
      ? event.max_participants + (event.overbooking_limit ?? 0)
      : null;

    let created = 0;
    for (const input of validRows) {
      const status = input.status ?? "invited";
      if (status === "attending" && capacity !== null && currentAttending >= capacity) {
        input.status = "waitlisted";
      }

      const participant = await createParticipant(db, eventId, input);

      if (input.status === "waitlisted" && status === "attending") {
        maxQueuePos++;
        await updateParticipant(db, participant.id, { queue_position: maxQueuePos });
      } else if (participant.status === "attending") {
        currentAttending++;
      }

      created++;
    }

    return {
      imported: created,
      skipped: skipped.length,
      total: rows.length + parseErrors.length,
      errors: [...parseErrors.map((e) => ({ row: e.row, reason: e.reason })), ...skipped],
    };
  },
};
