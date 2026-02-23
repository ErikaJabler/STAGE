import { z } from "zod";

/* ---- Reusable patterns ---- */

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^\d{2}:\d{2}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const eventStatuses = ["planning", "upcoming", "ongoing", "completed", "cancelled"] as const;
const eventTypes = ["conference", "workshop", "seminar", "networking", "internal", "other"] as const;
const visibilities = ["public", "private"] as const;
const participantStatuses = ["invited", "attending", "declined", "waitlisted", "cancelled"] as const;
const participantCategories = ["internal", "public_sector", "private_sector", "partner", "other"] as const;
const recipientFilters = [
  "all", "invited", "attending", "declined", "waitlisted", "cancelled",
  "internal", "public_sector", "private_sector", "partner", "other",
] as const;

/* ---- Event schemas ---- */

export const createEventSchema = z.object({
  name: z.string().min(1, "name krävs"),
  date: z.string().regex(datePattern, "date måste vara YYYY-MM-DD"),
  time: z.string().regex(timePattern, "time måste vara HH:MM"),
  location: z.string().min(1, "location krävs"),
  organizer: z.string().min(1, "organizer krävs"),
  organizer_email: z.string().regex(emailPattern, "organizer_email måste vara en giltig emailadress"),
  created_by: z.string().optional(),
  emoji: z.string().nullish(),
  slug: z.string().optional(),
  end_date: z.string().regex(datePattern, "end_date måste vara YYYY-MM-DD").nullish(),
  end_time: z.string().regex(timePattern, "end_time måste vara HH:MM").nullish(),
  description: z.string().nullish(),
  status: z.enum(eventStatuses).optional(),
  type: z.enum(eventTypes).optional(),
  max_participants: z.number().min(1, "max_participants måste vara minst 1").nullish(),
  overbooking_limit: z.number().min(0).optional(),
  visibility: z.enum(visibilities).optional(),
  sender_mailbox: z.string().nullish(),
  gdpr_consent_text: z.string().nullish(),
  image_url: z.string().nullish(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = z.object({
  name: z.string().min(1, "name kan inte vara tomt").optional(),
  date: z.string().regex(datePattern, "date måste vara YYYY-MM-DD").optional(),
  time: z.string().regex(timePattern, "time måste vara HH:MM").optional(),
  location: z.string().min(1, "location kan inte vara tomt").optional(),
  organizer: z.string().min(1, "organizer kan inte vara tomt").optional(),
  organizer_email: z.string().regex(emailPattern, "organizer_email måste vara en giltig emailadress").optional(),
  emoji: z.string().nullish(),
  slug: z.string().optional(),
  end_date: z.string().regex(datePattern, "end_date måste vara YYYY-MM-DD").nullish(),
  end_time: z.string().regex(timePattern, "end_time måste vara HH:MM").nullish(),
  description: z.string().nullish(),
  status: z.enum(eventStatuses).optional(),
  type: z.enum(eventTypes).optional(),
  max_participants: z.number().min(1, "max_participants måste vara minst 1").nullish(),
  overbooking_limit: z.number().min(0).optional(),
  visibility: z.enum(visibilities).optional(),
  sender_mailbox: z.string().nullish(),
  gdpr_consent_text: z.string().nullish(),
  image_url: z.string().nullish(),
});

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

/* ---- Participant schemas ---- */

export const createParticipantSchema = z.object({
  name: z.string().min(1, "name krävs"),
  email: z.string().regex(emailPattern, "email måste vara en giltig emailadress"),
  company: z.string().nullish(),
  category: z.enum(participantCategories).optional(),
  status: z.enum(participantStatuses).optional(),
  response_deadline: z.string().nullish(),
  dietary_notes: z.string().nullish(),
  plus_one_name: z.string().nullish(),
  plus_one_email: z.string().regex(emailPattern, "plus_one_email måste vara en giltig emailadress").nullish(),
});

export type CreateParticipantInput = z.infer<typeof createParticipantSchema>;

export const updateParticipantSchema = z.object({
  name: z.string().min(1, "name kan inte vara tomt").optional(),
  email: z.string().regex(emailPattern, "email måste vara en giltig emailadress").optional(),
  company: z.string().nullish(),
  category: z.enum(participantCategories).optional(),
  status: z.enum(participantStatuses).optional(),
  queue_position: z.number().nullish(),
  response_deadline: z.string().nullish(),
  dietary_notes: z.string().nullish(),
  plus_one_name: z.string().nullish(),
  plus_one_email: z.string().regex(emailPattern, "plus_one_email måste vara en giltig emailadress").nullish(),
});

export type UpdateParticipantInput = z.infer<typeof updateParticipantSchema>;

/* ---- Mailing schema ---- */

export const createMailingSchema = z.object({
  subject: z.string().min(1, "subject krävs"),
  body: z.string().min(1, "body krävs"),
  html_body: z.string().nullish(),
  editor_data: z.string().nullish(),
  recipient_filter: z.enum(recipientFilters).optional(),
});

export type CreateMailingInput = z.infer<typeof createMailingSchema>;

export const updateMailingSchema = z.object({
  subject: z.string().min(1, "subject krävs").optional(),
  body: z.string().min(1, "body krävs").optional(),
  html_body: z.string().nullish(),
  editor_data: z.string().nullish(),
  recipient_filter: z.enum(recipientFilters).optional(),
});

export type UpdateMailingInput = z.infer<typeof updateMailingSchema>;

/* ---- RSVP schema ---- */

export const rsvpRespondSchema = z.object({
  status: z.enum(["attending", "declined"], {
    errorMap: () => ({ message: "status måste vara 'attending' eller 'declined'" }),
  }),
  dietary_notes: z.string().nullish(),
  plus_one_name: z.string().nullish(),
  plus_one_email: z.string().regex(emailPattern, "plus_one_email måste vara en giltig emailadress").nullish(),
});

/* ---- Reorder schema ---- */

export const reorderSchema = z.object({
  queue_position: z.number().int().min(1, "queue_position måste vara ett positivt heltal"),
});

/* ---- Auth schemas ---- */

const roles = ["owner", "editor", "viewer"] as const;

export const loginSchema = z.object({
  email: z.string().regex(emailPattern, "email måste vara en giltig emailadress"),
  name: z.string().min(1, "name krävs"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const addPermissionSchema = z.object({
  email: z.string().regex(emailPattern, "email måste vara en giltig emailadress"),
  name: z.string().min(1, "name krävs"),
  role: z.enum(roles, {
    errorMap: () => ({ message: "role måste vara 'owner', 'editor' eller 'viewer'" }),
  }),
});

export type AddPermissionInput = z.infer<typeof addPermissionSchema>;

/* ---- Website schemas ---- */

const websiteTemplates = ["hero-info", "hero-program-plats"] as const;

export const updateWebsiteSchema = z.object({
  template: z.enum(websiteTemplates).optional(),
  data: z.object({
    hero_title: z.string().optional(),
    hero_subtitle: z.string().optional(),
    program_items: z.array(z.object({
      time: z.string(),
      title: z.string(),
      description: z.string().optional(),
    })).optional(),
    venue_description: z.string().optional(),
    venue_address: z.string().optional(),
    custom_fields: z.array(z.object({
      label: z.string(),
      required: z.boolean(),
    })).optional(),
  }).optional(),
  published: z.boolean().optional(),
});

export type UpdateWebsiteInput = z.infer<typeof updateWebsiteSchema>;

export const publicRegisterSchema = z.object({
  name: z.string().min(1, "Namn krävs"),
  email: z.string().regex(emailPattern, "Ogiltig e-postadress"),
  company: z.string().nullish(),
  category: z.enum(participantCategories).optional(),
  dietary_notes: z.string().nullish(),
  plus_one_name: z.string().nullish(),
  plus_one_email: z.string().regex(emailPattern, "Ogiltig e-postadress för plusettgäst").nullish(),
  gdpr_consent: z.boolean().refine((v) => v === true, "GDPR-samtycke krävs"),
});

export type PublicRegisterInput = z.infer<typeof publicRegisterSchema>;
