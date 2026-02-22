import { useQuery } from "@tanstack/react-query";
import { templatesApi } from "../api/client";

export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: () => templatesApi.list(),
    staleTime: 60_000,
  });
}
