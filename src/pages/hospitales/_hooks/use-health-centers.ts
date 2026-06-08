import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { healthCentersApi } from "@/lib/api";
import type {
  HealthCenter,
  CreateHealthCenterRequest,
  UpdateHealthCenterRequest,
} from "@/types";

export function useHealthCenters() {
  return useQuery<HealthCenter[]>({
    queryKey: ["healthCenters"],
    queryFn: () => healthCentersApi.list(),
    staleTime: 60 * 1000,
  });
}

export function useCreateHealthCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateHealthCenterRequest) =>
      healthCentersApi.create(data),
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
      data: UpdateHealthCenterRequest;
    }) => healthCentersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthCenters"] });
    },
  });
}

export function useDeleteHealthCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => healthCentersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthCenters"] });
    },
  });
}

export function useReactivateHealthCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => healthCentersApi.reactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthCenters"] });
    },
  });
}
