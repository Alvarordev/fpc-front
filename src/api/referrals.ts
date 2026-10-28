import type { components } from "./schema"
import { api } from "./client"

export type Referral = components["schemas"]["ReferralResponseDto"]
export type CreateReferralInput = components["schemas"]["CreateReferralDto"]
export type UpdateReferralInput = components["schemas"]["UpdateReferralDto"]

export const referralsApi = {
  async list(patientId: string): Promise<Referral[]> {
    const { data, response } = await api.GET("/patients/{patientId}/referrals", {
      params: { path: { patientId } },
    })
    if (!data) {
      throw new Error(`No se pudieron obtener las derivaciones (${response.status})`)
    }
    return data
  },

  async route(patientId: string): Promise<Referral[]> {
    const { data, response } = await api.GET(
      "/patients/{patientId}/referrals/route",
      { params: { path: { patientId } } },
    )
    if (!data) {
      throw new Error(`No se pudo obtener la ruta de atención (${response.status})`)
    }
    return data
  },

  async create(patientId: string, input: CreateReferralInput): Promise<Referral> {
    const { data, response } = await api.POST("/patients/{patientId}/referrals", {
      params: { path: { patientId } },
      body: input,
    })
    if (!data) throw new Error(`No se pudo crear la derivación (${response.status})`)
    return data
  },

  async update(
    patientId: string,
    id: string,
    input: UpdateReferralInput,
  ): Promise<Referral> {
    const { data, response } = await api.PATCH(
      "/patients/{patientId}/referrals/{id}",
      { params: { path: { patientId, id } }, body: input },
    )
    if (!data) throw new Error(`No se pudo actualizar la derivación (${response.status})`)
    return data
  },

  async remove(patientId: string, id: string): Promise<void> {
    const { response } = await api.DELETE("/patients/{patientId}/referrals/{id}", {
      params: { path: { patientId, id } },
    })
    if (!response.ok) {
      throw new Error(`No se pudo eliminar la derivación (${response.status})`)
    }
  },
}
