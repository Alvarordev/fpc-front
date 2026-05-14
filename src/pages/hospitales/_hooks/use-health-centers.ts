import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { healthCentersApi } from "@/lib/api";
import type { HealthCenter, CreateHealthCenterRequest } from "@/types";

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
