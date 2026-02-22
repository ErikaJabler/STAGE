import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  participantsApi,
  type CreateParticipantPayload,
  type UpdateParticipantPayload,
  type ImportParticipantsResult,
} from "../api/client";

const PARTICIPANTS_KEY = (eventId: number) =>
  ["events", eventId, "participants"] as const;

/** Fetch all participants for an event */
export function useParticipants(eventId: number) {
  return useQuery({
    queryKey: PARTICIPANTS_KEY(eventId),
    queryFn: () => participantsApi.list(eventId),
    enabled: eventId > 0,
  });
}

/** Create a new participant */
export function useCreateParticipant(eventId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateParticipantPayload) =>
      participantsApi.create(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARTICIPANTS_KEY(eventId) });
      queryClient.invalidateQueries({ queryKey: ["events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

/** Update an existing participant */
export function useUpdateParticipant(eventId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateParticipantPayload }) =>
      participantsApi.update(eventId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARTICIPANTS_KEY(eventId) });
      queryClient.invalidateQueries({ queryKey: ["events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

/** Delete a participant */
export function useDeleteParticipant(eventId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => participantsApi.delete(eventId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARTICIPANTS_KEY(eventId) });
      queryClient.invalidateQueries({ queryKey: ["events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

/** Reorder a waitlisted participant */
export function useReorderParticipant(eventId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, queuePosition }: { id: number; queuePosition: number }) =>
      participantsApi.reorder(eventId, id, queuePosition),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARTICIPANTS_KEY(eventId) });
    },
  });
}

/** Import participants from CSV */
export function useImportParticipants(eventId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => participantsApi.import(eventId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARTICIPANTS_KEY(eventId) });
      queryClient.invalidateQueries({ queryKey: ["events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
