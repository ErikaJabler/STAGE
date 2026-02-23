import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/client";

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => adminApi.dashboard(),
  });
}

export function useAdminEvents() {
  return useQuery({
    queryKey: ["admin", "events"],
    queryFn: () => adminApi.events(),
  });
}
