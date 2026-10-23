import type { components, paths } from "./schema"
import { api } from "./client"

export type FamilyTalkInterest =
  components["schemas"]["FamilyTalkInterestResponseDto"]
export type FamilyTalkInterestListFilters = NonNullable<
  paths["/family-talk-interests"]["get"]["parameters"]["query"]
>

export const familyTalkInterestsApi = {
  async list(
    filters: FamilyTalkInterestListFilters = {},
  ): Promise<{ data: FamilyTalkInterest[]; total: number }> {
    const { data, response } = await api.GET("/family-talk-interests", {
      params: { query: filters },
    })
    if (!data) {
      throw new Error(
        `No se pudieron obtener las charlas de prevención (${response.status})`,
      )
    }
    return data
  },
}
