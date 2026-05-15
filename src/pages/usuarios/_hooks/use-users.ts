import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import type { User, CreateUserRequest } from "@/types";

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const page = await usersApi.list({ size: 100 });
      return page.content;
    },
    staleTime: 30 * 1000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserRequest) => usersApi.create(data),
    onSuccess: (_user, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      if (variables.role === "VOLUNTEER") {
        queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      }
    },
  });
}
