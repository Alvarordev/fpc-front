import type { components, paths } from "./schema"
import { api } from "./client"

export type PatientListFilters = NonNullable<
  paths["/patients"]["get"]["parameters"]["query"]
>
export type CreatePatientInput = components["schemas"]["CreatePatientDto"]
export type UpdatePatientInput = components["schemas"]["UpdatePatientDto"]
export type DeactivatePatientInput = components["schemas"]["DeactivatePatientDto"]
export type PatientDetailsInput = components["schemas"]["UpsertPatientDetailsDto"]
export type PatientResponse = components["schemas"]["PatientResponseDto"]
export type PatientDetailsResponse =
  components["schemas"]["PatientDetailsWithSummaryResponseDto"]
export type PatientSummaryResponse = components["schemas"]["PatientSummaryResponseDto"]

export class PatientsApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super("No se pudo completar la solicitud de pacientes")
    this.name = "PatientsApiError"
    this.status = status
  }
}

export const patientsApi = {
  async list(filters: PatientListFilters = {}) {
    const { data, response } = await api.GET("/patients", {
      params: { query: filters },
    })

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async create(input: CreatePatientInput) {
    const { data, response } = await api.POST("/patients", { body: input })

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async getById(id: string) {
    const { data, response } = await api.GET("/patients/{id}", {
      params: { path: { id } },
    })

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async update(id: string, input: UpdatePatientInput) {
    const { data, response } = await api.PATCH("/patients/{id}", {
      params: { path: { id } },
      body: input,
    })

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async deactivate(id: string, input: DeactivatePatientInput) {
    const { data, response } = await api.PATCH("/patients/{id}/deactivate", {
      params: { path: { id } },
      body: input,
    })

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async reactivate(id: string) {
    const { data, response } = await api.PATCH("/patients/{id}/reactivate", {
      params: { path: { id } },
    })

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async updateDetails(id: string, input: PatientDetailsInput) {
    const { data, response } = await api.PUT("/patients/{id}/details", {
      params: { path: { id } },
      body: input,
    })

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async getSummary(id: string) {
    const { data, response } = await api.GET("/patients/{id}/summary", {
      params: { path: { id } },
    })

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },
}
