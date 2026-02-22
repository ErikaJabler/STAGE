import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mailingsApi, type CreateMailingPayload } from '../api/client';

const MAILINGS_KEY = (eventId: number) => ['events', eventId, 'mailings'];

export function useMailings(eventId: number) {
  return useQuery({
    queryKey: MAILINGS_KEY(eventId),
    queryFn: () => mailingsApi.list(eventId),
    enabled: eventId > 0,
  });
}

export function useCreateMailing(eventId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMailingPayload) =>
      mailingsApi.create(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAILINGS_KEY(eventId) });
    },
  });
}

export function useSendMailing(eventId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mailingId: number) =>
      mailingsApi.send(eventId, mailingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAILINGS_KEY(eventId) });
    },
  });
}

export function useSendTestMailing(eventId: number) {
  return useMutation({
    mutationFn: (mailingId: number) =>
      mailingsApi.sendTest(eventId, mailingId),
  });
}
