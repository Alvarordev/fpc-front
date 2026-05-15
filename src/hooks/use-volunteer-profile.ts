import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { volunteersApi } from "@/lib/api";
import type { Volunteer } from "@/types";

/**
 * Resolves the Volunteer profile for the currently authenticated user.
 *
 * Since the User entity does not contain a `volunteerId`, we must:
 * 1. Fetch all volunteers
 * 2. Find the one whose `userId` matches the current user's `id`
 *
 * Returns the full Volunteer object (or undefined if not found / not a volunteer).
 */
export function useVolunteerProfile(): {
  volunteer: Volunteer | undefined;
  volunteerId: string | undefined;
  isLoading: boolean;
} {
  const user = useAuthStore((s) => s.user);
  const isVolunteer = user?.role === "VOLUNTEER";

  const { data: volunteer, isLoading } = useQuery({
    queryKey: ["volunteerProfile", user?.id],
    queryFn: async (): Promise<Volunteer | undefined> => {
      const all = await volunteersApi.list();
      return all.find((v) => v.userId === user!.id);
    },
    enabled: Boolean(user?.id) && isVolunteer,
    staleTime: 5 * 60 * 1000,
  });

  return {
    volunteer,
    volunteerId: volunteer?.id,
    isLoading,
  };
}
