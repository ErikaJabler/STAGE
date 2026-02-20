import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  eventsApi,
  type CreateEventPayload,
  type UpdateEventPayload,
} from "../api/client";

const EVENTS_KEY = ["events"] as const;

/** Fetch all events */
export function useEvents() {
  return useQuery({
    queryKey: EVENTS_KEY,
    queryFn: eventsApi.list,
  });
}

/** Fetch single event by ID */
export function useEvent(id: number) {
  return useQuery({
    queryKey: [...EVENTS_KEY, id],
    queryFn: () => eventsApi.get(id),
    enabled: id > 0,
  });
}

/** Create a new event */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEventPayload) => eventsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_KEY });
    },
  });
}

/** Update an existing event */
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEventPayload }) =>
      eventsApi.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: [...EVENTS_KEY, id] });
      queryClient.invalidateQueries({ queryKey: EVENTS_KEY });
    },
  });
}

/** Soft-delete an event */
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => eventsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_KEY });
    },
  });
}
