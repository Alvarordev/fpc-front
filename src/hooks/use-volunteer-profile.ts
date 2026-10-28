import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { volunteersApi, type Volunteer } from "@/api/volunteers";

/** Profile of the signed-in volunteer (`GET /volunteers/me`). */
export function useVolunteerProfile(): {
  volunteer: Volunteer | undefined;
  volunteerId: string | undefined;
  isLoading: boolean;
} {
  const user = useAuthStore((s) => s.user);
  const isVolunteer = user?.role === "VOLUNTEER";

  const { data: volunteer, isLoading } = useQuery({
    queryKey: ["volunteerProfile", user?.id],
    queryFn: () => volunteersApi.me(),
    enabled: Boolean(user?.id) && isVolunteer,
    staleTime: 5 * 60 * 1000,
  });

  return {
    volunteer,
    volunteerId: volunteer?.id,
    isLoading,
  };
}
