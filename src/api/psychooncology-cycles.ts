import type { components } from "./schema"
import { api } from "./client"

export type PsychooncologyCycle = components["schemas"]["PsychooncologyCycleResponseDto"]
export type ClosePsychooncologyCycleInput = components["schemas"]["ClosePsychooncologyCycleDto"]

export class PsychooncologyCyclesApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super("No se pudo completar la solicitud del ciclo de psicooncología")
    this.name = "PsychooncologyCyclesApiError"
    this.status = status
  }
}

export const psychooncologyCyclesApi = {
  async list(patientId: string): Promise<PsychooncologyCycle[]> {
    const { data, response } = await api.GET("/psychooncology-cycles", {
      params: { query: { patientId } },
    })

    if (!data) throw new PsychooncologyCyclesApiError(response.status)
    return data
  },

  async close(
    id: string,
    input: ClosePsychooncologyCycleInput,
  ): Promise<PsychooncologyCycle> {
    const { data, response } = await api.PATCH("/psychooncology-cycles/{id}/close", {
      params: { path: { id } },
      body: input,
    })

    if (!data) throw new PsychooncologyCyclesApiError(response.status)
    return data
  },
}
