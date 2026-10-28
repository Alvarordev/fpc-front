import type { components } from "./schema"
import { api } from "./client"

export type CallCenterWorkload = components["schemas"]["CallCenterWorkloadResponseDto"]
export type ReassignFollowUpsInput = components["schemas"]["ReassignFollowUpsDto"]
export type ReassignFollowUpsResult =
  components["schemas"]["ReassignFollowUpsResponseDto"]

export class CallCenterApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super("No se pudo completar la solicitud del call center")
    this.name = "CallCenterApiError"
    this.status = status
  }
}

export const callCenterApi = {
  async workload(): Promise<CallCenterWorkload> {
    const { data, response } = await api.GET("/call-center/workload")

    if (!data) throw new CallCenterApiError(response.status)
    return data
  },

  async reassign(input: ReassignFollowUpsInput): Promise<ReassignFollowUpsResult> {
    const { data, response } = await api.POST("/call-center/reassign", {
      body: input,
    })

    if (!data) throw new CallCenterApiError(response.status)
    return data
  },
}
