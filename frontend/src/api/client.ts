import type { Event, EventWithCount, Participant, Mailing, Activity } from "@stage/shared";

const BASE_URL = "/stage/api";
const TOKEN_KEY = 'stage_auth_token';

class ApiError extends Error {
  constructor(
    public status: number,
    public details?: string[]
  ) {
    super(`API-fel: ${status}`);
    this.name = "ApiError";
  }
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    headers["X-Auth-Token"] = token;
  }
  return headers;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: getAuthHeaders(),
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      (body as { details?: string[] }).details
    );
  }

  return res.json() as Promise<T>;
}

/** Event API */
export const eventsApi = {
  list: () => request<EventWithCount[]>("/events"),

  get: (id: number) => request<EventWithCount>(`/events/${id}`),

  create: (data: CreateEventPayload) =>
    request<Event>("/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdateEventPayload) =>
    request<Event>(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<{ ok: boolean }>(`/events/${id}`, {
      method: "DELETE",
    }),

  clone: (id: number) =>
    request<Event>(`/events/${id}/clone`, {
      method: "POST",
    }),
};

/** Payload types for create/update */
export interface CreateEventPayload {
  name: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  organizer_email: string;
  slug?: string;
  emoji?: string | null;
  end_date?: string | null;
  end_time?: string | null;
  description?: string | null;
  status?: string;
  type?: string;
  max_participants?: number | null;
  overbooking_limit?: number;
  visibility?: string;
  sender_mailbox?: string | null;
  gdpr_consent_text?: string | null;
  image_url?: string | null;
}

export interface UpdateEventPayload {
  name?: string;
  slug?: string;
  date?: string;
  time?: string;
  location?: string;
  organizer?: string;
  organizer_email?: string;
  emoji?: string | null;
  end_date?: string | null;
  end_time?: string | null;
  description?: string | null;
  status?: string;
  type?: string;
  max_participants?: number | null;
  overbooking_limit?: number;
  visibility?: string;
  sender_mailbox?: string | null;
  gdpr_consent_text?: string | null;
  image_url?: string | null;
}

/** Participant API */
export const participantsApi = {
  list: (eventId: number) =>
    request<Participant[]>(`/events/${eventId}/participants`),

  create: (eventId: number, data: CreateParticipantPayload) =>
    request<Participant>(`/events/${eventId}/participants`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (eventId: number, id: number, data: UpdateParticipantPayload) =>
    request<Participant>(`/events/${eventId}/participants/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (eventId: number, id: number) =>
    request<{ ok: boolean }>(`/events/${eventId}/participants/${id}`, {
      method: "DELETE",
    }),

  reorder: (eventId: number, id: number, queuePosition: number) =>
    request<Participant>(`/events/${eventId}/participants/${id}/reorder`, {
      method: "PUT",
      body: JSON.stringify({ queue_position: queuePosition }),
    }),

  import: async (eventId: number, file: File): Promise<ImportParticipantsResult> => {
    const formData = new FormData();
    formData.append("file", file);
    const headers: Record<string, string> = {};
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers["X-Auth-Token"] = token;
    const res = await fetch(`${BASE_URL}/events/${eventId}/participants/import`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, (body as { details?: string[] }).details);
    }
    return res.json() as Promise<ImportParticipantsResult>;
  },
};

export interface ImportParticipantsResult {
  imported: number;
  skipped: number;
  total: number;
  errors: { row: number; reason: string }[];
}

export interface CreateParticipantPayload {
  name: string;
  email: string;
  company?: string | null;
  category?: string;
  status?: string;
  response_deadline?: string | null;
  dietary_notes?: string | null;
  plus_one_name?: string | null;
  plus_one_email?: string | null;
}

export interface UpdateParticipantPayload {
  name?: string;
  email?: string;
  company?: string | null;
  category?: string;
  status?: string;
  queue_position?: number | null;
  response_deadline?: string | null;
  dietary_notes?: string | null;
  plus_one_name?: string | null;
  plus_one_email?: string | null;
}

/** Mailing API */
export const mailingsApi = {
  list: (eventId: number) =>
    request<Mailing[]>(`/events/${eventId}/mailings`),

  create: (eventId: number, data: CreateMailingPayload) =>
    request<Mailing>(`/events/${eventId}/mailings`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  send: (eventId: number, mailingId: number) =>
    request<SendMailingResult>(`/events/${eventId}/mailings/${mailingId}/send`, {
      method: "POST",
    }),

  sendTest: (eventId: number, mailingId: number) =>
    request<{ ok: boolean; sentTo: string }>(`/events/${eventId}/mailings/${mailingId}/test`, {
      method: "POST",
    }),
};

export interface CreateMailingPayload {
  subject: string;
  body: string;
  recipient_filter?: string;
}

export interface SendMailingResult {
  mailing: Mailing;
  sent: number;
  failed: number;
  total: number;
  errors?: string[];
}

/** Permissions API */
export interface PermissionEntry {
  id: number;
  user_id: number;
  event_id: number;
  role: string;
  created_at: string;
  user_email: string;
  user_name: string;
}

export const permissionsApi = {
  list: (eventId: number) =>
    request<PermissionEntry[]>(`/events/${eventId}/permissions`),

  add: (eventId: number, data: { email: string; name: string; role: string }) =>
    request<{ id: number; user_id: number; event_id: number; role: string }>(`/events/${eventId}/permissions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  remove: (eventId: number, userId: number) =>
    request<{ ok: boolean }>(`/events/${eventId}/permissions/${userId}`, {
      method: "DELETE",
    }),
};

/** RSVP API (public, token-based) */
export interface RsvpInfo {
  participant: {
    name: string;
    email: string;
    status: string;
    company: string | null;
    dietary_notes: string | null;
    plus_one_name: string | null;
    plus_one_email: string | null;
  };
  event: {
    name: string;
    emoji: string | null;
    date: string;
    time: string;
    end_time: string | null;
    location: string;
    description: string | null;
    image_url: string | null;
  };
}

export interface RsvpResponse {
  ok: boolean;
  status: string;
  name: string;
}

export interface RsvpRespondPayload {
  status: "attending" | "declined";
  dietary_notes?: string | null;
  plus_one_name?: string | null;
  plus_one_email?: string | null;
}

export const rsvpApi = {
  get: (token: string) =>
    request<RsvpInfo>(`/rsvp/${token}`),

  respond: (token: string, data: RsvpRespondPayload) =>
    request<RsvpResponse>(`/rsvp/${token}/respond`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  cancel: (token: string) =>
    request<RsvpResponse>(`/rsvp/${token}/cancel`, {
      method: "POST",
    }),
};

/** Images API */
export const imagesApi = {
  upload: async (file: File): Promise<{ url: string; key: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const headers: Record<string, string> = {};
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers["X-Auth-Token"] = token;
    const res = await fetch(`${BASE_URL}/images`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, (body as { details?: string[] }).details);
    }
    return res.json() as Promise<{ url: string; key: string }>;
  },
};

/** Activities API */
export const activitiesApi = {
  list: (eventId: number, limit?: number) =>
    request<Activity[]>(`/events/${eventId}/activities${limit ? `?limit=${limit}` : ""}`),
};

/** Search API */
export const searchApi = {
  search: (q: string) =>
    request<EventWithCount[]>(`/search?q=${encodeURIComponent(q)}`),
};

/** Templates API */
export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  defaultSubject: string;
  body: string;
}

export const templatesApi = {
  list: () => request<EmailTemplate[]>("/templates"),
};

export { ApiError };
