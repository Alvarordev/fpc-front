import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { healthCentersApi, type UpdateHealthCenterInput } from "@/api/health-centers";

export function useHealthCenters() {
  return useQuery({
    queryKey: ["healthCenters"],
    queryFn: () => healthCentersApi.list(),
    staleTime: 60 * 1000,
  });
}

export function useCreateHealthCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: healthCentersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthCenters"] });
    },
  });
}

export function useUpdateHealthCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateHealthCenterInput;
    }) => healthCentersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthCenters"] });
    },
  });
}

export function useDeleteHealthCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => healthCentersApi.update(id, { isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthCenters"] });
    },
  });
}

export function useReactivateHealthCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => healthCentersApi.update(id, { isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthCenters"] });
    },
  });
}
