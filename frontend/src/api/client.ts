import type { Event, EventWithCount, Participant } from "@stage/shared";

const BASE_URL = "/api";

class ApiError extends Error {
  constructor(
    public status: number,
    public details?: string[]
  ) {
    super(`API-fel: ${status}`);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
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
};

export interface CreateParticipantPayload {
  name: string;
  email: string;
  company?: string | null;
  category?: string;
  status?: string;
  response_deadline?: string | null;
}

export interface UpdateParticipantPayload {
  name?: string;
  email?: string;
  company?: string | null;
  category?: string;
  status?: string;
  queue_position?: number | null;
  response_deadline?: string | null;
}

export { ApiError };
