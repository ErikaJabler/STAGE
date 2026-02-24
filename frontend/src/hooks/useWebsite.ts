import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { websiteApi, type UpdateWebsitePayload } from '../api/client';

export function useWebsite(eventId: number) {
  return useQuery({
    queryKey: ['website', eventId],
    queryFn: () => websiteApi.get(eventId),
  });
}

export function useSaveWebsite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: number; data: UpdateWebsitePayload }) =>
      websiteApi.save(eventId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['website', variables.eventId] });
    },
  });
}
