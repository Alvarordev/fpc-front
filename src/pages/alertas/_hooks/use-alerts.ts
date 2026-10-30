import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { alertsApi, type Alert, type CreateAlertInput } from "@/api/alerts"

type AlertFilter = Alert["status"] | "all"

export function useAlerts(filter: AlertFilter = "all") {
  return useQuery<Alert[]>({
    queryKey: ["alerts", filter],
    queryFn: () => alertsApi.list(filter !== "all" ? { status: filter } : {}),
    staleTime: 15 * 1000,
  })
}

function invalidateAlertQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["alerts"] })
  queryClient.invalidateQueries({ queryKey: ["alert-events"] })
}

export function useCreateAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAlertInput) => alertsApi.create(data),
    onSuccess: () => invalidateAlertQueries(queryClient),
  })
}

export function useReviewAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => alertsApi.update(id, { status: "IN_REVIEW" }),
    onSuccess: () => invalidateAlertQueries(queryClient),
  })
}

export function useResolveAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      resolutionNotes,
    }: {
      id: string
      resolutionNotes: string
    }) => alertsApi.resolve(id, resolutionNotes),
    onSuccess: () => invalidateAlertQueries(queryClient),
  })
}
