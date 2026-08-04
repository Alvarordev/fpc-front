import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, type CreateUserInput } from "@/api/users";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const page = await usersApi.list();
      return page.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserInput) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
