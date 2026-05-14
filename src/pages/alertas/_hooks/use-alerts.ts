import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alertsApi } from "@/lib/api";
import type { Alert } from "@/types";

type AlertFilter = "ACTIVE" | "RESOLVED" | "all";

export function useAlerts(filter: AlertFilter = "all") {
  return useQuery<Alert[]>({
    queryKey: ["alerts", filter],
    queryFn: () =>
      alertsApi.list(filter !== "all" ? { status: filter } : undefined),
    staleTime: 15 * 1000,
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      resolvedByAgentId,
    }: {
      id: string;
      resolvedByAgentId: string;
    }) => alertsApi.resolve(id, { resolvedByAgentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
