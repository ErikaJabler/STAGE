import type { Event, Participant } from "@stage/shared";
import { buildEmailHtml } from "./html-builder";
import { saveTheDate } from "./templates/save-the-date";
import { invitation } from "./templates/invitation";
import { waitlistTemplate } from "./templates/waitlist";
import { confirmation } from "./templates/confirmation";
import { reminder } from "./templates/reminder";
import { thankYou } from "./templates/thank-you";

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  defaultSubject: string;
  body: string;
  mergeFields: string[];
}

export interface MergeContext {
  name: string;
  event: string;
  datum: string;
  tid: string;
  plats: string;
  organizer: string;
  rsvp_link: string;
  calendar_link: string;
}

/** All available templates */
export const templates: TemplateDefinition[] = [
  saveTheDate,
  invitation,
  waitlistTemplate,
  confirmation,
  reminder,
  thankYou,
];

/** Get a template by ID */
export function getTemplate(id: string): TemplateDefinition | undefined {
  return templates.find((t) => t.id === id);
}

/** Build merge context from event + participant data */
export function buildMergeContext(
  event: Event,
  participant: Participant,
  baseUrl: string
): MergeContext {
  const rsvpUrl = `${baseUrl}/stage/rsvp/${participant.cancellation_token}`;
  const calendarUrl = `${baseUrl}/stage/api/events/${event.id}/calendar.ics`;

  return {
    name: participant.name,
    event: event.name,
    datum: event.date,
    tid: event.time,
    plats: event.location,
    organizer: `${event.organizer} (${event.organizer_email})`,
    rsvp_link: rsvpUrl,
    calendar_link: calendarUrl,
  };
}

/** Replace merge fields in a text string */
export function renderText(text: string, context: MergeContext): string {
  let result = text;
  for (const [key, value] of Object.entries(context)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

/** Replace merge fields in HTML — escapes values to prevent XSS */
export function renderHtml(html: string, context: MergeContext): string {
  let result = html;
  for (const [key, value] of Object.entries(context)) {
    // URLs should not be escaped (href attributes need raw URLs)
    const isUrl = key === "rsvp_link" || key === "calendar_link";
    const safeValue = isUrl ? value : escapeHtmlChars(value);
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), safeValue);
  }
  return result;
}

function escapeHtmlChars(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Render a complete email (text + HTML) from template or custom body */
export function renderEmail(
  body: string,
  subject: string,
  context: MergeContext,
  event: Event
): { subject: string; text: string; html: string } {
  let personalizedBody = body;

  // Auto-append RSVP link if not in body
  if (!personalizedBody.includes("{{rsvp_link}}") && context.rsvp_link) {
    personalizedBody += `\n\nSvara på inbjudan: {{rsvp_link}}`;
  }

  const renderedBody = renderText(personalizedBody, context);
  const renderedSubject = renderText(subject, context);

  const html = buildEmailHtml({
    body: renderedBody,
    recipientName: context.name,
    eventName: event.name,
    eventDate: event.date,
    eventTime: event.time,
    eventLocation: event.location,
    rsvpUrl: context.rsvp_link,
    calendarUrl: context.calendar_link,
  });

  return { subject: renderedSubject, text: renderedBody, html };
}
