import type { Event, EventWithCount } from "@stage/shared";

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

export { ApiError };
