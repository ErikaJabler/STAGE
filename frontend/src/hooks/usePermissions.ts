import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionsApi } from '../api/client';

const PERMISSIONS_KEY = (eventId: number) => ['permissions', eventId] as const;

export function usePermissions(eventId: number) {
  return useQuery({
    queryKey: PERMISSIONS_KEY(eventId),
    queryFn: () => permissionsApi.list(eventId),
    enabled: eventId > 0,
  });
}

export function useAddPermission(eventId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email: string; name: string; role: string }) =>
      permissionsApi.add(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMISSIONS_KEY(eventId) });
    },
  });
}

export function useRemovePermission(eventId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => permissionsApi.remove(eventId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMISSIONS_KEY(eventId) });
    },
  });
}
