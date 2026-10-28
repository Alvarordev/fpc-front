import { apiErrorFromBody } from "./api-error"
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
    const { data, error, response } = await api.GET("/family-talk-interests", {
      params: { query: filters },
    })
    if (!data) {
      throw apiErrorFromBody(error, response.status, "No se pudieron obtener las charlas de prevención")
    }
    return data
  },
}
