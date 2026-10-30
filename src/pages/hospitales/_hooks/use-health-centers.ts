import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  healthCentersApi,
  type HealthCenterListFilters,
  type UpdateHealthCenterInput,
} from "@/api/health-centers"

export function useHealthCenters(
  filters: HealthCenterListFilters = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["healthCenters", filters],
    queryFn: () => healthCentersApi.list(filters),
    enabled: options.enabled ?? true,
    staleTime: 30 * 1000,
  })
}

export function useCreateHealthCenter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: healthCentersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthCenters"] })
      queryClient.invalidateQueries({ queryKey: ["health-centers"] })
      queryClient.invalidateQueries({ queryKey: ["health-center"] })
    },
  })
}

export function useUpdateHealthCenter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateHealthCenterInput
    }) => healthCentersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthCenters"] })
      queryClient.invalidateQueries({ queryKey: ["health-centers"] })
      queryClient.invalidateQueries({ queryKey: ["health-center"] })
    },
  })
}

export function useDeleteHealthCenter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => healthCentersApi.update(id, { isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthCenters"] })
      queryClient.invalidateQueries({ queryKey: ["health-centers"] })
      queryClient.invalidateQueries({ queryKey: ["health-center"] })
    },
  })
}

export function useReactivateHealthCenter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => healthCentersApi.update(id, { isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthCenters"] })
      queryClient.invalidateQueries({ queryKey: ["health-centers"] })
      queryClient.invalidateQueries({ queryKey: ["health-center"] })
    },
  })
}
