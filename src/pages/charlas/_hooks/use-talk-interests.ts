import { useQuery } from "@tanstack/react-query"
import {
  talkInterestsApi,
  type TalkInterestFilters,
} from "@/api/talk-interests"

export function useTalkInterests(filters: TalkInterestFilters = {}) {
  return useQuery({
    queryKey: ["talk-interests", filters],
    queryFn: () => talkInterestsApi.list(filters),
    staleTime: 30_000,
  })
}
