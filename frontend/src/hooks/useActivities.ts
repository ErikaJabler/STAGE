import { useQuery } from '@tanstack/react-query';
import { activitiesApi } from '../api/client';

export function useActivities(eventId: number, limit?: number) {
  return useQuery({
    queryKey: ['activities', eventId, limit],
    queryFn: () => activitiesApi.list(eventId, limit),
    enabled: eventId > 0,
  });
}
