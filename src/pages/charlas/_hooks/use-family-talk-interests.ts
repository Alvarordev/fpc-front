import { useQuery } from "@tanstack/react-query"
import {
  familyTalkInterestsApi,
  type FamilyTalkInterestListFilters,
} from "@/api/family-talk-interests"

export function useFamilyTalkInterests(
  filters: FamilyTalkInterestListFilters = {},
) {
  return useQuery({
    queryKey: ["family-talk-interests", filters],
    queryFn: () => familyTalkInterestsApi.list(filters),
    staleTime: 30_000,
  })
}
