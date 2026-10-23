import type { components } from "./schema"
import { api } from "./client"

export type CallCenterWorkload = components["schemas"]["CallCenterWorkloadResponseDto"]

export class CallCenterApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super("No se pudo obtener la carga del call center")
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
}
