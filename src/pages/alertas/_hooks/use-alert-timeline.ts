import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alertsApi } from "@/lib/api";
import type { AlertEvent, AddAlertEventRequest } from "@/types";

export function useAlertEvents(alertId: string | null) {
  return useQuery<AlertEvent[]>({
    queryKey: ["alert-events", alertId],
    queryFn: () => (alertId ? alertsApi.getEvents(alertId) : Promise.resolve([])),
    enabled: !!alertId,
    staleTime: 5 * 1000,
  });
}

export function useAddAlertEvent(alertId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddAlertEventRequest) =>
      alertId ? alertsApi.addEvent(alertId, data) : Promise.reject("No alert ID"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert-events", alertId] });
    },
  });
}

export function useGenerateAISummary(alertId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      alertId ? alertsApi.generateAISummary(alertId) : Promise.reject("No alert ID"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alert-events", alertId] });
    },
  });
}
