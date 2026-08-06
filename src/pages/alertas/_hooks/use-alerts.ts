import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alertsApi, type Alert, type CreateAlertInput } from "@/api/alerts";

type AlertFilter = "ACTIVE" | "RESOLVED" | "all";

export function useAlerts(filter: AlertFilter = "all") {
  return useQuery<Alert[]>({
    queryKey: ["alerts", filter],
    queryFn: () => alertsApi.list(filter !== "all" ? { status: filter } : {}),
    staleTime: 15 * 1000,
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAlertInput) => alertsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertsApi.resolve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
